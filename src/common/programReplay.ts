import {
  AvmValue,
  SimulationOpcodeTraceUnit,
} from 'algosdk/dist/types/client/v2/algod/models/types';
import { FrameSource, CallStackFrame } from './traceReplayEngine';
import {
  ByteArrayMap,
  isPuyaSourceMap,
  PCEvent,
  ProgramSourceDescriptor,
} from './utils';
import algosdk from 'algosdk';
import { AppState } from './appState';

const HIDE_VERSION = true;
const DEFINED_ONLY = true;
const INCLUDE_STACK_SCOPE = false;
const HIDE_TEMP = true;

class MutableCallStack implements CallStackFrame {
  public readonly name: string;
  private definedVariables: Record<string, boolean>;
  private _paramVariables: string[];
  private stack: string[];

  constructor(
    public readonly callEvent: PCEvent,
    public source: FrameSource | undefined,
    public stackOffset: number,
    private readonly parent: ProgramReplay,
  ) {
    if (callEvent.callsub === undefined) {
      throw Error('Invalid enter to begin a frame');
    }
    this.name = callEvent.callsub;
    this.definedVariables = {};
    this._paramVariables = [];
    this.stack = [];
  }

  public get paramVariables() {
    return this._paramVariables;
  }

  public set paramVariables(value: string[]) {
    this._paramVariables = value;
    // params are always defined
    this.setDefinedVariables(value);
  }

  public get programState() {
    const knownStack = this.parent.stack.slice(
      this.stackOffset,
      this.stackOffset + this.stackVariables.length,
    );
    const variables: Record<string, AvmValue> = {};
    knownStack.forEach((value, index) => {
      const variableScope = this.stackVariables[index];
      let variable = variableScope[0];
      const scope = variableScope[1];
      if (HIDE_TEMP && variable.indexOf('%') >= 0) {
        return;
      }
      if (!DEFINED_ONLY || this.definedVariables[variable]) {
        if (HIDE_VERSION) {
          variable = variable.split('#', 2)[0];
        }
        if (INCLUDE_STACK_SCOPE) {
          variable = variable + ` (${scope})`;
        }
        variables[variable] = value;
      }
    });

    return {
      stack: this.parent.stack,
      scratch: this.parent.scratch,
      pc: this.parent.nextPc,
      op: this.parent.nextPcEvent?.op,
      appId: this.parent.appId,
      variables: Object.entries(variables).sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    };
  }
  get stackVariables(): string[][] {
    return [
      ...this.paramVariables.map((v) => [v, 'p']),
      ...this.stack.map((v) => [v, 's']),
    ];
  }

  private setDefinedVariables(variables: string[]) {
    for (const variable of variables) {
      this.definedVariables[variable] = true;
    }
  }

  public applyIn(event: PCEvent) {
    if (event.params !== undefined) {
      const params = Object.keys(event.params);
      this.stackOffset = this.parent.stack.length - params.length;
      this.paramVariables = params;
    }
    if (event.stack_in !== undefined) {
      this.stack = event.stack_in;
    }
  }

  public applyOut(event: PCEvent) {
    if (event.stack_out !== undefined) {
      this.stack = event.stack_out;
    }
    if (event.defined_out !== undefined) {
      this.setDefinedVariables(event.defined_out);
    }
  }
}

export class ProgramReplay {
  public stack: AvmValue[] = [];
  public scratch: Map<number, AvmValue> = new Map();
  private traceIndex: number = 0;
  private _callStack: MutableCallStack[] = [];
  private readonly sourceInfo: ProgramSourceDescriptor | undefined;
  private currentAppState: Map<bigint, AppState>;

  constructor(
    private readonly programName: string,
    private readonly programTrace: SimulationOpcodeTraceUnit[],
    sourceInfo: ProgramSourceDescriptor | undefined,
    public readonly appId: bigint | undefined,
    currentAppState: Map<bigint, AppState>,
  ) {
    if (isPuyaSourceMap(sourceInfo?.json)) {
      this.sourceInfo = checkTraceMatchesSourceInfo(programTrace, sourceInfo);
    } else {
      // If value is undefined, we still set it given that this can signify that user
      // wants to skip debugging for this particular program
      this.sourceInfo = sourceInfo;
    }

    this.currentAppState = currentAppState;
    this.reset();
  }

  private pushCallStack(event: PCEvent) {
    this._callStack.push(
      new MutableCallStack(event, this.nextPcSource, this.stack.length, this),
    );
  }

  get nextOpTrace() {
    if (this.traceIndex >= this.programTrace.length) {
      return this.programTrace[this.programTrace.length - 1];
    }

    return this.programTrace[this.traceIndex];
  }

  get nextPc() {
    return this.nextOpTrace?.pc;
  }

  get nextPcEvent(): PCEvent | undefined {
    if (
      this.nextPc === undefined &&
      (this.sourceInfo === undefined ||
        this.sourceInfo.json.pc_events === undefined)
    ) {
      return undefined;
    }
    return this.sourceInfo?.json.pc_events?.[this.nextPc.toString()];
  }

  get nextPcSource(): FrameSource | undefined {
    if (this.sourceInfo === undefined) {
      return undefined;
    }
    const location = this.sourceInfo.sourcemap.getLocationForPc(this.nextPc);
    if (location == undefined) {
      return undefined;
    }
    const line = location.line;
    const column = location.column;
    const sourceIndex = location.sourceIndex;
    const source = this.sourceInfo.getFullSourcePath(sourceIndex);

    return {
      name: source,
      path: source,
      line: line,
      column: column,
    };
  }

