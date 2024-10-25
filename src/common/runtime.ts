/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'events';
import { RuntimeEvents } from './debugSession';
import { AppState } from './appState';
import {
  FrameSource,
  CallStackFrame,
  SteppingResultType,
  TraceReplayEngine,
} from './traceReplayEngine';
import { FileAccessor } from './fileAccessor';
import {
  AvmDebuggingAssets,
  ProgramSourceDescriptor,
  normalizePathAndCasing,
} from './utils';

export interface IRuntimeBreakpoint {
  id: number;
  verified: boolean;
  location: IRuntimeBreakpointLocation;
}

export interface IRuntimeBreakpointLocation {
  line: number;
  column?: number;
}

interface IRuntimeStack {
  count: number;
  frames: CallStackFrame[];
}

export class AvmRuntime extends EventEmitter {
  // maps from sourceFile to array of IRuntimeBreakpoint
  private readonly breakPoints = new Map<string, IRuntimeBreakpoint[]>();

  private readonly engine: TraceReplayEngine = new TraceReplayEngine();

  // since we want to send breakpoint events, we will assign an id to every event
  // so that the frontend can match events with breakpoints.
  private breakpointId = 1;

  constructor(private readonly fileAccessor: FileAccessor) {
    super();
  }

  public onLaunch(debugAssets: AvmDebuggingAssets): Promise<void> {
    return this.engine.loadResources(debugAssets);
  }

