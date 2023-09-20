import * as assert from 'assert';
import { SpawnOptions } from 'child_process';
import { DebugClient as DebugClientBase } from '@vscode/debugadapter-testsupport';
import { DebugProtocol } from '@vscode/debugprotocol';

export class DebugClient extends DebugClientBase {

    private lastStoppedEvent: DebugProtocol.StoppedEvent | undefined;

    constructor(debugAdapterRuntime: string, debugAdapterExecutable: string, debugType: string, spawnOptions?: SpawnOptions, enableStderr?: boolean) {
        super(debugAdapterRuntime, debugAdapterExecutable, debugType, spawnOptions, enableStderr);

        this.on('stopped', event => {
            this.lastStoppedEvent = event;
        });
        this.on('continued', () => {
            this.lastStoppedEvent = undefined;
        });
    }

    async continueRequest(args: DebugProtocol.ContinueArguments): Promise<DebugProtocol.ContinueResponse> {
        // Optimistically clear the last stopped event. It's important to do this before we send the
        // continue request, otherwise we might miss a stopped event that happens immediately after.
        this.lastStoppedEvent = undefined;
        const response = await super.continueRequest(args);
        return response;
    }

    async waitForStop(): Promise<DebugProtocol.StoppedEvent> {
        if (typeof this.lastStoppedEvent !== 'undefined') {
            return Promise.resolve(this.lastStoppedEvent);
        }
        const event = (await this.waitForEvent('stopped')) as DebugProtocol.StoppedEvent;
        return event;
    }

    async assertStoppedLocation(reason: string, expected: {
        path?: string | RegExp;
        line?: number;
        column?: number;
    }): Promise<DebugProtocol.StackTraceResponse> {
        const stoppedEvent = await this.waitForStop();
        assert.strictEqual(stoppedEvent.body.reason, reason);

        const stackTraceResponse = await this.stackTraceRequest({ threadId: stoppedEvent.body.threadId! });

        const frame = stackTraceResponse.body.stackFrames[0];
        if (typeof expected.path === 'string' || expected.path instanceof RegExp) {
            this.assertPath(frame.source?.path!, expected.path, 'stopped location: path mismatch');
        }
        if (typeof expected.line === 'number') {
            assert.strictEqual(frame.line, expected.line, 'stopped location: line mismatch');
        }
        if (typeof expected.column === 'number') {
            assert.strictEqual(frame.column, expected.column, 'stopped location: column mismatch');
        }
        return stackTraceResponse;
    }
}
