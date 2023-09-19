import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { DebugClient } from '@vscode/debugadapter-testsupport';
import { TEALDebuggingAssets, ByteArrayMap } from '../debugAdapter/utils';
import { BasicServer } from '../debugAdapter/basicServer';
import { FileAccessor } from '../debugAdapter/txnGroupWalkerRuntime';

export const testFileAccessor: FileAccessor = {
	isWindows: typeof process !== 'undefined' && process.platform === 'win32',
	async readFile(path: string): Promise<Uint8Array> {
		return fs.readFileSync(path);
	},
	async writeFile(path: string, contents: Uint8Array) {
		return fs.writeFileSync(path, contents);
	}
};

function assertAvmValuesEqual(actual: { value: string, type?: string }, expectedValue: number | bigint | Uint8Array) {
	if (expectedValue instanceof Uint8Array) {
		assert.strictEqual(actual.type, 'byte[]');
		assert.ok(actual.value.startsWith('0x'));
		const actualBytes = Buffer.from(actual.value.slice(2), 'hex');
		assert.deepStrictEqual(new Uint8Array(actualBytes), new Uint8Array(expectedValue));
	} else if (typeof expectedValue === 'number' || typeof expectedValue === 'bigint') {
		assert.strictEqual(actual.type, 'uint64');
		assert.strictEqual(BigInt(actual.value), BigInt(expectedValue));
	} else {
		throw new Error(`Improper expected value: ${expectedValue}`);
	}
}

