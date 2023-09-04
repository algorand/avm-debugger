/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { EventEmitter } from 'events';
import { RuntimeEvents } from './mockDebug';
import { TEALDebuggingAssets, TxnGroupSourceDescriptor } from './utils';
import * as algosdk from 'algosdk';

export interface FileAccessor {
	isWindows: boolean;
	readFile(path: string): Promise<Uint8Array>;
	writeFile(path: string, contents: Uint8Array): Promise<void>;
}

export interface IRuntimeBreakpoint {
	id: number;
	line: number;
	verified: boolean;
}

interface IRuntimeStepInTargets {
	id: number;
	label: string;
}

interface IRuntimeStackFrame {
	index: number;
	name: string;
	file: string;
	line: number;
	column?: number;
	instruction?: number;
}

interface IRuntimeStack {
	count: number;
	frames: IRuntimeStackFrame[];
}

export type IRuntimeVariableType = number | bigint | string;

export class RuntimeVariable {
	public get value() {
		return this._value;
	}

	public set value(value: IRuntimeVariableType) {
		this._value = value;
	}

	constructor(public name: string, private _value: IRuntimeVariableType) { }
}

export function timeout(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

enum TraceType {
	logicSig,
	approval,
	clearState,
}

interface DebugExecSegment {
	txnPath: number[];
	startPCIndex: number;
	endPCIndex: number;
	traceType: TraceType;
	srcFSPath?: string;
	srcMap?: algosdk.SourceMap;
	hash: string;
}

type DebugExecTape = DebugExecSegment[];

class TxnGroupTreeWalker {
	public debugAssets: TEALDebuggingAssets;
	public execTape: DebugExecTape;
	public digestToSrc: Map<string, string[]> = new Map<string, string[]>();
	public fsPathTodigest: Map<string, string> = new Map<string, string>();
	public segmentIndex: number = 0;
	public pcIndex: number = 0;

	private preorderTraversal(
		previousPath: number[],
		currentIndex: number,
		trace: algosdk.modelsv2.SimulationTransactionExecTrace) {

		if (!trace.approvalProgramTrace && !trace.clearStateProgramTrace && !trace.innerTrace) {
			return;
		}

		let execUnits: algosdk.modelsv2.SimulationOpcodeTraceUnit[] =
			trace.approvalProgramTrace ?
				trace.approvalProgramTrace :
				<algosdk.modelsv2.SimulationOpcodeTraceUnit[]>trace.clearStateProgramTrace;

		let traceType = trace.approvalProgramTrace ? TraceType.approval : TraceType.clearState;
		let traceHash: Uint8Array = (traceType === TraceType.approval) ?
			<Uint8Array>trace.approvalProgramHash : <Uint8Array>trace.clearStateProgramHash;

		let traceHashStr = Buffer.from(<Uint8Array>traceHash).toString('base64');

		let txnSourceDescriptor: TxnGroupSourceDescriptor | undefined =
			this.debugAssets.txnGroupDescriptorList.findByHash(traceHashStr);

		let currentPath: number[] = Array.from(previousPath);
		currentPath.push(currentIndex);

		if (!trace.innerTrace) {
			this.execTape.push({
				txnPath: currentPath,
				traceType: traceType,
				srcFSPath: txnSourceDescriptor?.fileLocation.path,
				srcMap: txnSourceDescriptor?.sourcemap,
				hash: traceHashStr,
				startPCIndex: 0,
				endPCIndex: execUnits.length - 1,
			});
			return;
		}

		let startPCIndex = 0;

		for (let i = 0; i < execUnits.length; i++) {
			if (i === execUnits.length - 1) {
				this.execTape.push({
					txnPath: currentPath,
					traceType: traceType,
					srcFSPath: txnSourceDescriptor?.fileLocation.path,
					srcMap: txnSourceDescriptor?.sourcemap,
					hash: traceHashStr,
					startPCIndex: startPCIndex,
					endPCIndex: i,
				});
			}

			if (!execUnits[i].spawnedInners) {
				continue;
			}

			// push to stack current start PC index, end pc index
			this.execTape.push({
				txnPath: currentPath,
				traceType: traceType,
				srcFSPath: txnSourceDescriptor?.fileLocation.path,
				srcMap: txnSourceDescriptor?.sourcemap,
				hash: traceHashStr,
				startPCIndex: startPCIndex,
				endPCIndex: i,
			});

			// preorder traverse the inner txn group.
			let innerIndices: number[] = <number[]>execUnits[i].spawnedInners;
			for (let j = 0; j < innerIndices.length; j++) {
				this.preorderTraversal(currentPath, innerIndices[j], trace.innerTrace[innerIndices[j]]);
			}

			// if there are afterwards, update pc index and end pc index
			if (i !== execUnits.length - 1) {
				startPCIndex = i + 1;
			}
		}
	}

	public constructor(debugAssets: TEALDebuggingAssets) {
		this.debugAssets = debugAssets;
		this.execTape = [];

		for (let i = 0; i < this.debugAssets.simulateResponse.txnGroups[0].txnResults.length; i++) {
			let trace = this.debugAssets.simulateResponse.txnGroups[0].txnResults[i].execTrace;
			if (trace && trace.logicSigTrace) {
				let traceHash = trace.logicSigHash;
				let traceHashStr = Buffer.from(<Uint8Array>traceHash).toString('base64');
				let txnSourceDescriptor =
					this.debugAssets.txnGroupDescriptorList.findByHash(traceHashStr);
				let lsigSegment = {
					txnPath: [0, i],
					traceType: TraceType.logicSig,
					startPCIndex: 0,
					endPCIndex: trace.logicSigTrace.length - 1,
					srcFSPath: txnSourceDescriptor?.fileLocation.path,
					srcMap: txnSourceDescriptor?.sourcemap,
					hash: traceHashStr,
				};
				this.execTape.push(lsigSegment);
			}
		}
		// preorder traversal the traces, build the tape of exec state stack
		for (let i = 0; i < this.debugAssets.simulateResponse.txnGroups[0].txnResults.length; i++) {
			let trace = this.debugAssets.simulateResponse.txnGroups[0].txnResults[i].execTrace;
			if (trace) {
				this.preorderTraversal([0], i, trace);
			}
		}

		console.assert(this.execTape.length > 0);
		this.pcIndex = this.execTape[this.segmentIndex].startPCIndex;
	}

	public async setupSources(fileAccessor: FileAccessor) {
		for (let i = 0; i < this.execTape.length; i++) {
			let possibleHash = this.execTape[i].hash;
			if (this.digestToSrc.has(possibleHash)) {
				continue;
			}

			let possiblePath = this.execTape[i].srcFSPath;
			if (typeof possiblePath === 'undefined') {
				continue;
			}
			let sourceLines = new TextDecoder().decode(await fileAccessor.readFile(possiblePath)).split(/\r?\n/);
			this.digestToSrc.set(possibleHash, sourceLines);

			this.fsPathTodigest.set(possiblePath, possibleHash);
		}
	}

	public forward(): boolean {
		if (this.execTape[this.segmentIndex].endPCIndex > this.pcIndex) {
			this.pcIndex++;
			return true;
		} else {
			console.assert(this.execTape[this.segmentIndex].endPCIndex === this.pcIndex);

			if (this.execTape.length - 1 === this.segmentIndex) {
				// end of it, cannot go forward
				return false;
			} else {
				this.segmentIndex++;
				this.pcIndex = this.execTape[this.segmentIndex].startPCIndex;
				return true;
			}
		}
	}

	public backward(): boolean {
		if (this.execTape[this.segmentIndex].startPCIndex < this.pcIndex) {
			this.pcIndex--;
			return true;
		} else {
			console.assert(this.execTape[this.segmentIndex].startPCIndex === this.pcIndex);

			if (this.segmentIndex === 0) {
				// end of it, cannot go backwards
				return false;
			} else {
				this.segmentIndex--;
				this.pcIndex = this.execTape[this.segmentIndex].endPCIndex;
				return true;
			}
		}
	}

	public currentSourcePath(): string | undefined {
		return this.execTape[this.segmentIndex].srcFSPath;
	}

	public currentPCtoLine(): number | undefined {
		if (!this.execTape[this.segmentIndex].srcMap) {
			return undefined;
		}

		let stepArray = this.findCurrentExecSteps();
		return this.execTape[this.segmentIndex].srcMap?.getLineForPc(<number>stepArray[this.pcIndex].pc);
	}

	public getLine(number?: number): string | undefined {
		if (!this.digestToSrc.has(this.execTape[this.segmentIndex].hash)) {
			return undefined;
		}
		let lines = <string[]>this.digestToSrc.get(this.execTape[this.segmentIndex].hash);
		return lines[number === undefined ? <number>this.currentPCtoLine() : number].trim();
	}

	public get sourceLines(): string[] | undefined {
		if (!this.digestToSrc.has(this.execTape[this.segmentIndex].hash)) {
			return undefined;
		}

		return <string[]>this.digestToSrc.get(this.execTape[this.segmentIndex].hash);
	}

	public findTraceByPath(): algosdk.modelsv2.SimulationTransactionExecTrace {
		console.assert(this.execTape.length > 0);

		let path = this.execTape[this.segmentIndex].txnPath;
		let index = 0;

		let txnGroup = this.debugAssets.simulateResponse.txnGroups[path[index++]];

		let trace = <algosdk.modelsv2.SimulationTransactionExecTrace>txnGroup.txnResults[path[index++]].execTrace;

		while (path.length > index) {
			trace = (<algosdk.modelsv2.SimulationTransactionExecTrace[]>trace.innerTrace)[path[index++]];
		}

		return trace;
	}

	public findCurrentExecSteps(): algosdk.modelsv2.SimulationOpcodeTraceUnit[] {
		const trace = this.findTraceByPath();

		switch (this.execTape[this.segmentIndex].traceType) {
			case TraceType.approval:
				return <algosdk.modelsv2.SimulationOpcodeTraceUnit[]>trace.approvalProgramTrace;
			case TraceType.clearState:
				return <algosdk.modelsv2.SimulationOpcodeTraceUnit[]>trace.clearStateProgramTrace;
			case TraceType.logicSig:
				return <algosdk.modelsv2.SimulationOpcodeTraceUnit[]>trace.logicSigTrace;
			default:
				return [];
		}
	}
}

/**
 * A Mock runtime with minimal debugger functionality.
 * MockRuntime is a hypothetical (aka "teal") "execution engine with debugging support":
 * it takes a Markdown (*.md) file and "executes" it by "running" through the text lines
 * and searching for "command" patterns that trigger some debugger related functionality (e.g. exceptions).
 * When it finds a command it typically emits an event.
 * The runtime can not only run through the whole file but also executes one line at a time
 * and stops on lines for which a breakpoint has been registered. This functionality is the
 * core of the "debugging support".
 * Since the MockRuntime is completely independent from VS Code or the Debug Adapter Protocol,
 * it can be viewed as a simplified representation of a real "execution engine" (e.g. node.js)
 * or debugger (e.g. gdb).
 * When implementing your own debugger extension for VS Code, you probably don't need this
 * class because you can rely on some existing debugger or runtime.
 */
export class MockRuntime extends EventEmitter {
	private currentColumn: number | undefined;

	// maps from sourceFile to array of IRuntimeBreakpoint
	private breakPoints = new Map<string, IRuntimeBreakpoint[]>();

	private treeWalker: TxnGroupTreeWalker;

	// since we want to send breakpoint events, we will assign an id to every event
	// so that the frontend can match events with breakpoints.
	private breakpointId = 1;

	private _debugAssets: TEALDebuggingAssets;

	constructor(private fileAccessor: FileAccessor, debugAssets: TEALDebuggingAssets) {
		super();
		this._debugAssets = debugAssets;
		this.treeWalker = new TxnGroupTreeWalker(this._debugAssets);
	}

	/**
	 * Start executing the given program.
	 */
	public async start(stopOnEntry: boolean, debug: boolean): Promise<void> {
		await this.treeWalker.setupSources(this.fileAccessor);

		if (debug) {

			for (let [fsPath, _] of this.treeWalker.fsPathTodigest) {
				this.verifyBreakpoints(fsPath);
			}

			if (stopOnEntry) {
				this.findNextStatement(false, 'stopOnEntry');
			} else {
				// we just start to run until we hit a breakpoint, an exception, or the end of the program
				this.continue(false);
			}
		} else {
			this.continue(false);
		}
	}

	/**
	 * Continue execution to the end/beginning.
	 */
	public continue(reverse: boolean) {
		while (true) {
			if (this.updateCurrentLine(reverse)) {
				break;
			}
			if (this.findNextStatement(reverse)) {
				break;
			}
		}
	}

	/**
	 * Step to the next/previous non empty line.
	 */
	public step(reverse: boolean) {
		if (!this.updateCurrentLine(reverse)) {
			this.findNextStatement(reverse, RuntimeEvents.stopOnStep);
		}
	}

	private updateCurrentLine(reverse: boolean): boolean {
		if (reverse) {
			if (!this.treeWalker.backward()) {
				this.sendEvent('stopOnEntry');
				return true;
			}
		} else {
			if (!this.treeWalker.forward()) {
				this.sendEvent(RuntimeEvents.end);
				return true;
			}
		}

		return false;
	}

	/**
	 * "Step into" for Mock debug means: go to next character
	 */
	public stepIn(targetId: number | undefined) {
		if (typeof targetId === 'number') {
			this.currentColumn = targetId;
			this.sendEvent(RuntimeEvents.stopOnStep);
		} else {
			if (typeof this.currentColumn === 'number') {
				if (this.currentColumn <= (<string>this.treeWalker.getLine()).length) {
					this.currentColumn += 1;
				}
			} else {
				this.currentColumn = 1;
			}
			this.sendEvent(RuntimeEvents.stopOnStep);
		}
	}

	/**
	 * "Step out" for Mock debug means: go to previous character
	 */
	public stepOut() {
		if (typeof this.currentColumn === 'number') {
			this.currentColumn -= 1;
			if (this.currentColumn === 0) {
				this.currentColumn = undefined;
			}
		}
		this.sendEvent(RuntimeEvents.stopOnStep);
	}

	public getStepInTargets(frameId: number): IRuntimeStepInTargets[] {
		return [];
	}

	/**
	 * Returns a fake 'stacktrace' where every 'stackframe' is a word from the current line.
	 */
	public stack(startFrame: number, endFrame: number): IRuntimeStack {
		// add a sentinel so that the stack is never empty...
		const words = [{ name: 'BOTTOM', line: -1, index: -1 }];

		const frames: IRuntimeStackFrame[] = [];
		// every word of the current line becomes a stack frame.
		for (let i = startFrame; i < Math.min(endFrame, words.length); i++) {

			const stackFrame: IRuntimeStackFrame = {
				index: i,
				name: `${words[i].name}(${i})`,	// use a word of the line as the stackframe name
				file: <string>this.treeWalker.currentSourcePath(),
				line: <number>this.treeWalker.currentPCtoLine(),
			};

			frames.push(stackFrame);
		}

		return {
			frames: frames,
			count: words.length
		};
	}

	/*
	 * Set breakpoint in file with given line.
	 */
	public async setBreakPoint(path: string, line: number): Promise<IRuntimeBreakpoint> {
		path = this.normalizePathAndCasing(path);

		const bp: IRuntimeBreakpoint = { verified: false, line, id: this.breakpointId++ };
		let bps = this.breakPoints.get(path);
		if (!bps) {
			bps = new Array<IRuntimeBreakpoint>();
			this.breakPoints.set(path, bps);
		}
		bps.push(bp);

		this.verifyBreakpoints(path);

		return bp;
	}

	/*
	 * Clear breakpoint in file with given line.
	 */
	public clearBreakPoint(path: string, line: number): IRuntimeBreakpoint | undefined {
		const bps = this.breakPoints.get(this.normalizePathAndCasing(path));
		if (bps) {
			const index = bps.findIndex(bp => bp.line === line);
			if (index >= 0) {
				const bp = bps[index];
				bps.splice(index, 1);
				return bp;
			}
		}
		return undefined;
	}

	public clearBreakpoints(path: string): void {
		this.breakPoints.delete(this.normalizePathAndCasing(path));
	}

	public getScratchVariables(cancellationToken?: () => boolean): RuntimeVariable[] {

		let a: RuntimeVariable[] = [];

		let scratchMap: Map<number, IRuntimeVariableType> = new Map<number, IRuntimeVariableType>();

		if (cancellationToken && cancellationToken()) { return a; }

		const execUnits = this.treeWalker.findCurrentExecSteps();

		for (let i = 0; i < this.treeWalker.pcIndex; i++) {
			const unit = execUnits[i];
			const scratchWrites: algosdk.modelsv2.ScratchChange[] = unit.scratchChanges ? unit.scratchChanges : [];

			for (let j = 0; j < scratchWrites.length; j++) {
				scratchMap.set(<number>scratchWrites[j].slot, this.avmValueToRTV(scratchWrites[j].newValue));
			}
		}

		for (let [key, value] of scratchMap) {
			a.push(new RuntimeVariable(`slot ` + key, value));
		}

		a.sort((rt0: RuntimeVariable, rt1: RuntimeVariable) => rt0.name > rt1.name ? 1 : -1);

		return a;
	}

	public getStackVariables(cancellationToken?: () => boolean): RuntimeVariable[] {

		let a: RuntimeVariable[] = [];

		if (cancellationToken && cancellationToken()) { return a; }

		const execUnits = this.treeWalker.findCurrentExecSteps();

		for (let i = 0; i < this.treeWalker.pcIndex; i++) {
			const unit = execUnits[i];
			const stackAdditions: algosdk.modelsv2.AvmValue[] = unit.stackAdditions ? unit.stackAdditions : [];
			const popCount = unit.stackPopCount ? unit.stackPopCount : 0;
			for (let j = 0; j < popCount; j++) { a.shift(); }
			for (let j = 0; j < stackAdditions.length; j++) {
				let stackVar: IRuntimeVariableType = this.avmValueToRTV(stackAdditions[j]);
				a.unshift(new RuntimeVariable("", stackVar));
			}
		}

		for (let i = 0; i < a.length; i++) {
			a[i].name = i.toString();
		}

		return a;
	}

	/**
	 * return true on stop
	 */
	private findNextStatement(reverse: boolean, stepEvent?: string): boolean {
		while (true) {
			const srcPath = this.treeWalker.currentSourcePath();
			if (!srcPath) {
				continue;
			}
			const possibleLine = this.treeWalker.currentPCtoLine();
			const breakpoints = this.breakPoints.get(srcPath);

			if (typeof possibleLine !== 'undefined' && breakpoints) {
				const bps = breakpoints.filter(bp => bp.line === <number>possibleLine);
				if (bps.length > 0) {
					// send 'stopped' event
					this.sendEvent(RuntimeEvents.stopOnBreakpoint);

					// the following shows the use of 'breakpoint' events to update properties of a breakpoint in the UI
					// if breakpoint is not yet verified, verify it now and send a 'breakpoint' update event
					if (!bps[0].verified) {
						bps[0].verified = true;
						this.sendEvent('breakpointValidated', bps[0]);
					}

					return true;
				}
			}

			if (typeof possibleLine !== 'undefined') {
				const line = <string>this.treeWalker.getLine(possibleLine);
				if (line.length > 0) {
					break;
				}
			}

			let stepResult: boolean;
			if (reverse) {
				stepResult = this.treeWalker.backward();
			} else {
				stepResult = this.treeWalker.forward();
			}

			if (!stepResult) {
				break;
			}
		}

		if (stepEvent) {
			this.sendEvent(stepEvent);
			return true;
		}
		return false;
	}

	// Helper functions

	private avmValueToRTV(avmValue: algosdk.modelsv2.AvmValue): IRuntimeVariableType {
		let runtimeVar: IRuntimeVariableType;

		if (avmValue.type === 1) {

			// STOLEN FROM ALGOSDK
			const lineBreakOrd = '\n'.charCodeAt(0);
			const blankSpaceOrd = ' '.charCodeAt(0);
			const tildeOrd = '~'.charCodeAt(0);
			const isPrintable = (x: number) => blankSpaceOrd <= x && x <= tildeOrd;
			const isAsciiPrintable = (<Uint8Array>avmValue.bytes).every(
				(x: number) => x === lineBreakOrd || isPrintable(x)
			);

			if (isAsciiPrintable) {
				runtimeVar = String.fromCharCode(...<Uint8Array>avmValue.bytes);
			} else {
				runtimeVar = Buffer.from(<Uint8Array>avmValue.bytes).toString('base64');
			}
		} else {
			if (!avmValue.uint) {
				runtimeVar = 0;
			} else if (typeof avmValue.uint === 'number') {
				runtimeVar = <number>avmValue.uint;
			} else {
				runtimeVar = <bigint>avmValue.uint;
			}
		}

		return runtimeVar;
	}

	private verifyBreakpoints(path: string) {

		const bps = this.breakPoints.get(path);
		const digest = this.treeWalker.fsPathTodigest.get(path);
		if (!digest) {
			return;
		}
		const lines = <string[]>this.treeWalker.digestToSrc.get(digest);
		if (bps) {
			bps.forEach(bp => {
				if (!bp.verified && bp.line < lines.length) {
					while (true) {
						if (lines[bp.line].length === 0) {
							bp.line++;
							continue;
						}
						if (/^\s*\S+:/ig.exec(lines[bp.line])) {
							bp.line++;
							continue;
						}
						break;
					}

					bp.verified = true;
					this.sendEvent('breakpointValidated', bp);
				}
			});
		}
	}

	private sendEvent(event: string, ...args: any[]): void {
		setTimeout(() => {
			this.emit(event, ...args);
		}, 0);
	}

	private normalizePathAndCasing(path: string) {
		if (this.fileAccessor.isWindows) {
			return path.replace(/\//g, '\\').toLowerCase();
		} else {
			return path.replace(/\\/g, '/');
		}
	}
}
