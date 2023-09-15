/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { EventEmitter } from 'events';
import { RuntimeEvents } from './debugRequestHandlers';
import { TEALDebuggingAssets, TxnGroupSourceDescriptor, ByteArrayMap } from './utils';
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

		let traceHashStr = Buffer.from(traceHash).toString('base64');

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

	public findTxnByPath(): algosdk.modelsv2.PendingTransactionResponse {
		console.assert(this.execTape.length > 0);

		let path = this.execTape[this.segmentIndex].txnPath;
		let index = 0;

		let txnGroup = this.debugAssets.simulateResponse.txnGroups[path[index++]];

		let txn = txnGroup.txnResults[path[index++]].txnResult;

		while (path.length > index) {
			txn = txn.innerTxns![path[index++]];
		}

		return txn;
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
				return trace.approvalProgramTrace!;
			case TraceType.clearState:
				return trace.clearStateProgramTrace!;
			case TraceType.logicSig:
				return trace.logicSigTrace!;
			default:
				return [];
		}
	}

	public forEachTraceBeforeCurrent(callback: (trace: algosdk.modelsv2.SimulationTransactionExecTrace, appID: number) => void) {
		console.assert(this.execTape.length > 0);

		let path = this.execTape[this.segmentIndex].txnPath;
		
		for (let i = 0; i < path[0]; i++) {
			const group = this.debugAssets.simulateResponse.txnGroups[i];
			const txnResultsLimit = i === path[0]-1 ? path[1] : group.txnResults.length;
			for (let j = 0; j < txnResultsLimit; j++) {
				const txnResult = group.txnResults[j];
				const pathForRecursiveCall = j === path[1]-1 ? path.slice(2) : undefined;
				recursiveForEachTrace(txnResult.execTrace, txnResult.txnResult, pathForRecursiveCall, (trace, txnInfo) => {
					callback(trace, txnInfo.txn.txn.apid || Number(txnInfo.applicationIndex));
				});
			}
		}
	}

	public forEachUnit(filter: 'app' | 'logicsig' | 'all', callback: (unit: algosdk.modelsv2.SimulationOpcodeTraceUnit, txnInfo: algosdk.modelsv2.PendingTransactionResponse) => void) {
		for (const group of this.debugAssets.simulateResponse.txnGroups) {
			for (const txnResult of group.txnResults) {
				recursiveForEachTrace(txnResult.execTrace, txnResult.txnResult, undefined, (trace, txnInfo) => {
					if (filter === 'logicsig' || filter === 'all') {
						for (const unit of trace.logicSigTrace || []) {
							callback(unit, txnInfo);
						}
					}
					if (filter === 'app' || filter === 'all') {
						for (const unit of trace.approvalProgramTrace || []) {
							callback(unit, txnInfo);
						}
						for (const unit of trace.clearStateProgramTrace || []) {
							callback(unit, txnInfo);
						}
					}
				});
			}
		}
	}
}

function recursiveForEachTrace(trace: algosdk.modelsv2.SimulationTransactionExecTrace | undefined, txnInfo: algosdk.modelsv2.PendingTransactionResponse, pathLimit: number[] | undefined, callback: (trace: algosdk.modelsv2.SimulationTransactionExecTrace, txnInfo: algosdk.modelsv2.PendingTransactionResponse) => void) {
	if (!trace) {
		return;
	}
	callback(trace, txnInfo);
	if (trace.innerTrace) {
		const innerLimit = pathLimit ? pathLimit[0] : trace.innerTrace.length;
		for (let i = 0; i < innerLimit; i++) {
			recursiveForEachTrace(trace.innerTrace[i], txnInfo.innerTxns![i], pathLimit?.slice(1), callback);
		}
	}
}

function createAvmKvArray(map: ByteArrayMap<algosdk.modelsv2.AvmValue>): algosdk.modelsv2.AvmKeyValue[] {
	return Array.from(map.entriesHex())
		.sort()
		.map(([key, value]) => new algosdk.modelsv2.AvmKeyValue({ key: Buffer.from(key, 'hex'), value }));
}

export class AppState {
	globalState: ByteArrayMap<algosdk.modelsv2.AvmValue>;
	localState: Map<string, ByteArrayMap<algosdk.modelsv2.AvmValue>>;
	boxState: ByteArrayMap<algosdk.modelsv2.AvmValue>;

