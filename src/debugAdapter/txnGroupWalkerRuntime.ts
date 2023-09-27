import { EventEmitter } from 'events';
import { RuntimeEvents } from './debugRequestHandlers';
import { AppState } from './appState';
import { TraceReplayEngine, TraceReplayStackFrame } from './traceReplayEngine';
import { FileAccessor, TEALDebuggingAssets, TxnGroupSourceDescriptor } from './utils';

export interface IRuntimeBreakpoint {
	id: number;
	line: number;
	verified: boolean;
}

interface IRuntimeStepInTargets {
	id: number;
	label: string;
}

interface IRuntimeStack {
	count: number;
	frames: TraceReplayStackFrame[];
}

export class TxnGroupWalkerRuntime extends EventEmitter {
	// maps from sourceFile to array of IRuntimeBreakpoint
	private breakPoints = new Map<string, IRuntimeBreakpoint[]>();

	private engine: TraceReplayEngine;

	// since we want to send breakpoint events, we will assign an id to every event
	// so that the frontend can match events with breakpoints.
	private breakpointId = 1;

	constructor(private fileAccessor: FileAccessor, debugAssets: TEALDebuggingAssets) {
		super();
		this.engine = new TraceReplayEngine(debugAssets);
	}

	private nextTickWithErrorReporting(fn: () => Promise<void> | void) {
		setTimeout(async () => {
			try {
				await fn();
			} catch (e) {
				console.error(e);
				this.sendEvent(RuntimeEvents.error, e);
			}
		}, 0);
	}

	/**
	 * Start executing the given program.
	 */
	public start(stopOnEntry: boolean, debug: boolean) {
		this.nextTickWithErrorReporting(() => {
			if (debug) {
				for (let [_, fsPath] of this.engine.programHashToSource.entriesHex()) {
					if (!fsPath) {
						continue;
					}
					this.verifyBreakpoints(fsPath.fileLocation);
				}
	
				if (stopOnEntry) {
					this.sendEvent(RuntimeEvents.stopOnEntry);
				} else {
					// we just start to run until we hit a breakpoint, an exception, or the end of the program
					this.continue(false);
				}
			} else {
				this.continue(false);
			}
		});
	}

	/**
	 * Continue execution to the end/beginning.
	 */
	public continue(reverse: boolean) {
		this.nextTickWithErrorReporting(() => {
			while (true) {
				if (!this.updateCurrentLine(reverse)) {
					break;
				}
				if (this.checkForBreakpoints()) {
					break;
				}
			}
		});
	}

	/**
	 * Step to the next/previous non empty line.
	 */
	public step(reverse: boolean) {
		this.nextTickWithErrorReporting(() => {
			if (this.updateCurrentLine(reverse)) {
				if (!this.checkForBreakpoints()) {
					this.sendEvent(RuntimeEvents.stopOnStep);
				}
			}
		});
	}

	private updateCurrentLine(reverse: boolean): boolean {
		if (reverse) {
			if (!this.engine.backward()) {
				this.sendEvent(RuntimeEvents.stopOnEntry);
				return false;
			}
		} else {
			if (!this.engine.forward()) {
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
		// if (typeof targetId === 'number') {
		// 	this.currentColumn = targetId;
		// 	this.sendEvent(RuntimeEvents.stopOnStep);
		// } else {
		// 	if (typeof this.currentColumn === 'number') {
		// 		if (this.currentColumn <= (<string>this.treeWalker.getLine()).length) {
		// 			this.currentColumn += 1;
		// 		}
		// 	} else {
		// 		this.currentColumn = 1;
		// 	}
		// 	this.sendEvent(RuntimeEvents.stopOnStep);
		// }
		this.step(false);
	}

	/**
	 * "Step out" for Mock debug means: go to previous character
	 */
	public stepOut() {
		// if (typeof this.currentColumn === 'number') {
		// 	this.currentColumn -= 1;
		// 	if (this.currentColumn === 0) {
		// 		this.currentColumn = undefined;
		// 	}
		// }
		// this.sendEvent(RuntimeEvents.stopOnStep);
		this.step(false);
	}

	public getStepInTargets(frameId: number): IRuntimeStepInTargets[] {
		return [];
	}

	public stackLength(): number {
		return this.engine.stack.length;
	}

	/**
	 * Returns a 'stacktrace' where every frame is a TraceReplayStackFrame.
	 */
	public stack(startFrame: number, endFrame: number): IRuntimeStack {
		if (this.engine.stack.length < endFrame) {
			endFrame = this.engine.stack.length;
		}
		const frames: TraceReplayStackFrame[] = [];
		for (let i = startFrame; i < endFrame; i++) {
			frames.push(this.engine.stack[i]);
		}
		return {
			frames: frames,
			count: this.engine.stack.length
		};
	}

	public getStackFrame(index: number): TraceReplayStackFrame | undefined {
		if (index < 0 || index >= this.engine.stack.length) {
			return undefined;
		}
		return this.engine.stack[index];
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

	public getAppStateReferences(): number[] {
		const apps = Array.from(this.engine.initialAppState.keys());
		return apps.sort((a, b) => a - b);
	}

	public getAppLocalStateAccounts(appID: number): string[] {
		const app = this.engine.initialAppState.get(appID);
		if (!app) {
			return [];
		}
		const accounts = Array.from(app.localState.keys());
		return accounts.sort();
	}

	public getAppState(appID: number): AppState {
		return this.engine.currentAppState.get(appID) || new AppState();
	}

	private checkForBreakpoints(): boolean {
		const frame = this.engine.currentFrame();
		const sourceInfo = frame.sourceFile();
		const sourceLocation = frame.sourceLocation();
		if (sourceInfo.path) {
			const breakpoints = this.breakPoints.get(sourceInfo.path) || [];
			const bps = breakpoints.filter(bp => bp.line === sourceLocation.line);
			if (bps.length !== 0) {
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
		return false;
	}

	// Helper functions

	private verifyBreakpoints(path: string) {
		const bps = this.breakPoints.get(path);
		if (typeof bps === 'undefined') {
			return;
		}

		let sourceDescriptor: TxnGroupSourceDescriptor | undefined = undefined;
		for (const [_, entrySourceInfo] of this.engine.programHashToSource.entriesHex()) {
			if (entrySourceInfo && entrySourceInfo.fileLocation === path) {
				sourceDescriptor = entrySourceInfo;
				break;
			}
		}
		if (!sourceDescriptor) {
			return;
		}

		for (const bp of bps) {
			if (!bp.verified) {
				const pcs = sourceDescriptor.sourcemap.getPcsForLine(bp.line);
				if (pcs && pcs.length !== 0) {
					bp.verified = true;
					this.sendEvent(RuntimeEvents.breakpointValidated, bp);
				}
			}
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
