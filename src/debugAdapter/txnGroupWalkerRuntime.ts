import { EventEmitter } from 'events';
import { RuntimeEvents } from './debugRequestHandlers';
import { AppState } from './appState';
import { FrameSourceLocation, TraceReplayEngine, TraceReplayStackFrame } from './traceReplayEngine';
import { FileAccessor, TEALDebuggingAssets, TxnGroupSourceDescriptor } from './utils';

export interface IRuntimeBreakpoint {
	id: number;
	verified: boolean;
	location: IRuntimeBreakpointLocation;
}

export interface IRuntimeBreakpointLocation {
	line: number;
	column?: number;
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
					this.verifyBreakpoints(fsPath.fileLocation, false);
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
	 * Continue execution to the end/beginning.
	 */
	public continue(reverse: boolean) {
		this.nextTickWithErrorReporting(() => {
			while (true) {
				if (!this.updateCurrentLine(reverse)) {
					break;
				}
				if (this.hitBreakpoint()) {
					break;
				}
			}
		});
	}

	/**
	 * "Step into"
	 */
	public stepIn(targetId: number | undefined) {
		this.nextTickWithErrorReporting(() => {
			if (this.updateCurrentLine(false)) {
				if (!this.hitBreakpoint()) {
					this.sendEvent(RuntimeEvents.stopOnStep);
				}
			}
		});
	}

	/**
	 * "Step out"
	 */
	public stepOut() {
		const targetStackDepth = this.engine.stack.length - 1;
		if (targetStackDepth <= 0) {
			this.continue(false);
		}
		this.nextTickWithErrorReporting(() => {
			while (targetStackDepth < this.engine.stack.length) {
				if (!this.updateCurrentLine(false)) {
					return;
				}
				if (this.hitBreakpoint()) {
					return;
				}
			}
			this.sendEvent(RuntimeEvents.stopOnStep);
		});
	}

	/**
	 * "Step over"
	 */
	public step(reverse: boolean) {
		const targetStackDepth = this.engine.stack.length;
		this.nextTickWithErrorReporting(() => {
			do {
				if (!this.updateCurrentLine(reverse)) {
					return;
				}
				if (this.hitBreakpoint()) {
					return;
				}
			} while (targetStackDepth < this.engine.stack.length);
			this.sendEvent(RuntimeEvents.stopOnStep);
		});
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
	 * Return all possible breakpoint locations for the file with given path.
	 */
	public breakpointLocations(path: string): IRuntimeBreakpointLocation[] {
		path = this.normalizePathAndCasing(path);

		let sourceDescriptor: TxnGroupSourceDescriptor | undefined = undefined;
		for (const [_, entrySourceInfo] of this.engine.programHashToSource.entriesHex()) {
			if (entrySourceInfo && entrySourceInfo.fileLocation === path) {
				sourceDescriptor = entrySourceInfo;
				break;
			}
		}
		if (sourceDescriptor) {
			const locations: IRuntimeBreakpointLocation[] = [];
			for (const pc of sourceDescriptor.sourcemap.getPcs()) {
				const location = sourceDescriptor.sourcemap.getLocationForPc(pc)!;
				locations.push(location);
			}
			return locations;
		}

		return [];
	}

	/*
	 * Set breakpoint in file with given line.
	 */
	public setBreakPoint(path: string, line: number, column?: number): IRuntimeBreakpoint {
		path = this.normalizePathAndCasing(path);

		const bp: IRuntimeBreakpoint = { verified: false, location: { line, column }, id: this.breakpointId++ };
		let bps = this.breakPoints.get(path);
		if (!bps) {
			bps = [];
			this.breakPoints.set(path, bps);
		}
		bps.push(bp);

		this.verifyBreakpoints(path, true);

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

	private hitBreakpoint(): boolean {
		const frame = this.engine.currentFrame();
		const sourceInfo = frame.sourceFile();
		const sourceLocation = frame.sourceLocation();
		if (sourceInfo.path) {
			const breakpoints = this.breakPoints.get(sourceInfo.path) || [];
			const bps = breakpoints.filter(bp => this.isFrameLocationOnBreakpoint(sourceLocation, bp.location));
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

	private verifyBreakpoints(path: string, silent: boolean) {
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
		if (sourceDescriptor) {
			for (const bp of bps) {
				if (!bp.verified) {
					let location = bp.location;

					const pcs = sourceDescriptor.sourcemap.getPcsForLine(location.line);
					if (typeof location.column === 'undefined' && pcs.length !== 0) {
						const sortedPcs = pcs.slice().sort((a, b) => a.column - b.column);
						location.column = sortedPcs[0].column;
						if (!silent) {
							this.sendEvent(RuntimeEvents.breakpointLocationChanged, bp);
						}
					}

					if (typeof location.column !== 'undefined' && pcs.some(({ column }) => column === location.column)) {
						bp.verified = true;
						if (!silent) {
							this.sendEvent(RuntimeEvents.breakpointValidated, bp);
						}
					}
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

	private isFrameLocationOnBreakpoint(location: FrameSourceLocation, bp: IRuntimeBreakpointLocation): boolean {
		if (location.line !== bp.line) {
			return false;
		}
		if (typeof bp.column === 'undefined' || typeof location.column === 'undefined') {
			return true;
		}
		return bp.column === location.column;
	}
}
