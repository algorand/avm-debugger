import * as algosdk from 'algosdk';
import { AppState } from './appState';
import {
  ByteArrayMap,
  AvmDebuggingAssets,
  ProgramSourceDescriptor,
  ProgramSourceDescriptorRegistry,
  isPuyaSourceMap,
} from './utils';
import { ProgramReplay } from './programReplay';
import { AvmValue } from 'algosdk/dist/types/client/v2/algod/models/types';

export enum SteppingResultType {
  /* eslint-disable @typescript-eslint/naming-convention */
  OK,
  END,
  EXCEPTION,
  /* eslint-enable @typescript-eslint/naming-convention */
}

export class SteppingResult {
  private constructor(
    public readonly type: SteppingResultType,
    public readonly exceptionInfo?: ExceptionInfo,
  ) {}

  public static ok(): SteppingResult {
    return new SteppingResult(SteppingResultType.OK);
  }

  public static end(): SteppingResult {
    return new SteppingResult(SteppingResultType.END);
  }

  public static exception(info: ExceptionInfo): SteppingResult {
    return new SteppingResult(SteppingResultType.EXCEPTION, info);
  }
}

export class ExceptionInfo {
  constructor(public readonly message: string) {}
}

export class TraceReplayEngine {
  public simulateResponse: algosdk.modelsv2.SimulateResponse | undefined;

  public programHashToSource: ByteArrayMap<
    ProgramSourceDescriptor | undefined
  > = new ByteArrayMap();

  public initialAppState = new Map<bigint, AppState>();
  public currentAppState = new Map<bigint, AppState>();

  public stack: TraceReplayFrame[] = [];

  public reset() {
    this.simulateResponse = undefined;
    this.programHashToSource.clear();
    this.initialAppState.clear();
    this.currentAppState.clear();
    this.stack = [];
  }

  public async loadResources(debugAssets: AvmDebuggingAssets) {
    const { simulateResponse, programSourceDescriptorRegistry } = debugAssets;
    this.simulateResponse = simulateResponse;

    for (const initialAppState of simulateResponse.initialStates
      ?.appInitialStates || []) {
      this.initialAppState.set(
        initialAppState.id,
        AppState.fromAppInitialState(initialAppState),
      );
    }

    for (
      let groupIndex = 0;
      groupIndex < simulateResponse.txnGroups.length;
      groupIndex++
    ) {
      const group = simulateResponse.txnGroups[groupIndex];

      for (let txnIndex = 0; txnIndex < group.txnResults.length; txnIndex++) {
        this.setupTxnTrace(
          simulateResponse,
          programSourceDescriptorRegistry,
          groupIndex,
          txnIndex,
        );
      }
    }

    this.resetCurrentAppState();
    this.setStartingStack(simulateResponse);
  }

  private setStartingStack(
    simulateResponse: algosdk.modelsv2.SimulateResponse,
  ) {
    this.stack = [new TopLevelTransactionGroupsFrame(this, simulateResponse)];
    if (simulateResponse.txnGroups.length === 1) {
      // If only a single group, get rid of the top-level frame
      this.forward();
      this.stack.shift();
    }
  }

  private resetCurrentAppState() {
    this.currentAppState = new Map(
      Array.from(this.initialAppState.entries(), ([key, value]) => [
        key,
        value.clone(),
      ]),
    );
  }

