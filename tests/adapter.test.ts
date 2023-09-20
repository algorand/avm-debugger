import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as algosdk from 'algosdk';
import { DebugClient } from '@vscode/debugadapter-testsupport';
import { TEALDebuggingAssets, ByteArrayMap } from '../src/debugAdapter/utils';
import { BasicServer } from '../src/debugAdapter/basicServer';
import { FileAccessor } from '../src/debugAdapter/txnGroupWalkerRuntime';

export const testFileAccessor: FileAccessor = {
	isWindows: typeof process !== 'undefined' && process.platform === 'win32',
	async readFile(path: string): Promise<Uint8Array> {
		return await fs.readFile(path);
	},
	async writeFile(path: string, contents: Uint8Array) {
		return await fs.writeFile(path, contents);
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
		globalState?: ByteArrayMap<number | bigint | Uint8Array>,
		localState?: Array<{
			account: string,
			state: ByteArrayMap<number | bigint | Uint8Array>,
		}>,
		boxState?: ByteArrayMap<number | bigint | Uint8Array>,
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
			const { appID, globalState, localState, boxState } = expectedAppState;
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
					const keyStr = '0x' + Buffer.from(key).toString('hex');
					const actual = globalStateVariables.find(variable => variable.name === keyStr);
					assert.ok(actual, `Expected global state key "${keyStr}" not found`);
					assertAvmValuesEqual(actual, expectedValue);
				}

				assert.strictEqual(globalStateVariables.length, globalState.size);
			}

			if (typeof localState !== 'undefined') {
				const localStateVariable = appStateVariables.find(variable => variable.name === 'local');
				assert.ok(localStateVariable);

				const localStateResponse = await dc.variablesRequest({ variablesReference: localStateVariable.variablesReference });
				assert.ok(localStateResponse.success);
				const localStateAccounts = localStateResponse.body.variables;

				for (const expectedAccountState of localState) {
					const accountLocalState = localStateAccounts.find(variable => variable.name === expectedAccountState.account);
					assert.ok(accountLocalState, `Expected local state for account ${expectedAccountState.account} not found`);

					const accountLocalStateResponse = await dc.variablesRequest({ variablesReference: accountLocalState.variablesReference });
					assert.ok(accountLocalStateResponse.success);
					const accountLocalStateVariables = accountLocalStateResponse.body.variables;

					for (const [key, expectedValue] of expectedAccountState.state.entries()) {
						const keyStr = '0x' + Buffer.from(key).toString('hex');
						const actual = accountLocalStateVariables.find(variable => variable.name === keyStr);
						assert.ok(actual, `Expected local state key "${keyStr}" not found`);
						assertAvmValuesEqual(actual, expectedValue);
					}

					assert.strictEqual(accountLocalStateVariables.length, expectedAccountState.state.size);
				}

				assert.strictEqual(localStateAccounts.length, localState.length);
			}

			if (typeof boxState !== 'undefined') {
				const boxStateVariable = appStateVariables.find(variable => variable.name === 'box');
				assert.ok(boxStateVariable);

				const boxStateResponse = await dc.variablesRequest({ variablesReference: boxStateVariable.variablesReference });
				assert.ok(boxStateResponse.success);
				const boxStateVariables = boxStateResponse.body.variables;

				for (const [key, expectedValue] of boxState.entries()) {
					const keyStr = '0x' + Buffer.from(key).toString('hex');
					const actual = boxStateVariables.find(variable => variable.name === keyStr);
					assert.ok(actual, `Expected box state key "${keyStr}" not found`);
					assertAvmValuesEqual(actual, expectedValue);
				}

				assert.strictEqual(boxStateVariables.length, boxState.size);
			}
		}
	}
}

async function advanceTo(dc: DebugClient, args: { program: string, line: number, column?: number} ) {
	console.log(`advanceTo: started with ${JSON.stringify(args)}`);

	const breakpointResponse = await dc.setBreakpointsRequest({
		source: { path: args.program },
		breakpoints: [{
			line: args.line,
			column: args.column
		}],
	});

	console.log(`advanceTo: breakpoint set`);

	assert.ok(breakpointResponse.success);
	assert.strictEqual(breakpointResponse.body.breakpoints.length, 1);
	const bp = breakpointResponse.body.breakpoints[0];
	assert.ok(bp.verified);

	console.log(`advanceTo: continue request sending`);

	const continueResponse = await dc.continueRequest({ threadId: 0 });
	assert.ok(continueResponse.success);

	console.log(`advanceTo: continue request done`);

	await dc.assertStoppedLocation('breakpoint', { path: args.program, line: args.line, column: args.column });

	console.log(`advanceTo: done`);
}

async function assertEvaluationEquals(dc: DebugClient, expression: string, expected: { value: string, type?: string }) {
	const response = await dc.evaluateRequest({ expression });
	assert.ok(response.success);
	assert.strictEqual(response.body.result, expected.value, `Expected "${expression}" to evaluate to "${expected.value}", but got "${response.body.result}"`);
	if (expected.type) {
		assert.strictEqual(response.body.type, expected.type, `Expected "${expression}" to have type "${expected.type}", but got "${response.body.type}"`);
	}
}

