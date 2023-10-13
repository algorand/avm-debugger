import * as algosdk from 'algosdk';
import { AppState } from './appState';
import { ByteArrayMap, TEALDebuggingAssets, TxnGroupSourceDescriptor } from './utils';

export class TraceReplayEngine {

	public debugAssets: TEALDebuggingAssets;
    public programHashToSource: ByteArrayMap<TxnGroupSourceDescriptor | undefined> = new ByteArrayMap();
    public framePaths: number[][] = [];
    
    public initialAppState = new Map<number, AppState>();
    public currentAppState = new Map<number, AppState>();

    public stack: TraceReplayStackFrame[] = [];

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
        this.setStartingStack();
	}

    private setStartingStack() {
        const { simulateResponse } = this.debugAssets;
        this.stack = [
            new TopLevelTransactionGroupsFrame(this, simulateResponse)
        ];
        if (simulateResponse.txnGroups.length === 1) {
            // If only a single group, get rid of the top-level frame
            this.forward();
            this.stack.shift();
        }
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
        let length: number;
        do {
            length = this.stack.length;
            this.currentFrame().forward(this.stack);
            if (this.stack.length === 0) {
                return false;
            }
        } while (this.stack.length < length);
        return true;
	}

    public backward(): boolean {
        let length: number;
        do {
           length = this.stack.length;
           this.currentFrame().backward(this.stack);
            if (this.stack.length === 0) {
                this.setStartingStack();
                return false;
            }
        } while (this.stack.length < length);
        return true;
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
    public abstract backward(stack: TraceReplayStackFrame[]): void;
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
        const txnGroupFrame = new TransactionStackFrame(this.engine, [index], txnInfos, txnTraces);
        return txnGroupFrame;
    }

    public backward(stack: TraceReplayStackFrame[]): void {
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
    line: number,
    lineEnd?: number,
    lsigLocation?: {
        line: number,
        lineEnd?: number,
    },
    appLocation?: {
        line: number,
        lineEnd?: number,
    },
}

export class TransactionStackFrame extends TraceReplayStackFrame {

    private txnIndex: number = 0;
    private preambleDone: boolean = false;
    private logicSigDone: boolean;
    private appDone: boolean;

    private sourceContent: string;
    private sourceLocations: TransactionSourceLocation[] = [];
    