  private setupTxnTrace(
    simulateResponse: algosdk.modelsv2.SimulateResponse,
    programSourceDescriptorRegistry: ProgramSourceDescriptorRegistry,
    groupIndex: number,
    txnIndex: number,
  ) {
    const txnPath = [groupIndex, txnIndex];

    const txn = simulateResponse.txnGroups[groupIndex].txnResults[txnIndex];
    const trace = txn.execTrace;
    if (!trace) {
      // Probably not an app call txn
      return;
    }
    if (trace.logicSigTrace) {
      this.fetchProgramSourceInfo(
        programSourceDescriptorRegistry,
        trace.logicSigHash!,
      );
    }
    visitAppTrace(
      txnPath,
      txn.txnResult,
      trace,
      (path, programHash, txnInfo, opcodes) => {
        this.fetchProgramSourceInfo(
          programSourceDescriptorRegistry,
          programHash,
        );

        const appID =
          txnInfo.applicationIndex || txnInfo.txn.txn.applicationCall?.appIndex;
        if (typeof appID === 'undefined' || appID === BigInt(0)) {
          throw new Error(`No appID for txn at path ${path}`);
        }

        let initialAppState = this.initialAppState.get(appID);
        if (typeof initialAppState === 'undefined') {
          initialAppState = new AppState();
          this.initialAppState.set(appID, initialAppState);
        }

        for (const opcode of opcodes) {
          for (const stateChange of opcode.stateChanges || []) {
            if (stateChange.appStateType === 'l') {
              const accountAddress = stateChange.account!.toString();
              if (!initialAppState.localState.has(accountAddress)) {
                initialAppState.localState.set(
                  accountAddress,
                  new ByteArrayMap(),
                );
              }
            }
          }
        }
      },
    );
  }

  private fetchProgramSourceInfo(
    programSourceDescriptorRegistry: ProgramSourceDescriptorRegistry,
    programHash: Uint8Array,
  ) {
    if (this.programHashToSource.has(programHash)) {
      return;
    }
    const sourceDescriptor =
      programSourceDescriptorRegistry.findByHash(programHash);
    this.programHashToSource.set(programHash, sourceDescriptor);
  }

  public currentFrame(): TraceReplayFrame {
    return this.stack[this.stack.length - 1];
  }

  public forward(): SteppingResult {
    let length: number;
    do {
      length = this.stack.length;
      const exceptionInfo = this.currentFrame().forward(this.stack);
      if (exceptionInfo) {
        return SteppingResult.exception(exceptionInfo);
      }
      if (this.stack.length === 0) {
        return SteppingResult.end();
      }
    } while (this.stack.length < length);
    return SteppingResult.ok();
  }

  public backward(): SteppingResult {
    let length: number;
    do {
      length = this.stack.length;
      const exceptionInfo = this.currentFrame().backward(this.stack);
      if (this.stack.length === 0) {
        this.setStartingStack(this.simulateResponse!);
        return exceptionInfo
          ? SteppingResult.exception(exceptionInfo)
          : SteppingResult.end();
      }
    } while (this.stack.length < length);
    return SteppingResult.ok();
  }
}

function visitAppTrace(
  path: number[],
  txnInfo: algosdk.modelsv2.PendingTransactionResponse,
  trace: algosdk.modelsv2.SimulationTransactionExecTrace,
  visitor: (
    path: number[],
    programHash: Uint8Array,
    txnInfo: algosdk.modelsv2.PendingTransactionResponse,
    opcodes: algosdk.modelsv2.SimulationOpcodeTraceUnit[],
  ) => void,
) {
  if (trace.approvalProgramTrace) {
    visitor(
      path,
      trace.approvalProgramHash!,
      txnInfo,
      trace.approvalProgramTrace,
    );
  }
  if (trace.clearStateProgramTrace) {
    visitor(
      path,
      trace.clearStateProgramHash!,
      txnInfo,
      trace.clearStateProgramTrace,
    );
  }
  if (trace.innerTrace) {
    for (let i = 0; i < trace.innerTrace.length; i++) {
      const innerInfo = txnInfo.innerTxns![i];
      const innerTrace = trace.innerTrace[i];
      const innerPath = path.slice();
      innerPath.push(i);
      visitAppTrace(innerPath, innerInfo, innerTrace, visitor);
    }
  }
}

export interface FrameSource {
  name: string;
  path?: string;
  content?: string;
  contentMimeType?: string;
  line: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
}