async function assertVariables(dc: DebugClient, {
	pc,
	stack,
	scratch,
	apps,
}: {
	pc?: number,
	stack?: Array<number | bigint | Uint8Array>,
	scratch?: Map<number, number | bigint | Uint8Array>,
	apps?: Array<{
		appID: number,
		globalState?: ByteArrayMap<number | bigint | Uint8Array>
	}>,
}) {
	const scopesResponse = await dc.scopesRequest({ frameId: 0 });
	assert.ok(scopesResponse.success);
	const scopes = scopesResponse.body.scopes;

	const executionScope = scopes.find(scope => scope.name === 'Execution State');
	assert.ok(executionScope);

	const executionScopeResponse = await dc.variablesRequest({ variablesReference: executionScope.variablesReference });
	assert.ok(executionScopeResponse.success);
	const executionScopeVariables = executionScopeResponse.body.variables;

	const onChainScope = scopes.find(scope => scope.name === 'On-chain State');
	assert.ok(onChainScope);

	const onChainScopeResponse = await dc.variablesRequest({ variablesReference: onChainScope.variablesReference });
	assert.ok(onChainScopeResponse.success);
	const onChainScopeVariables = onChainScopeResponse.body.variables;

	const appStateVariable = onChainScopeVariables.find(variable => variable.name === 'app');
	assert.ok(appStateVariable);

	const appStateVariableResponse = await dc.variablesRequest({ variablesReference: appStateVariable.variablesReference });
	assert.ok(appStateVariableResponse.success);
	const appStates = appStateVariableResponse.body.variables;

	if (typeof pc !== 'undefined') {
		const pcVariable = executionScopeVariables.find(variable => variable.name === 'pc');
		assert.ok(pcVariable);
		assert.strictEqual(pcVariable.type, 'uint64');
		assert.strictEqual(pcVariable.value, pc.toString());

		await assertEvaluationEquals(dc, 'pc', { value: pc.toString(), type: 'uint64' });
	}

	if (typeof stack !== 'undefined') {
		const stackParentVariable = executionScopeVariables.find(variable => variable.name === 'stack');
		assert.ok(stackParentVariable);

		const stackVariableResponse = await dc.variablesRequest({ variablesReference: stackParentVariable.variablesReference });
		assert.ok(stackVariableResponse.success);
		const stackVariables = stackVariableResponse.body.variables;

		assert.strictEqual(stackVariables.length, stack.length);

		for (let i = 0; i < stack.length; i++) {
			assert.strictEqual(stackVariables[i].name, i.toString());
			assertAvmValuesEqual(stackVariables[i], stack[i]);
		}

		await Promise.all(stack.map(async (expectedValue, i) => {
			if (expectedValue instanceof Uint8Array) {
				await assertEvaluationEquals(dc, `stack[${i}]`, { value: '0x' + Buffer.from(expectedValue).toString('hex'), type: 'byte[]' });
			} else if (typeof expectedValue === 'number' || typeof expectedValue === 'bigint') {
				await assertEvaluationEquals(dc, `stack[${i}]`, { value: expectedValue.toString(), type: 'uint64' });
			} else {
				throw new Error(`Improper expected stack value: ${expectedValue}`);
			}
		}));
	}

	if (typeof scratch !== 'undefined') {
		for (const key of scratch.keys()) {
			if (key < 0 || key > 255) {
				assert.fail(`Invalid scratch key: ${key}`);
			}
		}

		const scratchParentVariable = executionScopeVariables.find(variable => variable.name === 'scratch');
		assert.ok(scratchParentVariable);

		const scratchVariableResponse = await dc.variablesRequest({ variablesReference: scratchParentVariable.variablesReference });
		assert.ok(scratchVariableResponse.success);
		const scratchVariables = scratchVariableResponse.body.variables;

		assert.strictEqual(scratchVariables.length, 256);

		for (let i = 0; i < 256; i++) {
			assert.strictEqual(scratchVariables[i].name, i.toString());
			let expectedValue = scratch.get(i);
			if (typeof expectedValue === 'undefined') {
				expectedValue = 0;
			}
			assertAvmValuesEqual(scratchVariables[i], expectedValue);
		}

		await Promise.all(scratchVariables.map(async (actual, i) => {
			let expectedValue = scratch.get(i);
			if (typeof expectedValue === 'undefined') {
				expectedValue = 0;
			}

			if (expectedValue instanceof Uint8Array) {
				await assertEvaluationEquals(dc, `scratch[${i}]`, { value: '0x' + Buffer.from(expectedValue).toString('hex'), type: 'byte[]' });
			} else if (typeof expectedValue === 'number' || typeof expectedValue === 'bigint') {
				await assertEvaluationEquals(dc, `scratch[${i}]`, { value: expectedValue.toString(), type: 'uint64' });
			} else {
				throw new Error(`Improper expected scratch value: ${expectedValue}`);
			}
		}));
	}

	if (typeof apps !== 'undefined') {
		for (const expectedAppState of apps) {
			const { appID, globalState } = expectedAppState;
			const appState = appStates.find(variable => variable.name === appID.toString());
			assert.ok(appState, `Expected app state for app ID ${appID} not found`);

			const appStateResponse = await dc.variablesRequest({ variablesReference: appState.variablesReference });
			assert.ok(appStateResponse.success);
			const appStateVariables = appStateResponse.body.variables;

			if (typeof globalState !== 'undefined') {
				const globalStateVariable = appStateVariables.find(variable => variable.name === 'global');
				assert.ok(globalStateVariable);

				const globalStateResponse = await dc.variablesRequest({ variablesReference: globalStateVariable.variablesReference });
				assert.ok(globalStateResponse.success);
				const globalStateVariables = globalStateResponse.body.variables;

				for (const [key, expectedValue] of globalState.entries()) {
					const actual = globalStateVariables.find(variable => variable.name === key.toString());
					assert.ok(actual, `Expected global state key "${Buffer.from(key).toString('hex')}" not found`);
					assertAvmValuesEqual(actual, expectedValue);
				}
			}
		}
	}
}

async function advanceTo(dc: DebugClient, args: { program: string, line: number, column?: number} ) {
	const breakpointResponse = await dc.setBreakpointsRequest({
		source: { path: args.program },
		breakpoints: [{
			line: args.line,
			column: args.column
		}],
	});
	assert.ok(breakpointResponse.success);
	assert.strictEqual(breakpointResponse.body.breakpoints.length, 1);
	const bp = breakpointResponse.body.breakpoints[0];
	assert.ok(bp.verified);

	const continueResponse = await dc.continueRequest({ threadId: 0 });
	assert.ok(continueResponse.success);

	await dc.assertStoppedLocation('breakpoint', { path: args.program, line: args.line, column: args.column });
}