	constructor() {
		this.globalState = new ByteArrayMap<algosdk.modelsv2.AvmValue>();
		this.localState = new Map<string, ByteArrayMap<algosdk.modelsv2.AvmValue>>();
		this.boxState = new ByteArrayMap<algosdk.modelsv2.AvmValue>();
	}

	public globalStateArray(): algosdk.modelsv2.AvmKeyValue[] {
		return createAvmKvArray(this.globalState);
	}

	public localStateArray(account: string): algosdk.modelsv2.AvmKeyValue[] {
		const map = this.localState.get(account);
		if (!map) {
			return [];
		}
		return createAvmKvArray(map);
	}

	public boxStateArray(): algosdk.modelsv2.AvmKeyValue[] {
		return createAvmKvArray(this.boxState);
	}
}

export class TxnGroupWalkerRuntime extends EventEmitter {
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
				this.findNextStatement(false, RuntimeEvents.stopOnEntry);
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
			if (!this.updateCurrentLine(reverse)) {
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
		if (this.updateCurrentLine(reverse)) {
			this.findNextStatement(reverse, RuntimeEvents.stopOnStep);
		}
	}

	private updateCurrentLine(reverse: boolean): boolean {
		if (reverse) {
			if (!this.treeWalker.backward()) {
				this.sendEvent(RuntimeEvents.stopOnEntry);
				return false;
			}
		} else {
			if (!this.treeWalker.forward()) {
				this.sendEvent(RuntimeEvents.end);
				return false;
			}
		}

		return true;
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
		let frames: IRuntimeStackFrame[] = [];
		for (let i = startFrame; i < Math.min(endFrame, 1); i++) {

			const stackFrame: IRuntimeStackFrame = {
				index: i,
				name: this.treeWalker.execTape[this.treeWalker.segmentIndex].txnPath.toString(),
				file: <string>this.treeWalker.currentSourcePath(),
				line: <number>this.treeWalker.currentPCtoLine(),
			};

			frames.push(stackFrame);
		}

		return {
			frames: frames,
			count: 1
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

	public clearBreakpoints(path: string): void {
		this.breakPoints.delete(this.normalizePathAndCasing(path));
	}

	public getScratchValues(): algosdk.modelsv2.AvmValue[] {
		const scratch: algosdk.modelsv2.AvmValue[] = [];
		for (let i = 0; i < 256; i++) {
			scratch.push(new algosdk.modelsv2.AvmValue({ type: 2, uint: 0 }));
		}

		// if (cancellationToken && cancellationToken()) { return a; }

		const execUnits = this.treeWalker.findCurrentExecSteps();

		for (let i = 0; i < this.treeWalker.pcIndex; i++) {
			const unit = execUnits[i];
			const scratchWrites: algosdk.modelsv2.ScratchChange[] = unit.scratchChanges || [];

			for (const scratchWrite of scratchWrites) {
				const slot = Number(scratchWrite.slot);
				if (slot < 0 || slot >= scratch.length) {
					throw new Error(`Invalid scratch slot ${slot}`);
				}
				scratch[slot] = scratchWrite.newValue;
			}
		}

		return scratch;
	}

	public getStackValues(): algosdk.modelsv2.AvmValue[] {
		let stack: algosdk.modelsv2.AvmValue[] = [];

		// if (cancellationToken && cancellationToken()) { return a; }

		const execUnits = this.treeWalker.findCurrentExecSteps();

		for (let i = 0; i < this.treeWalker.pcIndex; i++) {
			const unit = execUnits[i];
			const stackAdditions: algosdk.modelsv2.AvmValue[] = unit.stackAdditions || [];
			const popCount = unit.stackPopCount ? Number(unit.stackPopCount) : 0;

			if (popCount > stack.length) {
				throw new Error(`Stack underflow: ${popCount} > ${stack.length}`);
			}

			stack = stack.slice(0, stack.length - popCount);
			stack.push(...stackAdditions);
		}

		return stack;
	}

	public getAppStateReferences(): number[] {
		const apps = new Set<number>();

		const appInitialStates = this._debugAssets.simulateResponse.initialStates?.appInitialStates || [];
		for (const appInitialState of appInitialStates) {
			apps.add(Number(appInitialState.id));
		}

		this.treeWalker.forEachUnit('app', (unit, txnInfo) => {
			if (unit.stateChanges?.length) {
				if (txnInfo.txn.txn.apid) {
					apps.add(txnInfo.txn.txn.apid);
				} else if (txnInfo.applicationIndex) {
					apps.add(Number(txnInfo.applicationIndex));
				}
			}
		});

		return Array.from(apps).sort((a, b) => a - b);
	}

	public getAppLocalStateAccounts(appID: number): string[] {
		const accounts = new Set<string>();

		const appInitialStates = this._debugAssets.simulateResponse.initialStates?.appInitialStates || [];
		for (const appInitialState of appInitialStates) {
			if (appInitialState.id === appID) {
				for (const accountLocal of appInitialState.appLocals || []) {
					accounts.add(accountLocal.account!);
				}
				break;
			}
		}

		this.treeWalker.forEachUnit('app', (unit, txnInfo) => {
			const unitAppID = txnInfo.txn.txn.apid || txnInfo.applicationIndex;
			if (typeof unitAppID === 'undefined' || Number(unitAppID) !== appID) {
				return;
			}
			for (const stateChange of unit.stateChanges || []) {
				if (stateChange.appStateType === 'l') {
					accounts.add(stateChange.account!);
				}
			}
		});

		return Array.from(accounts).sort();
	}

	public getAppState(appID: number): AppState {
		const state = new AppState();

		const updateState = (stateChange: algosdk.modelsv2.ApplicationStateOperation) => {
			switch (stateChange.appStateType) {
			case 'g':
				if (stateChange.operation === 'w') {
					state.globalState.set(stateChange.key, stateChange.newValue!);
				} else if (stateChange.operation === 'd') {
					state.globalState.delete(stateChange.key);
				}
				break;
			case 'l':
				if (stateChange.operation === 'w') {
					const accountState = state.localState.get(stateChange.account!);
					if (!accountState) {
						const newState = new ByteArrayMap<algosdk.modelsv2.AvmValue>();
						newState.set(stateChange.key, stateChange.newValue!);
						state.localState.set(stateChange.account!, newState);
					} else {
						accountState.set(stateChange.key, stateChange.newValue!);
					}
				} else if (stateChange.operation === 'd') {
					const accountState = state.localState.get(stateChange.account!);
					if (accountState) {
						accountState.delete(stateChange.key);
					}
				}
				break;
			case 'b':
				if (stateChange.operation === 'w') {
					state.boxState.set(stateChange.key, stateChange.newValue!);
				} else if (stateChange.operation === 'd') {
					state.boxState.delete(stateChange.key);
				}
			}
		};

		this.treeWalker.forEachTraceBeforeCurrent((trace, traceAppID) => {
			if (traceAppID !== appID) {
				return;
			}
			for (const unit of trace.approvalProgramTrace || trace.clearStateProgramTrace || []) {
				for (const stateChange of unit.stateChanges || []) {
					updateState(stateChange);
				}
			}
		});

		const txn = this.treeWalker.findTxnByPath();
		const currentTxnApp = txn.txn.txn.apid || txn.applicationIndex;
		if (typeof currentTxnApp !== 'undefined' && Number(currentTxnApp) === appID) {
			// The current trace may have additional state updates
			const execUnits = this.treeWalker.findCurrentExecSteps();

			for (let i = 0; i < this.treeWalker.pcIndex; i++) {
				const unit = execUnits[i];
				for (const stateChange of unit.stateChanges || []) {
					updateState(stateChange);
				}
			}
		}

		return state;
	}

	/**
	 * return true on stop
	 */
	private findNextStatement(reverse: boolean, stepEvent?: string): boolean {
		while (true) {
			const srcPath = this.treeWalker.currentSourcePath();
			if (!srcPath) {

				while (true) {
					let stepResult: boolean;

					if (reverse) {
						stepResult = this.treeWalker.backward();
					} else {
						stepResult = this.treeWalker.forward();
					}
					if (!stepResult || this.treeWalker.currentSourcePath()) {
						break;
					}
				}

				continue;
			}
			const possibleLine = this.treeWalker.currentPCtoLine();
			const breakpoints = this.breakPoints.get(srcPath);

			if (typeof possibleLine !== 'undefined' && breakpoints) {
				const bps = breakpoints.filter(bp => bp.line === possibleLine);
				if (bps.length > 0) {
					// send 'stopped' event
					this.sendEvent(RuntimeEvents.stopOnBreakpoint);

					// the following shows the use of 'breakpoint' events to update properties of a breakpoint in the UI
					// if breakpoint is not yet verified, verify it now and send a 'breakpoint' update event
					if (!bps[0].verified) {
						bps[0].verified = true;
						this.sendEvent(RuntimeEvents.breakpointValidated, bps[0]);
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
					this.sendEvent(RuntimeEvents.breakpointValidated, bp);
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