export interface ProgramState {
  readonly stack: AvmValue[];
  readonly scratch: Map<number, AvmValue>;
  readonly pc: number;
  readonly op: string | undefined;
  readonly appId: bigint | undefined;
  readonly variables: [string, AvmValue][];
}

export interface CallStackFrame {
  /* Represents a function call within a program's call stack */
  readonly name: string;
  readonly source: FrameSource | undefined;
  readonly programState: ProgramState | undefined;
}

export interface TraceReplayFrame {
  /* 
    TraceReplayFrame represents a frame within the trace
    a program frame may have multiple call frames within in it
    one for each function in the call stack
  */

  get callStack(): CallStackFrame[];
  forward(stack: TraceReplayFrame[]): ExceptionInfo | void;
  backward(stack: TraceReplayFrame[]): ExceptionInfo | void;
}

export class TopLevelTransactionGroupsFrame
  implements TraceReplayFrame, CallStackFrame
{
  private index: number = 0;
  private txnGroupDone: boolean = false;
  constructor(
    private readonly engine: TraceReplayEngine,
    private readonly response: algosdk.modelsv2.SimulateResponse,
  ) {}

  public get callStack(): CallStackFrame[] {
    return [this];
  }

  public get programState() {
    return undefined;
  }

  public get name(): string {
    return `group ${this.index}`;
  }

  public get source(): FrameSource {
    const individualGroups = this.response.txnGroups.map((group) =>
      group.txnResults.map((txnResult) =>
        algosdk.parseJSON(algosdk.encodeJSON(txnResult.txnResult.txn), {
          intDecoding: algosdk.IntDecoding.BIGINT,
        }),
      ),
    );
    let lineOffset = 1; // For opening bracket
    for (let i = 0; i < this.index; i++) {
      for (const txnResult of this.response.txnGroups[i].txnResults) {
        const displayedTxn = txnResult.txnResult.txn;
        lineOffset += algosdk
          .encodeJSON(displayedTxn, { space: 2 })
          .split('\n').length;
      }
      lineOffset += 2; // For opening and closing brackets
    }
    let lineCount = 2; // For opening and closing brackets
    for (const txnResult of this.response.txnGroups[this.index].txnResults) {
      const displayedTxn = txnResult.txnResult.txn;
      lineCount += algosdk
        .encodeJSON(displayedTxn, { space: 2 })
        .split('\n').length;
    }
    return {
      name: `transaction-groups.json`,
      content: algosdk.stringifyJSON(individualGroups, undefined, 2),
      contentMimeType: 'application/json',
      line: lineOffset,
      endLine: lineOffset + lineCount,
    };
  }

  public forward(stack: TraceReplayFrame[]): ExceptionInfo | void {
    if (!this.txnGroupDone) {
      stack.push(this.frameForIndex(this.index));
      this.txnGroupDone = true;
      return;
    }
    if (this.index + 1 < this.response.txnGroups.length) {
      this.index++;
      this.txnGroupDone = false;
      return;
    }
    stack.pop();
  }

  private frameForIndex(index: number): TransactionGroupStackFrame {
    const txnInfos: algosdk.modelsv2.PendingTransactionResponse[] = [];
    const txnTraces: Array<
      algosdk.modelsv2.SimulationTransactionExecTrace | undefined
    > = [];
    for (const { txnResult, execTrace } of this.response.txnGroups[index]
      .txnResults) {
      txnInfos.push(txnResult);
      txnTraces.push(execTrace);
    }
    let failureInfo: TransactionFailureInfo | undefined = undefined;
    if (this.response.txnGroups[index].failedAt) {
      failureInfo = {
        message: this.response.txnGroups[index].failureMessage!,
        path: this.response.txnGroups[index].failedAt!.map((n) => Number(n)),
      };
    }
    const txnGroupFrame = new TransactionGroupStackFrame(
      this.engine,
      [index, 0],
      txnInfos,
      txnTraces,
      failureInfo,
    );
    return txnGroupFrame;
  }

  public backward(stack: TraceReplayFrame[]): ExceptionInfo | void {
    if (this.txnGroupDone) {
      this.txnGroupDone = false;
      return;
    }
    if (this.index === 0) {
      stack.pop();
      return;
    }
    this.index--;
    this.txnGroupDone = true;
  }
}

