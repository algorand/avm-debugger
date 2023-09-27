import * as algosdk from 'algosdk';
import { AppState } from './appState';
import { ByteArrayMap, TEALDebuggingAssets, TxnGroupSourceDescriptor } from './utils';

export class TraceReplayEngine {

	public debugAssets: TEALDebuggingAssets;
    public programHashToSource: ByteArrayMap<TxnGroupSourceDescriptor | undefined> = new ByteArrayMap();
    public framePaths: number[][] = [];
    
    public initialAppState = new Map<number, AppState>();
    public currentAppState = new Map<number, AppState>();

    public stack: TraceReplayStackFrame[];

	constructor(debugAssets: TEALDebuggingAssets) {
		this.debugAssets = debugAssets;

        const { simulateResponse } = this.debugAssets;

        for (const initialAppState of simulateResponse.initialStates?.appInitialStates || []) {
            this.initialAppState.set(Number(initialAppState.id), AppState.fromAppInitialState(initialAppState));
        }

        for (let groupIndex = 0; groupIndex < simulateResponse.txnGroups.length; groupIndex++) {
            const group = simulateResponse.txnGroups[groupIndex];

            this.framePaths.push([groupIndex]);

            for (let txnIndex = 0; txnIndex < group.txnResults.length; txnIndex++) {
                this.setupTxnTrace(groupIndex, txnIndex);
            }
        }

        this.resetCurrentAppState();

        this.stack = [
            new TopLevelTransactionGroupsFrame(this, simulateResponse)
        ];
	}

    private resetCurrentAppState() {
        this.currentAppState = new Map(
            Array.from(this.initialAppState.entries(), ([key, value]) => [key, value.clone()])
        );
    }

    private setupTxnTrace(groupIndex: number, txnIndex: number) {
        const txnPath = [groupIndex, txnIndex];
        this.framePaths.push(txnPath);

        const txn = this.debugAssets.simulateResponse.txnGroups[groupIndex].txnResults[txnIndex];
        const trace = txn.execTrace;
        if (!trace) {
            // Probably not an app call txn
            return;
        }
        if (trace.logicSigTrace) {
            this.fetchProgramSourceInfo(trace.logicSigHash!);
        }
        visitAppTrace(txnPath, txn.txnResult, trace, (path, programHash, txnInfo, opcodes) => {
            this.framePaths.push(path);
            this.fetchProgramSourceInfo(programHash);

            let appID = txnInfo.applicationIndex || txnInfo.txn.txn.apid;
            if (typeof appID === 'undefined') {
                throw new Error(`No appID for txn at path ${path}`);
            } else {
                appID = Number(appID);
            }
            
            let initialAppState = this.initialAppState.get(appID);
            if (typeof initialAppState === 'undefined') {
                initialAppState = new AppState();
                this.initialAppState.set(appID, initialAppState);
            }

            for (const opcode of opcodes) {
                for (const stateChange of opcode.stateChanges || []) {
                    if (stateChange.appStateType === 'l') {
                        const account = stateChange.account!;
                        if (!initialAppState.localState.has(account)) {
                            initialAppState.localState.set(account, new ByteArrayMap());
                        }
                    }
                }
            }
        });
    }

    private fetchProgramSourceInfo(programHash: Uint8Array) {
        if (this.programHashToSource.has(programHash)) {
            return;
        }
        const sourceDescriptor = this.debugAssets.txnGroupDescriptorList.findByHash(programHash);
        this.programHashToSource.set(programHash, sourceDescriptor);
    }

    public currentFrame(): TraceReplayStackFrame {
        return this.stack[this.stack.length - 1];
    }

	public forward(): boolean {
        this.currentFrame().forward(this.stack);
        return this.stack.length !== 0;
	}