async function assertEvaluationEquals(dc: DebugClient, expression: string, expected: { value: string, type?: string }) {
	const response = await dc.evaluateRequest({ expression });
	assert.ok(response.success);
	assert.strictEqual(response.body.result, expected.value, `Expected "${expression}" to evaluate to "${expected.value}", but got "${response.body.result}"`);
	if (expected.type) {
		assert.strictEqual(response.body.type, expected.type, `Expected "${expression}" to have type "${expected.type}", but got "${response.body.type}"`);
	}
}

const PROJECT_ROOT = path.join(__dirname, '../../');
const DATA_ROOT = path.join(PROJECT_ROOT, 'src/tests/data/');

describe('Debug Adapter Tests', () => {
	let server: BasicServer;
	let dc: DebugClient;

	beforeEach(async () => {
		const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
			testFileAccessor,
			path.join(DATA_ROOT, 'local-state-changes-resp.json'),
			path.join(DATA_ROOT, 'state-changes-sources.json')
		);
		server = new BasicServer(testFileAccessor, debugAssets);

		dc = new DebugClient('node', '', 'teal');
		await dc.start(server.port());
	});

	afterEach(() => {
		dc.stop();
		server.dispose();
	});

	describe('basic', () => {
		it('should produce error for unknown request', async () => {
			let success: boolean;
			try {
				await dc.send('illegal_request');
				success = true;
			} catch (err) {
				success = false;
			}
			assert.strictEqual(success, false);
		});
	});

	describe('initialize', () => {

		it('should return supported features', () => {
			return dc.initializeRequest().then(response => {
				response.body = response.body || {};
				assert.strictEqual(response.body.supportsConfigurationDoneRequest, true);
			});
		});

		it('should produce error for invalid \'pathFormat\'', async () => {
			let success: boolean;
			try {
				await dc.initializeRequest({
					adapterID: 'teal',
					linesStartAt1: true,
					columnsStartAt1: true,
					pathFormat: 'url'
				});
				success = true;
			} catch (err) {
				success = false;
			}
			assert.strictEqual(success, false);
		});
	});

	describe('launch', () => {

		it('should run program to the end', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'state-changes.teal');

			await Promise.all([
				dc.configurationSequence(),
				dc.launch({ program: PROGRAM }),
				dc.waitForEvent('terminated')
			]);
		});

		it('should stop on entry', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'state-changes.teal');
			const ENTRY_LINE = 1;

			await Promise.all([
				dc.configurationSequence(),
				dc.launch({ program: PROGRAM, stopOnEntry: true }),
				dc.assertStoppedLocation('entry', { line: ENTRY_LINE } )
			]);
		});
	});

	describe('setBreakpoints', () => {

		it('should stop on a breakpoint', async () => {

			const PROGRAM = path.join(DATA_ROOT, 'state-changes.teal');
			const BREAKPOINT_LINE = 2;

			await dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: BREAKPOINT_LINE });
		});
	});

	describe('evaluation', () => {

		it('should return variables', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'state-changes.teal');
			const BREAKPOINT_LINE = 3;

			await dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: BREAKPOINT_LINE });

			await assertVariables(dc, {
				pc: 6,
				stack: [
					1054
				],
			});

			await advanceTo(dc, { program: PROGRAM, line: 14 });

			await assertVariables(dc, {
				pc: 37,
				stack: [
					Buffer.from('8e169311', 'hex'),
					Buffer.from('8913c1f8', 'hex'),
					Buffer.from('d513c44e', 'hex'),
					Buffer.from('8e169311', 'hex'),
				],
			});

			await advanceTo(dc, { program: PROGRAM, line: 25 });

			await assertVariables(dc, {
				pc: 95,
				stack: [
					0,
					Buffer.from('local-bytes-key'),
					Buffer.from('xqcL'),
				],
			});
		});
	});
});