interface TransactionSourceLocation {
  line: number;
  lineEnd?: number;
  lsigLocation?: {
    line: number;
    lineEnd?: number;
  };
  appLocation?: {
    line: number;
    lineEnd?: number;
  };
}

enum ProgramStatus {
  /* eslint-disable @typescript-eslint/naming-convention */
  NOT_STARTED,
  STARTING,
  DONE,
  /* eslint-enable @typescript-eslint/naming-convention */
}

interface TransactionFailureInfo {
  message: string;
  path: number[];
}

export class TransactionGroupStackFrame implements TraceReplayFrame {
  private txnIndex: number = 0;
  private logicSigStatus: ProgramStatus = ProgramStatus.DONE;
  private appStatus: ProgramStatus = ProgramStatus.DONE;
  private onException: boolean = false;

  private sourceContent: string;
  private sourceLocations: TransactionSourceLocation[] = [];

  constructor(
    private engine: TraceReplayEngine,
    private txnPath: number[],
    private readonly txnInfos: algosdk.modelsv2.PendingTransactionResponse[],
    private readonly txnTraces: Array<
      algosdk.modelsv2.SimulationTransactionExecTrace | undefined
    >,
    private readonly failureInfo: TransactionFailureInfo | undefined,
  ) {
    const firstTrace = txnTraces[0];
    if (firstTrace) {
      if (firstTrace.logicSigTrace) {
        this.logicSigStatus = ProgramStatus.NOT_STARTED;
      }
      if (
        firstTrace.approvalProgramTrace ||
        firstTrace.clearStateProgramTrace
      ) {
        this.appStatus = ProgramStatus.NOT_STARTED;
      }
    }

    const individualTxns = this.txnInfos.map((txnInfo) =>
      algosdk.parseJSON(algosdk.encodeJSON(txnInfo.txn), {
        intDecoding: algosdk.IntDecoding.BIGINT,
      }),
    );
    this.sourceContent = algosdk.stringifyJSON(individualTxns, undefined, 2);
    let lineOffset = 1; // For opening bracket
    for (let i = 0; i < this.txnInfos.length; i++) {
      const txnInfo = this.txnInfos[i];
      const txnTrace = this.txnTraces[i];
      const displayedTxn = txnInfo.txn;
      const displayTxnLines = algosdk
        .encodeJSON(displayedTxn, { space: 2 })
        .split('\n');
      const sourceLocation: TransactionSourceLocation = {
        line: lineOffset,
        lineEnd: lineOffset + displayTxnLines.length,
      };
      if (txnTrace) {
        if (txnTrace.logicSigTrace) {
          let lsigLine: number | undefined = undefined;
          for (let i = 0; i < displayTxnLines.length; i++) {
            const line = displayTxnLines[i];
            if (
              typeof lsigLine === 'undefined' &&
              line.match(/^\s*"lsig":\s*{\s*$/)
            ) {
              lsigLine = lineOffset + i;
              continue;
            }
          }
          sourceLocation.lsigLocation = {
            // Default to lineOffset + 1 if no lsig is present
            line: lsigLine ?? lineOffset + 1,
          };
        }
        if (txnTrace.approvalProgramTrace || txnTrace.clearStateProgramTrace) {
          let appIdLine: number | undefined = undefined;
          let approvalProgramLine: number | undefined = undefined;
          for (let i = 0; i < displayTxnLines.length; i++) {
            const line = displayTxnLines[i];
            if (line.match(/^\s*"apid":\s*\d+,\s*$/)) {
              appIdLine = lineOffset + i;
              // Break here, this is the ideal result
              break;
            }
            if (line.match(/^\s*"apap":\s*"[A-Za-z0-9+/=]*",\s*$/)) {
              // Show approval program if no app ID is present (during create)
              approvalProgramLine = lineOffset + i;
              // It's possible that this txn can have an approval program and an appID
              // (i.e. during an update), so don't break yet.
            }
          }
          sourceLocation.appLocation = {
            // Default to lineOffset + 1 if no appID or approval program is present
            line: appIdLine ?? approvalProgramLine ?? lineOffset + 1,
          };
        }
      }
      this.sourceLocations.push(sourceLocation);
      lineOffset += displayTxnLines.length;
    }
  }

  public get callStack(): CallStackFrame[] {
    return [this];
  }

  public get programState() {
    return undefined;
  }

  public get name(): string {
    return `${this.txnPath.length > 2 ? 'inner ' : ''}transaction ${
      this.txnIndex
    }`;
  }

  public get source(): FrameSource {
    const sourceLocation = this.sourceLocations[this.txnIndex];
    let line = sourceLocation.line;
    let endLine = sourceLocation.lineEnd;
    if (this.logicSigStatus === ProgramStatus.STARTING) {
      if (sourceLocation.lsigLocation) {
        line = sourceLocation.lsigLocation.line;
        endLine = sourceLocation.lsigLocation.lineEnd;
      }
    } else if (this.appStatus === ProgramStatus.STARTING) {
      if (sourceLocation.appLocation) {
        line = sourceLocation.appLocation.line;
        endLine = sourceLocation.appLocation.lineEnd;
      }
    }
    return {
      name: `${
        this.txnPath.length > 2 ? 'inner-' : ''
      }transaction-group-${this.txnPath.slice(0, -1).join('-')}.json`,
      content: this.sourceContent,
      contentMimeType: 'application/json',
      line: line,
      endLine: endLine,
    };
  }

  public forward(stack: TraceReplayFrame[]): ExceptionInfo | void {
    const currentTxnTrace = this.txnTraces[this.txnIndex];
    const currentTxnInfo = this.txnInfos[this.txnIndex];

    let childFailureInfo: TransactionFailureInfo | undefined = undefined;
    if (
      this.failureInfo &&
      pathStartWith(this.failureInfo.path, this.txnPath.slice(1))
    ) {
      if (this.failureInfo.path.length === this.txnPath.length - 1) {
        if (
          currentTxnTrace &&
          (currentTxnTrace.logicSigTrace ||
            currentTxnTrace.approvalProgramTrace ||
            currentTxnTrace.clearStateProgramTrace)
        ) {
          // Fail in the trace
          childFailureInfo = this.failureInfo;
        } else {
          // Fail right now
          this.onException = true;
          return new ExceptionInfo(this.failureInfo.message);
        }
      } else {
        childFailureInfo = this.failureInfo;
      }
    }

    if (this.logicSigStatus === ProgramStatus.NOT_STARTED) {
      this.logicSigStatus = ProgramStatus.STARTING;
      return;
    }
    if (this.logicSigStatus === ProgramStatus.STARTING && currentTxnTrace) {
      const logicSigFrame = new ProgramStackFrame(
        this.engine,
        this.txnPath,
        'logic sig',
        currentTxnTrace.logicSigHash!,
        currentTxnTrace.logicSigTrace!,
        currentTxnTrace,
        currentTxnInfo,
        // Only forward childFailureInfo if the LogicSig is the one that failed. The LogicSig could
        // not have failed if we have an app trace.
        this.appStatus === ProgramStatus.NOT_STARTED
          ? undefined
          : childFailureInfo,
      );
      this.logicSigStatus = ProgramStatus.DONE;
      stack.push(logicSigFrame);
      return;
    }
    if (this.appStatus === ProgramStatus.NOT_STARTED) {
      this.appStatus = ProgramStatus.STARTING;
      return;
    }
    if (this.appStatus === ProgramStatus.STARTING && currentTxnTrace) {
      let appFrame: ProgramStackFrame;
      if (currentTxnTrace.approvalProgramTrace) {
        appFrame = new ProgramStackFrame(
          this.engine,
          this.txnPath,
          'approval',
          currentTxnTrace.approvalProgramHash!,
          currentTxnTrace.approvalProgramTrace!,
          currentTxnTrace,
          currentTxnInfo,
          childFailureInfo,
        );
      } else {
        appFrame = new ProgramStackFrame(
          this.engine,
          this.txnPath,
          'clear state',
          currentTxnTrace.clearStateProgramHash!,
          currentTxnTrace.clearStateProgramTrace!,
          currentTxnTrace,
          currentTxnInfo,
          childFailureInfo,
        );
      }
      this.appStatus = ProgramStatus.DONE;
      stack.push(appFrame);
      return;
    }
    if (this.txnIndex + 1 < this.txnTraces.length) {
      this.txnIndex++;
      this.txnPath[this.txnPath.length - 1]++;
      const nextTrace = this.txnTraces[this.txnIndex];
      if (nextTrace) {
        this.logicSigStatus = nextTrace.logicSigTrace
          ? ProgramStatus.NOT_STARTED
          : ProgramStatus.DONE;
        this.appStatus =
          nextTrace.approvalProgramTrace || nextTrace.clearStateProgramTrace
            ? ProgramStatus.NOT_STARTED
            : ProgramStatus.DONE;
      } else {
        this.logicSigStatus = ProgramStatus.DONE;
        this.appStatus = ProgramStatus.DONE;
      }
      return;
    }
    stack.pop();
  }

  public backward(stack: TraceReplayFrame[]): ExceptionInfo | void {
    if (this.onException) {
      this.onException = false;
      return;
    }
    const currentTrace = this.txnTraces[this.txnIndex];
    if (currentTrace) {
      if (
        currentTrace.approvalProgramTrace ||
        currentTrace.clearStateProgramTrace
      ) {
        if (this.appStatus === ProgramStatus.DONE) {
          this.appStatus = ProgramStatus.STARTING;
          return;
        }
        if (this.appStatus === ProgramStatus.STARTING) {
          this.appStatus = ProgramStatus.NOT_STARTED;
          // Need to unwind the forward call that is implicit when the app program frame
          // is popped
          return this.backward(stack);
        }
      }
      if (currentTrace.logicSigTrace) {
        if (this.logicSigStatus === ProgramStatus.DONE) {
          this.logicSigStatus = ProgramStatus.STARTING;
          return;
        }
        if (this.logicSigStatus === ProgramStatus.STARTING) {
          this.logicSigStatus = ProgramStatus.NOT_STARTED;
          return;
        }
      }
    }
    if (this.txnIndex === 0) {
      stack.pop();
      return;
    }
    this.txnIndex--;
    this.txnPath[this.txnPath.length - 1]--;
    this.logicSigStatus = ProgramStatus.DONE;
    this.appStatus = ProgramStatus.DONE;
    const previousTrace = this.txnTraces[this.txnIndex];
    if (
      previousTrace?.approvalProgramHash ||
      previousTrace?.clearStateProgramHash ||
      previousTrace?.logicSigHash
    ) {
      // Need to step back on the app or lsig status
      return this.backward(stack);
    }
  }
}

export class ProgramStackFrame implements TraceReplayFrame {
  private lastIndex: number | undefined;
  private index: number = 0;
  private handledInnerTxns: boolean = false;
  private initialAppState: AppState | undefined;
  private logicSigAddress: string | undefined;
  private blockingException: ExceptionInfo | undefined;
  private programReplay: ProgramReplay;
  public readonly isPuyaFrame: boolean;