  get callStack(): CallStackFrame[] {
    return this._callStack;
  }

  get topCallStack(): MutableCallStack {
    return this._callStack[this._callStack.length - 1];
  }

  get ended() {
    return this.nextOpTrace === undefined;
  }

  public forward(): void {
    if (this.traceIndex === this.programTrace.length) {
      return;
    }
    this.processOpExit();
    this.processUnit(this.nextOpTrace);
    this.traceIndex++;
    if (this.traceIndex < this.programTrace.length) {
      this.processOpEnter();
      this.updateSource();
    }
  }

  public reset() {
    this.stack = [];
    this.scratch = new Map();
    this.traceIndex = 0;
    this._callStack = [];
    this.pushCallStack({ callsub: this.programName });
    this.processOpEnter();
  }

  private updateSource() {
    this._callStack[this._callStack.length - 1].source = this.nextPcSource;
  }

  private processUnit(unit: algosdk.modelsv2.SimulationOpcodeTraceUnit) {
    if (unit.stateChanges && unit.stateChanges.length !== 0) {
      const appID = this.appId;
      if (typeof appID === 'undefined') {
        throw new Error('No appID');
      }

      const state = this.currentAppState.get(appID);
      if (!state) {
        throw new Error(`No state for appID ${appID}`);
      }

      for (const stateChange of unit.stateChanges) {
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
              const accountAddress = stateChange.account!.toString();
              let accountState = state.localState.get(accountAddress);
              if (!accountState) {
                accountState = new ByteArrayMap<algosdk.modelsv2.AvmValue>();
                state.localState.set(accountAddress, accountState);
              }
              accountState.set(stateChange.key, stateChange.newValue!);
            } else if (stateChange.operation === 'd') {
              const accountState = state.localState.get(
                stateChange.account!.toString(),
              );
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
      }
    }
  }

  private processOpEnter() {
    const event = this.nextPcEvent;
    if (event !== undefined) {
      this.topCallStack.applyIn(event);
    }
  }

  private processOpExit() {
    const next = this.nextOpTrace;

    const stackPopCount = next.stackPopCount ? Number(next.stackPopCount) : 0;
    if (stackPopCount > this.stack.length) {
      throw new Error(
        `Stack underflow at pc ${this.nextPc}: ${stackPopCount} > ${this.stack.length}`,
      );
    }
    this.stack = this.stack.slice(0, this.stack.length - stackPopCount);
    if (next.stackAdditions) {
      this.stack.push(...next.stackAdditions);
    }

    for (const scratchWrite of next.scratchChanges || []) {
      const slot = Number(scratchWrite.slot);
      if (slot < 0 || slot >= 256) {
        throw new Error(`Invalid scratch slot ${slot}`);
      }
      const newValue = scratchWrite.newValue;
      if (newValue.type === 2 && !newValue.uint) {
        // When setting to 0, delete the entry, since 0 is the default.
        this.scratch.delete(slot);
      } else {
        this.scratch.set(slot, newValue);
      }
    }

    const event = this.nextPcEvent;
    if (event !== undefined) {
      if (event.params !== undefined) {
        const params = Object.keys(event.params);
        this.topCallStack.stackOffset = this.stack.length - params.length;
        this.topCallStack.paramVariables = params;
      }
      if (event.callsub !== undefined) {
        this.pushCallStack(event);
      } else if (event.retsub !== undefined) {
        const last = this._callStack.pop();
        if (last === undefined) {
          throw Error('empty call stack');
        }
        this.topCallStack.applyOut(last.callEvent);
      } else {
        this.topCallStack.applyOut(event);
      }
    }
  }
}

function checkTraceMatchesSourceInfo(
  traces: SimulationOpcodeTraceUnit[],
  sourceInfo: ProgramSourceDescriptor | undefined,
): ProgramSourceDescriptor {
  if (sourceInfo === undefined) {
    throw Error('missing program source information');
  }
  const offset = sourceInfo.json.op_pc_offset || 0;
  const pcOffset = offset === 0 ? offset : traces[offset].pc;
  let events = sourceInfo.json.pc_events;
  if (events === undefined) {
    throw Error('not a puya source map');
  }

  events = Object.fromEntries(
    Object.entries(events).map((entry) => [
      (+entry[0] + pcOffset).toString(),
      entry[1],
    ]),
  );
  for (const trace of traces) {
    if (events[trace.pc] === undefined && trace.pc >= pcOffset) {
      throw Error('source map is not valid for program trace');
    }
  }

  const json = {
    ...sourceInfo.json,
    pc_events: events,
  };
  const sourcemap = {
    ...sourceInfo.sourcemap,
    getLocationForPc: (pc) => {
      if (pc < pcOffset) {
        return undefined;
      }
      return sourceInfo?.sourcemap.getLocationForPc(pc - pcOffset);
    },
  } as unknown as algosdk.ProgramSourceMap;

  return new ProgramSourceDescriptor(
    sourceInfo.fileAccessor,
    sourceInfo.sourcemapFileLocation,
    json,
    sourcemap,
    sourceInfo.hash,
  );
}
