import * as assert from 'assert';
import * as Path from 'path';
import * as fs from 'fs';
import { DebugClient } from '@vscode/debugadapter-testsupport';
import { TEALDebuggingAssets } from '../debugAdapter/utils';
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

async function assertVariables(dc: DebugClient, {
	pc,
	stack,
}: {
	pc?: number,
	stack?: Array<number | bigint | Uint8Array>,
}) {
	const scopesResponse = await dc.scopesRequest({ frameId: 0 });
	assert.ok(scopesResponse.success);
	const scopes = scopesResponse.body.scopes;

	const executionScope = scopes.find(scope => scope.name === 'Execution State');
	assert.ok(executionScope);

	const executionScopeResponse = await dc.variablesRequest({ variablesReference: executionScope.variablesReference });
	assert.ok(executionScopeResponse.success);
	const executionScopeVariables = executionScopeResponse.body.variables;

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

			const actualValue = stackVariables[i].value;
			const expectedValue = stack[i];
			
			if (expectedValue instanceof Uint8Array) {
				assert.strictEqual(stackVariables[i].type, 'byte[]');
				assert.ok(actualValue.startsWith('0x'));
				const actualBytes = Buffer.from(actualValue.slice(2), 'hex');
				assert.deepStrictEqual(new Uint8Array(actualBytes), new Uint8Array(expectedValue));
			} else if (typeof expectedValue === 'number' || typeof expectedValue === 'bigint') {
				assert.strictEqual(stackVariables[i].type, 'uint64');
				assert.strictEqual(BigInt(actualValue), BigInt(expectedValue));
			} else {
				throw new Error(`Improper expected stack value: ${expectedValue}`);
			}
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

suite('Node Debug Adapter', () => {

	const DEBUG_ADAPTER = './out/debugAdapter.js';

	const PROJECT_ROOT = Path.join(__dirname, '../../');
	const DATA_ROOT = Path.join(PROJECT_ROOT, 'src/tests/data/');


	let server: BasicServer;
	let dc: DebugClient;

	setup( async () => {
		const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
			testFileAccessor,
			Path.join(DATA_ROOT, 'local-state-changes-resp.json'),
			Path.join(DATA_ROOT, 'state-changes-sources.json')
		);
		server = new BasicServer(testFileAccessor, debugAssets);

		dc = new DebugClient('node', DEBUG_ADAPTER, 'teal');
		await dc.start(server.port());
	});

	teardown( () => {
		dc.stop();
		server.dispose();
	});


	suite('basic', () => {

		test('unknown request should produce error', done => {
			dc.send('illegal_request').then(() => {
				done(new Error("does not report error on unknown request"));
			}).catch(() => {
				done();
			});
		});
	});

	suite('initialize', () => {

		test('should return supported features', () => {
			return dc.initializeRequest().then(response => {
				response.body = response.body || {};
				assert.strictEqual(response.body.supportsConfigurationDoneRequest, true);
			});
		});

		test('should produce error for invalid \'pathFormat\'', done => {
			dc.initializeRequest({
				adapterID: 'teal',
				linesStartAt1: true,
				columnsStartAt1: true,
				pathFormat: 'url'
			}).then(response => {
				done(new Error("does not report error on invalid 'pathFormat' attribute"));
			}).catch(err => {
				// error expected
				done();
			});
		});
	});

	suite('launch', () => {

		test('should run program to the end', () => {

			const PROGRAM = Path.join(DATA_ROOT, 'state-changes.teal');

			return Promise.all([
				dc.configurationSequence(),
				dc.launch({ program: PROGRAM }),
				dc.waitForEvent('terminated')
			]);
		});

		test('should stop on entry', () => {

			const PROGRAM = Path.join(DATA_ROOT, 'state-changes.teal');
			const ENTRY_LINE = 1;

			return Promise.all([
				dc.configurationSequence(),
				dc.launch({ program: PROGRAM, stopOnEntry: true }),
				dc.assertStoppedLocation('entry', { line: ENTRY_LINE } )
			]);
		});
	});

	suite('setBreakpoints', () => {

		test('should stop on a breakpoint', () => {

			const PROGRAM = Path.join(DATA_ROOT, 'state-changes.teal');
			const BREAKPOINT_LINE = 2;

			return dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: BREAKPOINT_LINE });
		});
	});

	suite('evaluation', () => {

		test('should return variables', async () => {
			const PROGRAM = Path.join(DATA_ROOT, 'state-changes.teal');
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
				]
			});
		});
	});
});