  constructor(
    private readonly engine: TraceReplayEngine,
    private readonly txnPath: number[],
    private readonly programType: 'logic sig' | 'approval' | 'clear state',
    programHash: Uint8Array,
    private readonly programTrace: algosdk.modelsv2.SimulationOpcodeTraceUnit[],
    private readonly trace: algosdk.modelsv2.SimulationTransactionExecTrace,
    private readonly txnInfo: algosdk.modelsv2.PendingTransactionResponse,
    private readonly failureInfo: TransactionFailureInfo | undefined,
  ) {
    const appID = this.currentAppID();
    if (typeof appID !== 'undefined') {
      this.initialAppState = engine.currentAppState.get(appID)!.clone();
    }

    if (
      this.programType === 'logic sig' &&
      typeof this.txnInfo.txn.lsig !== 'undefined'
    ) {
      const lsigBytes = this.txnInfo.txn.lsig.logic;
      const lsigAccount = new algosdk.LogicSigAccount(lsigBytes);
      this.logicSigAddress = lsigAccount.address().toString();
    }

    const sourceMapPath = this.engine.programHashToSource.get(programHash);
    this.isPuyaFrame = isPuyaSourceMap(sourceMapPath?.json);

    this.programReplay = new ProgramReplay(
      this.name,
      programTrace,
      sourceMapPath,
      this.currentAppID(),
      engine.currentAppState,
    );
  }