const PROJECT_ROOT = path.join(__dirname, '../');
const DATA_ROOT = path.join(PROJECT_ROOT, 'tests/data/');

describe('Debug Adapter Tests', () => {

	describe('general', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'state-changes-local-resp.json'),
				path.join(DATA_ROOT, 'state-changes-sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', '', 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
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
	});

	describe('Stack and scratch changes', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'stack-scratch-resp.json'),
				path.join(DATA_ROOT, 'stack-scratch-sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', '', 'teal');
			await dc.start(server.port());

			console.log('beforeEach done');
		});

		afterEach(async () => {
			console.log('afterEach started');

			await dc.stop();
			server.dispose();

			console.log('afterEach done');
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'stack-scratch.teal');

			console.log('a');

			await dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: 3 });

			await assertVariables(dc, {
				pc: 6,
				stack: [
					1005
				],
				scratch: new Map(),
			});

			console.log('b');

			await advanceTo(dc, { program: PROGRAM, line: 12 });

			await assertVariables(dc, {
				pc: 18,
				stack: [
					10
				],
				scratch: new Map(),
			});

			console.log('c');

			await advanceTo(dc, { program: PROGRAM, line: 22 });

			await assertVariables(dc, {
				pc: 34,
				stack: [
					10,
					0,
					0,
					0,
					0,
					0,
					0,
				],
				scratch: new Map(),
			});

			console.log('d');

			await advanceTo(dc, { program: PROGRAM, line: 35 });

			await assertVariables(dc, {
				pc: 63,
				stack: [
					10,
					30,
					Buffer.from("1!"),
					Buffer.from("5!"),
				],
				scratch: new Map(),
			});

			console.log('e');

			await advanceTo(dc, { program: PROGRAM, line: 36 });

			await assertVariables(dc, {
				pc: 80,
				stack: [
					10,
					30,
					Buffer.from("1!"),
					Buffer.from("5!"),
					0,
					2,
					1,
					1,
					5,
					BigInt('18446744073709551615')
				],
				scratch: new Map(),
			});

			console.log('f');

			await advanceTo(dc, { program: PROGRAM, line: 37 });

			await assertVariables(dc, {
				pc: 82,
				stack: [
					10,
					30,
					Buffer.from("1!"),
					Buffer.from("5!"),
					0,
					2,
					1,
					1,
					5,
				],
				scratch: new Map([
					[
						1,
						BigInt('18446744073709551615')
					],
				]),
			});

			console.log('g');

			await advanceTo(dc, { program: PROGRAM, line: 39 });

			await assertVariables(dc, {
				pc: 85,
				stack: [
					10,
					30,
					Buffer.from("1!"),
					Buffer.from("5!"),
					0,
					2,
					1,
					1,
				],
				scratch: new Map([
					[
						1,
						BigInt('18446744073709551615')
					],
					[
						5,
						BigInt('18446744073709551615')
					],
				]),
			});

			console.log('h');

			await advanceTo(dc, { program: PROGRAM, line: 41 });

			await assertVariables(dc, {
				pc: 89,
				stack: [
					10,
					30,
					Buffer.from("1!"),
					Buffer.from("5!"),
					0,
					2,
					1,
					1,
				],
				scratch: new Map([
					[
						1,
						BigInt('18446744073709551615')
					],
					[
						5,
						BigInt('18446744073709551615')
					],
				]),
			});

			console.log('i');

			await advanceTo(dc, { program: PROGRAM, line: 13 });

			await assertVariables(dc, {
				pc: 21,
				stack: [
					30,
				],
				scratch: new Map([
					[
						1,
						BigInt('18446744073709551615')
					],
					[
						5,
						BigInt('18446744073709551615')
					],
				]),
			});

			console.log('j');
		});
	});

	describe('Global state changes', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'state-changes-global-resp.json'),
				path.join(DATA_ROOT, 'state-changes-sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', '', 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'state-changes.teal');

			await dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: 3 });

			await assertVariables(dc, {
				pc: 6,
				stack: [
					1050
				],
				apps: [{
					appID: 1050,
					globalState: new ByteArrayMap()
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 14 });

			await assertVariables(dc, {
				pc: 37,
				stack: [
					Buffer.from('8e169311', 'hex'),
					Buffer.from('8913c1f8', 'hex'),
					Buffer.from('d513c44e', 'hex'),
					Buffer.from('8913c1f8', 'hex'),
				],
				apps: [{
					appID: 1050,
					globalState: new ByteArrayMap()
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 31 });

			await assertVariables(dc, {
				pc: 121,
				stack: [
					Buffer.from('global-int-key'),
					0xdeadbeef,
				],
				apps: [{
					appID: 1050,
					globalState: new ByteArrayMap()
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 32 });

			await assertVariables(dc, {
				pc: 122,
				stack: [],
				apps: [{
					appID: 1050,
					globalState: new ByteArrayMap([
						[
							Buffer.from('global-int-key'),
							0xdeadbeef,
						],
					])
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 35 });

			await assertVariables(dc, {
				pc: 156,
				stack: [],
				apps: [{
					appID: 1050,
					globalState: new ByteArrayMap<number | bigint | Uint8Array>([
						[
							Buffer.from('global-int-key'),
							0xdeadbeef,
						],
						[
							Buffer.from('global-bytes-key'),
							Buffer.from('welt am draht'),
						]
					])
				}],
			});
		});
	});

	describe('Local state changes', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'state-changes-local-resp.json'),
				path.join(DATA_ROOT, 'state-changes-sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', '', 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'state-changes.teal');

			await dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: 3 });

			await assertVariables(dc, {
				pc: 6,
				stack: [
					1054
				],
				apps: [{
					appID: 1054,
					localState: [{
						account: 'YGOSQB6R5IVQDJHJUHTIZAJNWNIT7VLMWHXFWY2H5HMWPK7QOPXHELNPJ4',
						state: new ByteArrayMap(),
					}],
				}],
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
				apps: [{
					appID: 1054,
					localState: [{
						account: 'YGOSQB6R5IVQDJHJUHTIZAJNWNIT7VLMWHXFWY2H5HMWPK7QOPXHELNPJ4',
						state: new ByteArrayMap(),
					}],
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 21 });

			await assertVariables(dc, {
				pc: 69,
				stack: [
					algosdk.decodeAddress('YGOSQB6R5IVQDJHJUHTIZAJNWNIT7VLMWHXFWY2H5HMWPK7QOPXHELNPJ4').publicKey,
					Buffer.from('local-int-key'),
					0xcafeb0ba,
				],
				apps: [{
					appID: 1054,
					localState: [{
						account: 'YGOSQB6R5IVQDJHJUHTIZAJNWNIT7VLMWHXFWY2H5HMWPK7QOPXHELNPJ4',
						state: new ByteArrayMap(),
					}],
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 22 });

			await assertVariables(dc, {
				pc: 70,
				stack: [],
				apps: [{
					appID: 1054,
					localState: [{
						account: 'YGOSQB6R5IVQDJHJUHTIZAJNWNIT7VLMWHXFWY2H5HMWPK7QOPXHELNPJ4',
						state: new ByteArrayMap([
							[
								Buffer.from('local-int-key'),
								0xcafeb0ba,
							],
						]),
					}],
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 26 });

			await assertVariables(dc, {
				pc: 96,
				stack: [],
				apps: [{
					appID: 1054,
					localState: [{
						account: 'YGOSQB6R5IVQDJHJUHTIZAJNWNIT7VLMWHXFWY2H5HMWPK7QOPXHELNPJ4',
						state: new ByteArrayMap<number | bigint | Uint8Array>([
							[
								Buffer.from('local-int-key'),
								0xcafeb0ba,
							],
							[
								Buffer.from('local-bytes-key'),
								Buffer.from('xqcL'),
							],
						]),
					}],
				}],
			});
		});
	});

	describe('Box state changes', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'state-changes-box-resp.json'),
				path.join(DATA_ROOT, 'state-changes-sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', '', 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'state-changes.teal');

			await dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: 3 });

			await assertVariables(dc, {
				pc: 6,
				stack: [
					1058
				],
				apps: [{
					appID: 1058,
					boxState: new ByteArrayMap()
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 14 });

			await assertVariables(dc, {
				pc: 37,
				stack: [
					Buffer.from('8e169311', 'hex'),
					Buffer.from('8913c1f8', 'hex'),
					Buffer.from('d513c44e', 'hex'),
					Buffer.from('d513c44e', 'hex'),
				],
				apps: [{
					appID: 1058,
					boxState: new ByteArrayMap()
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 40 });

			await assertVariables(dc, {
				pc: 183,
				stack: [
					Buffer.from('box-key-1'),
					Buffer.from('box-value-1'),
				],
				apps: [{
					appID: 1058,
					boxState: new ByteArrayMap()
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 41 });

			await assertVariables(dc, {
				pc: 184,
				stack: [],
				apps: [{
					appID: 1058,
					boxState: new ByteArrayMap([
						[
							Buffer.from('box-key-1'),
							Buffer.from('box-value-1'),
						],
					])
				}],
			});

			await advanceTo(dc, { program: PROGRAM, line: 46 });

			await assertVariables(dc, {
				pc: 198,
				stack: [],
				apps: [{
					appID: 1058,
					boxState: new ByteArrayMap([
						[
							Buffer.from('box-key-1'),
							Buffer.from('box-value-1'),
						],
						[
							Buffer.from('box-key-2'),
							Buffer.from(''),
						]
					])
				}],
			});
		});
	});
});