    constructor(
        engine: TraceReplayEngine,
        private readonly txnPath: number[],
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

        const individualTxns = this.txnInfos.map(txnInfo => txnInfo.get_obj_for_encoding().txn);
        this.sourceContent = JSON.stringify(individualTxns, null, 2);
        let lineOffset = 1; // For opening bracket
        for (let i = 0; i < this.txnInfos.length; i++) {
            const txnInfo = this.txnInfos[i];
            const txnTrace = this.txnTraces[i];
            const displayedTxn = txnInfo.get_obj_for_encoding().txn;
            const displayTxnLines = JSON.stringify(displayedTxn, null, 2).split('\n');
            const sourceLocation: TransactionSourceLocation = {
                line: lineOffset,
                lineEnd: lineOffset + displayTxnLines.length + 1,
            };
            if (txnTrace) {
                if (txnTrace.logicSigTrace) {
                    // TODO: lsigLocation
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
                        if (line.match(/^\s*"apap":\s*"[A-Za-z0-9+\/=]*",\s*$/)) {
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

    public name(): string {
        return `${this.txnPath.length > 1 ? 'inner ' : ''}transaction ${this.txnIndex}`;
    }

    public sourceFile(): FrameSource {
        return {
            name: `${this.txnPath.length > 1 ? 'inner-' : ''}transaction-group-${this.txnPath.join('-')}.json`,
            content: this.sourceContent,
            contentMimeType: 'application/json',
        };
    }

    public sourceLocation(): FrameSourceLocation {
        const sourceLocation = this.sourceLocations[this.txnIndex];
        let frameSourceLocation: FrameSourceLocation = {
            line: sourceLocation.line,
            endLine: sourceLocation.lineEnd,
        };
        if (this.preambleDone) {
            if (!this.logicSigDone) {
                if (sourceLocation.lsigLocation) {
                    frameSourceLocation = {
                        line: sourceLocation.lsigLocation.line,
                        endLine: sourceLocation.lsigLocation.lineEnd,
                    };
                }
            } else if (!this.appDone) {
                if (sourceLocation.appLocation) {
                    frameSourceLocation = {
                        line: sourceLocation.appLocation.line,
                        endLine: sourceLocation.appLocation.lineEnd,
                    };
                }
            }
        }
        return frameSourceLocation;
    }

    public forward(stack: TraceReplayStackFrame[]): void {
        const currentTxnTrace = this.txnTraces[this.txnIndex];
        const currentTxnInfo = this.txnInfos[this.txnIndex];
        if (!this.preambleDone && (!this.logicSigDone || !this.appDone)) {
            this.preambleDone = true;
            return;
        }
        if (!this.logicSigDone && currentTxnTrace) {
            const logicSigFrame = new ProgramStackFrame(
                this.engine,
                this.txnPath,
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
                    this.txnPath,
                    'approval',
                    currentTxnTrace.approvalProgramHash!,
                    currentTxnTrace.approvalProgramTrace!,
                    currentTxnTrace,
                    currentTxnInfo,
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
                );
            }
            this.appDone = true;
            stack.push(appFrame);
            return;
        }
        if (this.txnIndex + 1 < this.txnTraces.length) {
            this.txnIndex++;
            const nextTrace = this.txnTraces[this.txnIndex];
            this.preambleDone = false;
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

    public backward(stack: TraceReplayStackFrame[]): void {
        const currentTrace = this.txnTraces[this.txnIndex];
        if (currentTrace) {
            if ((currentTrace.approvalProgramTrace || currentTrace.clearStateProgramTrace) && this.appDone) {
                this.appDone = false;
                return;
            }
            if (currentTrace.logicSigTrace && this.logicSigDone) {
                this.logicSigDone = false;
                return;
            }
        }
        if (this.preambleDone) {
            this.preambleDone = false;
            return;
        }
        if (this.txnIndex === 0) {
            stack.pop();
            return;
        }
        this.txnIndex--;
        this.preambleDone = true;
        this.logicSigDone = true;
        this.appDone = true;
        this.backward(stack);
    }
}

export interface ProgramState {
    pc: number,
    stack: algosdk.modelsv2.AvmValue[],
    scratch: Map<number, algosdk.modelsv2.AvmValue>
}

export class ProgramStackFrame extends TraceReplayStackFrame {

    private index: number = 0;
    private handledInnerTxns: boolean = false;
    private innerTxnGroupCount: number = 0;
    private initialAppState: AppState | undefined;

    public state: ProgramState = { pc: 0, stack: [], scratch: new Map() };

    constructor(
        engine: TraceReplayEngine,
        private readonly txnPath: number[],
        private readonly programType: 'logic sig' | 'approval' | 'clear state',
        private readonly programHash: Uint8Array,
        private readonly programTrace: algosdk.modelsv2.SimulationOpcodeTraceUnit[],
        private readonly trace: algosdk.modelsv2.SimulationTransactionExecTrace,
        private readonly txnInfo: algosdk.modelsv2.PendingTransactionResponse
    ) {
        super(engine);
        this.state.pc = Number(programTrace[0].pc);

        const appID = this.currentAppID();
        if (typeof appID !== 'undefined') {
            this.initialAppState = engine.currentAppState.get(appID)!.clone();
        }
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
        const location = sourceInfo.sourcemap.getLocationForPc(this.state.pc);
        // If we can't find a location for this PC, just return the first source.
        const sourceIndex = location ? location.sourceIndex : 0;
        const source = sourceInfo.getFullSourcePath(sourceIndex);
        return {
            name: source,
            path: source,
        };
    }

    public sourceLocation(): FrameSourceLocation {
        const sourceInfo = this.engine.programHashToSource.get(this.programHash);
        if (!sourceInfo) {
            return { line: 0 };
        }
        const location = sourceInfo.sourcemap.getLocationForPc(this.state.pc);
        if (!location) {
            return { line: 0 };
        }
        return {
            line: location.line,
            column: location.column,
        };
    }

    public forward(stack: TraceReplayStackFrame[]): void {
        const currentUnit = this.programTrace[this.index];
        this.processUnit(currentUnit);

        const spawnedInners = currentUnit.spawnedInners;
        if (!this.handledInnerTxns && spawnedInners && spawnedInners.length !== 0) {
            const innerGroupInfo: algosdk.modelsv2.PendingTransactionResponse[] = [];
            const innerTraces: algosdk.modelsv2.SimulationTransactionExecTrace[] = [];
            for (const innerIndex of spawnedInners) {
                const innerTxnInfo = this.txnInfo.innerTxns![Number(innerIndex)];
                const innerTrace = this.trace.innerTrace![Number(innerIndex)];
                innerGroupInfo.push(innerTxnInfo);
                innerTraces.push(innerTrace);
            }
            const expandedPath = this.txnPath.slice();
            expandedPath.push(this.innerTxnGroupCount);
            const innerGroupFrame = new TransactionStackFrame(this.engine, expandedPath, innerGroupInfo, innerTraces);
            stack.push(innerGroupFrame);
            this.handledInnerTxns = true;
            this.innerTxnGroupCount++;
            return;
        }

        if (this.index + 1 < this.programTrace.length) {
            this.index++;
            this.state.pc = Number(this.programTrace[this.index].pc);
            this.handledInnerTxns = false;
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

    public backward(stack: TraceReplayStackFrame[]): void {
        if (this.handledInnerTxns) {
            // We can roll this back without any other effects
            this.handledInnerTxns = false;
            return;
        }
        if (this.index === 0) {
            stack.pop();
            return;
        }
        const targetIndex = this.index - 1;
        this.reset();
        while (this.index < targetIndex) {
            this.forward(stack);
        }
    }

    private reset() {
        this.index = 0;
        this.handledInnerTxns = false;
        this.innerTxnGroupCount = 0;
        this.state.pc = Number(this.programTrace[0].pc);
        this.state.stack = [];
        this.state.scratch.clear();
        if (typeof this.initialAppState !== 'undefined') {
            this.engine.currentAppState.set(this.currentAppID()!, this.initialAppState);
        }
    }
}