  public currentAppID(): bigint | undefined {
    if (this.programType === 'logic sig') {
      return undefined;
    }
    if (this.txnInfo.txn.txn.applicationCall?.appIndex) {
      // Ignore 0 and undefined
      return this.txnInfo.txn.txn.applicationCall.appIndex;
    }
    if (this.txnInfo.applicationIndex) {
      // Ignore 0 and undefined
      return this.txnInfo.applicationIndex;
    }
    return undefined;
  }

  public get callStack(): CallStackFrame[] {
    return this.programReplay.callStack;
  }

  public get name(): string {
    const appID = this.currentAppID();
    if (typeof appID !== 'undefined') {
      return `app ${appID} ${this.programType} program`;
    }
    if (typeof this.logicSigAddress !== 'undefined') {
      return `logic sig ${this.logicSigAddress} program`;
    }
    return `${this.programType} program`;
  }

  get pendingInnerTxn() {
    const currentUnit = this.programTrace[this.index];
    const spawnedInners = currentUnit?.spawnedInners;
    return (
      !this.handledInnerTxns && spawnedInners && spawnedInners.length !== 0
    );
  }

  public forward(stack: TraceReplayFrame[]): ExceptionInfo | void {
    if (!this.pendingInnerTxn && this.index < this.programTrace.length) {
      this.lastIndex = this.index;
    }
    const lastLocation = this.programReplay.nextPcSource;
    let again = true;
    while (again) {
      if (this.blockingException) {
        return this.blockingException;
      }

      if (this.index === this.programTrace.length) {
        stack.pop();
        return;
      }

      if (this.pendingInnerTxn) {
        const currentUnit = this.programTrace[this.index];
        const spawnedInners = currentUnit.spawnedInners!;
        const spawnedInnerIndexes = spawnedInners.map((i) => Number(i));
        const innerGroupInfo: algosdk.modelsv2.PendingTransactionResponse[] =
          [];
        const innerTraces: algosdk.modelsv2.SimulationTransactionExecTrace[] =
          [];
        for (const innerIndex of spawnedInnerIndexes) {
          const innerTxnInfo = this.txnInfo.innerTxns![innerIndex];
          const innerTrace = this.trace.innerTrace![innerIndex];
          innerGroupInfo.push(innerTxnInfo);
          innerTraces.push(innerTrace);
        }
        const expandedPath = this.txnPath.slice();
        expandedPath.push(spawnedInnerIndexes[0]);
        let innerFailureInfo: TransactionFailureInfo | undefined = undefined;
        if (
          this.failureInfo &&
          this.failureInfo.path.length > this.txnPath.length - 1 &&
          pathStartWith(this.failureInfo.path, this.txnPath.slice(1))
        ) {
          innerFailureInfo = this.failureInfo;
        }
        const innerGroupFrame = new TransactionGroupStackFrame(
          this.engine,
          expandedPath,
          innerGroupInfo,
          innerTraces,
          innerFailureInfo,
        );
        stack.push(innerGroupFrame);
        this.handledInnerTxns = true;
        return;
      }
      this.programReplay.forward();
      // loop until location has advanced
      again =
        this.isPuyaFrame &&
        !locationHasAdvanced(lastLocation, this.programReplay.nextPcSource);

      this.index++;

      if (this.index < this.programTrace.length) {
        this.handledInnerTxns = false;
      } else {
        if (
          this.programType === 'clear state' &&
          this.trace.clearStateRollback
        ) {
          // If there's a rollback, reset the app state to the initial state
          this.engine.currentAppState.set(
            this.currentAppID()!,
            this.initialAppState!.clone(),
          );
          // Don't return the clear state error here, failureInfo takes precedence
        }

        if (
          this.failureInfo &&
          pathsEqual(this.txnPath.slice(1), this.failureInfo.path)
        ) {
          // If there's an error, show it at the end of execution
          this.blockingException = new ExceptionInfo(this.failureInfo.message);
          return this.blockingException;
        }

        if (
          this.programType === 'clear state' &&
          this.trace.clearStateRollback
        ) {
          // Show error message for clear state rollback. This is NOT a blocking error.
          if (typeof this.trace.clearStateRollbackError !== 'undefined') {
            return new ExceptionInfo(this.trace.clearStateRollbackError);
          }
          // If no specific error message, show a generic one (this is what happens during rejection)
          return new ExceptionInfo('Clear state program did not succeed');
        }
      }
    }
  }