  public reset() {
    this.breakPoints.clear();
    this.breakpointId = 1;
    this.engine.reset();
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
        for (const [
          _,
          sourceDescriptor,
        ] of this.engine.programHashToSource.entriesHex()) {
          if (!sourceDescriptor) {
            continue;
          }
          for (const sourcePath of sourceDescriptor.sourcePaths()) {
            this.verifyBreakpoints(sourcePath, false);
          }
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
      const result = this.engine.backward();
      switch (result.type) {
        case SteppingResultType.END:
          this.sendEvent(RuntimeEvents.stopOnEntry);
          return false;
        case SteppingResultType.EXCEPTION:
          this.sendEvent(
            RuntimeEvents.stopOnException,
            result.exceptionInfo?.message,
          );
          return false;
      }
    } else {
      const result = this.engine.forward();
      switch (result.type) {
        case SteppingResultType.END:
          this.sendEvent(RuntimeEvents.end);
          return false;
        case SteppingResultType.EXCEPTION:
          this.sendEvent(
            RuntimeEvents.stopOnException,
            result.exceptionInfo?.message,
          );
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
      for (;;) {
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
    const targetStackDepth = this.stackLength - 1;
    if (targetStackDepth <= 0) {
      this.continue(false);
    }
    this.nextTickWithErrorReporting(() => {
      while (targetStackDepth < this.stackLength) {
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
    const targetStackDepth = this.stackLength;
    this.nextTickWithErrorReporting(() => {
      do {
        if (!this.updateCurrentLine(reverse)) {
          return;
        }
        if (this.hitBreakpoint()) {
          return;
        }
      } while (targetStackDepth < this.stackLength);
      this.sendEvent(RuntimeEvents.stopOnStep);
    });
  }

  public get stackLength(): number {
    return this.getStack().length;
  }

  /**
   * Returns a 'stacktrace' where every frame is a TraceReplayStackFrame.
   */
  public stack(startFrame: number, endFrame: number): IRuntimeStack {
    const stack = this.getStack();
    if (stack.length < endFrame) {
      endFrame = stack.length;
    }
    return {
      frames: stack.slice(startFrame, endFrame),
      count: stack.length,
    };
  }

  private getStack(): CallStackFrame[] {
    const result: CallStackFrame[] = [];
    for (const frame of this.engine.stack) {
      for (const f of frame.callStack) {
        result.push(f);
      }
    }
    result.reverse();
    return result;
  }

  public getStackFrame(index: number): CallStackFrame | undefined {
    const stack = this.getStack();
    return stack[index];
  }

  /*
   * Return all possible breakpoint locations for the file with given path.
   */
  public breakpointLocations(filePath: string): IRuntimeBreakpointLocation[] {
    const locations: IRuntimeBreakpointLocation[] = [];

    const sourceDescriptors = this.findSourceDescriptorsForPath(filePath);
    for (const { descriptor, sourceIndex } of sourceDescriptors) {
      for (const pc of descriptor.sourcemap.getPcs()) {
        const location = descriptor.sourcemap.getLocationForPc(pc)!;
        if (location.sourceIndex === sourceIndex) {
          locations.push({
            line: location.line,
            column: location.column,
          });
        }
      }
    }

    return locations;
  }

  /*
   * Set breakpoint in file with given line.
   */
  public setBreakPoint(
    path: string,
    line: number,
    column?: number,
  ): IRuntimeBreakpoint {
    path = normalizePathAndCasing(this.fileAccessor, path);

    const bp: IRuntimeBreakpoint = {
      verified: false,
      location: { line, column },
      id: this.breakpointId++,
    };
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
    this.breakPoints.delete(normalizePathAndCasing(this.fileAccessor, path));
  }

  public getAppStateReferences(): bigint[] {
    const apps = Array.from(this.engine.initialAppState.keys());
    return apps.sort((a, b) => Number(a - b));
  }

  public getAppLocalStateAccounts(appID: bigint): string[] {
    const app = this.engine.initialAppState.get(appID);
    if (!app) {
      return [];
    }
    const accounts = Array.from(app.localState.keys());
    return accounts.sort();
  }

  public getAppState(appID: bigint): AppState {
    return this.engine.currentAppState.get(appID) || new AppState();
  }

  private hitBreakpoint(): boolean {
    const stack = this.getStack();
    const frame = stack[0];
    const source = frame.source;
    if (source && source.path) {
      const breakpoints = this.breakPoints.get(source.path) || [];
      const bps = breakpoints.filter((bp) =>
        this.isFrameLocationOnBreakpoint(source, bp.location),
      );
      if (bps.length !== 0) {
        // send 'stopped' event
        this.sendEvent(RuntimeEvents.stopOnBreakpoint, bps[0].id);

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

    const sourceDescriptors = this.findSourceDescriptorsForPath(path);
    for (const bp of bps) {
      if (bp.verified) {
        continue;
      }
      const location = bp.location;
      for (const { descriptor, sourceIndex } of sourceDescriptors) {
        const pcs = descriptor.sourcemap.getPcsOnSourceLine(
          sourceIndex,
          location.line,
        );
        if (typeof location.column === 'undefined' && pcs.length !== 0) {
          const sortedPcs = pcs.slice().sort((a, b) => a.pc - b.pc);
          location.column = sortedPcs[0].column;
        }

        if (
          typeof location.column !== 'undefined' &&
          pcs.some(({ column }) => column === location.column)
        ) {
          bp.verified = true;
          if (!silent) {
            this.sendEvent(RuntimeEvents.breakpointValidated, bp);
          }
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sendEvent(event: string, ...args: any[]): void {
    setTimeout(() => {
      this.emit(event, ...args);
    }, 0);
  }

  private isFrameLocationOnBreakpoint(
    location: FrameSource,
    bp: IRuntimeBreakpointLocation,
  ): boolean {
    if (location.line !== bp.line) {
      return false;
    }
    if (
      typeof bp.column === 'undefined' ||
      typeof location.column === 'undefined'
    ) {
      return true;
    }
    return bp.column === location.column;
  }

  private findSourceDescriptorsForPath(
    filePath: string,
  ): Array<{ descriptor: ProgramSourceDescriptor; sourceIndex: number }> {
    filePath = normalizePathAndCasing(this.fileAccessor, filePath);

    const sourceDescriptors: Array<{
      descriptor: ProgramSourceDescriptor;
      sourceIndex: number;
    }> = [];

    for (const [
      _,
      entrySourceInfo,
    ] of this.engine.programHashToSource.entriesHex()) {
      if (!entrySourceInfo) {
        continue;
      }
      const entrySourceIndex = entrySourceInfo.sourcePaths().indexOf(filePath);
      if (entrySourceIndex !== -1) {
        sourceDescriptors.push({
          descriptor: entrySourceInfo,
          sourceIndex: entrySourceIndex,
        });
      }
    }

    return sourceDescriptors;
  }
}