    public backward(): boolean {
        throw new Error('Not implemented');
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
        opcodes: algosdk.modelsv2.SimulationOpcodeTraceUnit[]
    ) => void
) {
    if (trace.approvalProgramTrace) {
        visitor(path, trace.approvalProgramHash!, txnInfo, trace.approvalProgramTrace);
    }
    if (trace.clearStateProgramTrace) {
        visitor(path, trace.clearStateProgramHash!, txnInfo, trace.clearStateProgramTrace);
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
}

export interface FrameSourceLocation {
    line: number;
    endLine?: number;
    column?: number;
    endColumn?: number;
}

export abstract class TraceReplayStackFrame {

    constructor(protected readonly engine: TraceReplayEngine) { }

    public abstract name(): string;
    public abstract sourceFile(): FrameSource;
    public abstract sourceLocation(): FrameSourceLocation;
    public abstract forward(stack: TraceReplayStackFrame[]): void;
}

export class TopLevelTransactionGroupsFrame extends TraceReplayStackFrame {

    private index: number = 0;
    private txnGroupDone: boolean = false;

    constructor(
        engine: TraceReplayEngine,
        private readonly response: algosdk.modelsv2.SimulateResponse
    ) {
        super(engine);
    }

    public name(): string {
        return `group ${this.index}`;
    }

    public sourceFile(): FrameSource {
        const individualGroups = this.response.txnGroups.map(group =>
            group.txnResults.map(txnResult => txnResult.txnResult.get_obj_for_encoding().txn)
        );
        return {
            name: `transaction-groups.json`,
            content: JSON.stringify(individualGroups, null, 2),
            contentMimeType: 'application/json'
        };
    }

    public sourceLocation(): FrameSourceLocation {
        let lineOffset = 1; // For opening bracket
        for (let i = 0; i < this.index; i++) {
            for (const txnResult of this.response.txnGroups[i].txnResults) {
                const displayedTxn = txnResult.txnResult.get_obj_for_encoding().txn;
                // + 2 is for opening and closing brackets
                lineOffset += JSON.stringify(displayedTxn, null, 2).split('\n').length;
            }
            lineOffset += 2; // For opening and closing brackets
        }
        let lineCount = 2; // For opening and closing brackets
        for (const txnResult of this.response.txnGroups[this.index].txnResults) {
            const displayedTxn = txnResult.txnResult.get_obj_for_encoding().txn;
            // + 2 is for opening and closing brackets
            lineCount += JSON.stringify(displayedTxn, null, 2).split('\n').length;
        }
        return {
            line: lineOffset,
            endLine: lineOffset + lineCount + 1,
        };
    }

    public forward(stack: TraceReplayStackFrame[]): void {
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

    private frameForIndex(index: number): TransactionStackFrame {
        const txnInfos: algosdk.modelsv2.PendingTransactionResponse[] = [];
        const txnTraces: Array<algosdk.modelsv2.SimulationTransactionExecTrace | undefined> = [];
        for (const { txnResult, execTrace } of this.response.txnGroups[index].txnResults) {
            txnInfos.push(txnResult);
            txnTraces.push(execTrace);
        }
        const txnGroupFrame = new TransactionStackFrame(this.engine, index, false, txnInfos, txnTraces);
        return txnGroupFrame;
    }
}

export class TransactionStackFrame extends TraceReplayStackFrame {

    private txnIndex: number = 0;
    private logicSigDone: boolean;
    private appDone: boolean;
    
    constructor(
        engine: TraceReplayEngine,
        private readonly groupIndex: number,
        private readonly isInner: boolean,
        private readonly txnInfos: algosdk.modelsv2.PendingTransactionResponse[],
        private readonly txnTraces: Array<algosdk.modelsv2.SimulationTransactionExecTrace | undefined>
    ) {
        super(engine);
        this.logicSigDone = true;
        this.appDone = true;

        const firstTrace = txnTraces[0];
        if (firstTrace) {
            if (firstTrace.logicSigTrace) {
                this.logicSigDone = false;
            }
            if (firstTrace.approvalProgramTrace || firstTrace.clearStateProgramTrace) {
                this.appDone = false;
            }
        }
    }

    public name(): string {
        return `${this.isInner ? 'inner ' : ''}transaction ${this.txnIndex}`;
    }

    public sourceFile(): FrameSource {
        const individualTxns = this.txnInfos.map(txnInfo => txnInfo.get_obj_for_encoding().txn);
        return {
            name: `${this.isInner ? 'inner-' : ''}transaction-group-${this.groupIndex}.json`,
            content: JSON.stringify(individualTxns, null, 2),
            contentMimeType: 'application/json'
        };
    }

    public sourceLocation(): FrameSourceLocation {
        let lineOffset = 1; // For opening bracket
        for (let i = 0; i < this.txnIndex; i++) {
            const txnInfo = this.txnInfos[i];
            const displayedTxn = txnInfo.get_obj_for_encoding().txn;
            // + 2 is for opening and closing brackets
            lineOffset += JSON.stringify(displayedTxn, null, 2).split('\n').length;
        }
        let lineCount = JSON.stringify(this.txnInfos[this.txnIndex].get_obj_for_encoding().txn, null, 2).split('\n').length;
        return {
            line: lineOffset,
            endLine: lineOffset + lineCount + 1,
        };
    }

    public forward(stack: TraceReplayStackFrame[]): void {
        const currentTxnTrace = this.txnTraces[this.txnIndex];
        const currentTxnInfo = this.txnInfos[this.txnIndex];
        if (!this.logicSigDone && currentTxnTrace) {
            const logicSigFrame = new ProgramStackFrame(
                this.engine,
                'logic sig',
                currentTxnTrace.logicSigHash!,
                currentTxnTrace.logicSigTrace!,
                currentTxnTrace,
                currentTxnInfo,
            );
            this.logicSigDone = true;
            stack.push(logicSigFrame);
            return;
        }
        if (!this.appDone && currentTxnTrace) {
            let appFrame: ProgramStackFrame;
            if (currentTxnTrace.approvalProgramTrace) {
                appFrame = new ProgramStackFrame(
                    this.engine,
                    'approval',
                    currentTxnTrace.approvalProgramHash!,
                    currentTxnTrace.approvalProgramTrace!,
                    currentTxnTrace,
                    currentTxnInfo,
                );
            } else {
                appFrame = new ProgramStackFrame(
                    this.engine,
                    'clear state',
                    currentTxnTrace.clearStateProgramHash!,
                    currentTxnTrace.clearStateProgramTrace!,
                    currentTxnTrace,
                    currentTxnInfo,
                );
            }
            this.appDone = true;
            stack.push(appFrame);
            return;
        }
        if (this.txnIndex + 1 < this.txnTraces.length) {
            this.txnIndex++;
            const nextTrace = this.txnTraces[this.txnIndex];
            if (nextTrace) {
                this.logicSigDone = nextTrace.logicSigTrace ? false : true;
                this.appDone = nextTrace.approvalProgramTrace || nextTrace.clearStateProgramTrace ? false : true;
            } else {
                this.logicSigDone = true;
                this.appDone = true;
            }
            return;
        }
        stack.pop();
    }
}

export interface ProgramState {
    pc: number,
    stack: algosdk.modelsv2.AvmValue[],
    scratch: Map<number, algosdk.modelsv2.AvmValue>
}

export class ProgramStackFrame extends TraceReplayStackFrame {

    private index: number = 0;
    private innerTxnGroups: number = 0;

    public state: ProgramState = { pc: 0, stack: [], scratch: new Map() };

    constructor(
        engine: TraceReplayEngine,
        private readonly programType: 'logic sig' | 'approval' | 'clear state',
        private readonly programHash: Uint8Array,
        private readonly programTrace: algosdk.modelsv2.SimulationOpcodeTraceUnit[],
        private readonly trace: algosdk.modelsv2.SimulationTransactionExecTrace,
        private readonly txnInfo: algosdk.modelsv2.PendingTransactionResponse
    ) {
        super(engine);
        this.state.pc = Number(programTrace[0].pc);
    }

    public currentAppID(): number | undefined {
        if (typeof this.txnInfo.txn.txn.apid !== 'undefined') {
            return Number(this.txnInfo.txn.txn.apid);
        }
        if (typeof this.txnInfo.applicationIndex !== 'undefined') {
            return Number(this.txnInfo.applicationIndex);
        }
        return undefined;
    }

    public name(): string {
        const appID = this.currentAppID();
        if (appID) {
            return `app ${appID} ${this.programType} program`;
        }
        return `${this.programType} program`;
    }

    public sourceFile(): FrameSource {
        const sourceInfo = this.engine.programHashToSource.get(this.programHash);
        if (!sourceInfo) {
            let name: string;
            const appID = this.currentAppID();
            if (typeof appID !== 'undefined') {
                name = `app ${appID} ${this.programType}.teal`;
            } else {
                name = `program ${Buffer.from(this.programHash).toString('base64url')}.teal`;
            }
            return {
                name,
                content: '// source not available',
            };
        }
        return {
            name: sourceInfo.fileLocation,
            path: sourceInfo.fileLocation,
        };
    }

    public sourceLocation(): FrameSourceLocation {
        const sourceInfo = this.engine.programHashToSource.get(this.programHash);
        if (!sourceInfo) {
            return { line: 0 };
        }
        return {
            line: sourceInfo.sourcemap.getLineForPc(this.state.pc) || 0,
        };
    }

    public forward(stack: TraceReplayStackFrame[]): void {
        const currentUnit = this.programTrace[this.index];
        this.processUnit(currentUnit);
        if (this.index + 1 < this.programTrace.length) {
            this.state.pc = Number(this.programTrace[this.index + 1].pc);
        }

        const spawnedInners = currentUnit.spawnedInners;
        if (spawnedInners && spawnedInners.length !== 0) {
            const innerGroupInfo: algosdk.modelsv2.PendingTransactionResponse[] = [];
            const innerTraces: algosdk.modelsv2.SimulationTransactionExecTrace[] = [];
            for (const innerIndex of spawnedInners) {
                const innerTxnInfo = this.txnInfo.innerTxns![Number(innerIndex)];
                const innerTrace = this.trace.innerTrace![Number(innerIndex)];
                innerGroupInfo.push(innerTxnInfo);
                innerTraces.push(innerTrace);
            }
            const innerGroupFrame = new TransactionStackFrame(this.engine, this.innerTxnGroups, true, innerGroupInfo, innerTraces);
            stack.push(innerGroupFrame);
            this.innerTxnGroups++;
        }

        if (this.index + 1 < this.programTrace.length) {
            this.index++;
            return;
        }
        stack.pop();
    }

    private processUnit(unit: algosdk.modelsv2.SimulationOpcodeTraceUnit) {
        this.state.pc = Number(unit.pc);

        const stackPopCount = unit.stackPopCount ? Number(unit.stackPopCount) : 0;
        if (stackPopCount > this.state.stack.length) {
            throw new Error(`Stack underflow at pc ${unit.pc}: ${stackPopCount} > ${this.state.stack.length}`);
        }
        this.state.stack = this.state.stack.slice(0, this.state.stack.length - stackPopCount);
        if (unit.stackAdditions) {
            this.state.stack.push(...unit.stackAdditions);
        }
        
        for (const scratchWrite of unit.scratchChanges || []) {
            const slot = Number(scratchWrite.slot);
            if (slot < 0 || slot >= 256) {
                throw new Error(`Invalid scratch slot ${slot}`);
            }
            const newValue = scratchWrite.newValue;
            if (Number(newValue.type) === 2 && !newValue.uint) {
                // When setting to 0, delete the entry, since 0 is the default.
                this.state.scratch.delete(slot);
            } else {
                this.state.scratch.set(slot, newValue);
            }
        }

        if (unit.stateChanges && unit.stateChanges.length !== 0) {
            const appID = this.currentAppID();
            if (typeof appID === 'undefined') {
                throw new Error('No appID');
            }

            const state = this.engine.currentAppState.get(appID);
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
            }
        }
    }
}