  public backward(stack: TraceReplayFrame[]): ExceptionInfo | void {
    if (this.blockingException) {
      this.blockingException = undefined;
    }
    if (this.handledInnerTxns) {
      // We can roll this back without any other effects
      this.handledInnerTxns = false;
      return;
    }
    if (this.index === 0) {
      stack.pop();
      return;
    }
    // reset and then advance until the current index is the lastIndex
    const stopAt = this.lastIndex;
    this.reset();
    if (stopAt !== undefined) {
      while (this.index < stopAt) {
        this.engine.forward();
      }
    }
  }

  private reset() {
    this.lastIndex = undefined;
    this.index = 0;
    this.handledInnerTxns = false;
    this.programReplay.reset();
    if (typeof this.initialAppState !== 'undefined') {
      this.engine.currentAppState.set(
        this.currentAppID()!,
        this.initialAppState.clone(),
      );
    }
  }
}

function pathsEqual(path1: number[], path2: number[]): boolean {
  if (path1.length !== path2.length) {
    return false;
  }
  for (let i = 0; i < path1.length; i++) {
    if (path1[i] !== path2[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Determines if the given path starts with the given prefix.
 */
function pathStartWith(path: number[], prefix: number[]): boolean {
  if (path.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (path[i] !== prefix[i]) {
      return false;
    }
  }
  return true;
}

function locationHasAdvanced(
  from: FrameSource | undefined,
  to: FrameSource | undefined,
): boolean {
  // two unknown locations have not advanced
  if (from === undefined && to === undefined) {
    return false;
  }
  // unknown -> known has advanced
  if (from === undefined && to !== undefined) {
    return true;
  }
  // known -> unknown has not advanced
  if (from !== undefined && to === undefined) {
    return false;
  }
  if (from?.path !== to?.path) {
    return true;
  }
  if (from?.line !== to?.line) {
    return true;
  }
  if (from?.column !== to?.column) {
    return true;
  }
  return false;
}
