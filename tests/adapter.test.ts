import * as assert from 'assert';
import * as path from 'path';
import * as algosdk from 'algosdk';
import { DebugProtocol } from '@vscode/debugprotocol';
import { DebugClient } from './client';
import { TEALDebuggingAssets, ByteArrayMap } from '../src/debugAdapter/utils';
import { BasicServer } from '../src/debugAdapter/basicServer';
import {
	assertVariables,
	advanceTo,
	testFileAccessor,
	DATA_ROOT,
	DEBUG_CLIENT_PATH,
} from './testing';

describe('Debug Adapter Tests', () => {

	describe('general', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'app-state-changes/local-simulate-response.json'),
				path.join(DATA_ROOT, 'app-state-changes/sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			// dc = new DebugClient('node', DEBUG_CLIENT_PATH, 'teal', {
			// 	env: {
			// 		...process.env,
			// 		/* eslint-disable @typescript-eslint/naming-convention */
			// 		ALGORAND_SIMULATION_RESPONSE_PATH: path.join(DATA_ROOT, 'state-changes-local-resp.json'),
			// 		ALGORAND_TXN_GROUP_SOURCES_DESCRIPTION_PATH: path.join(DATA_ROOT, 'state-changes-sources.json'),
			// 		/* eslint-enable @typescript-eslint/naming-convention */
			// 	}
			// }, true);
			// await dc.start();
			dc = new DebugClient('node', DEBUG_CLIENT_PATH, 'teal');
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
				const PROGRAM = path.join(DATA_ROOT, 'app-state-changes/local-simulate-response.json');

				await Promise.all([
					dc.configurationSequence(),
					dc.launch({ program: PROGRAM }),
					dc.waitForEvent('terminated')
				]);
			});

			it('should stop on entry', async () => {
				const PROGRAM = path.join(DATA_ROOT, 'app-state-changes/local-simulate-response.json');
				const ENTRY_LINE = 2;

				await Promise.all([
					dc.configurationSequence(),
					dc.launch({ program: PROGRAM, stopOnEntry: true }),
					dc.assertStoppedLocation('entry', { line: ENTRY_LINE } )
				]);
			});
		});

		describe('setBreakpoints', () => {

			it('should stop on a breakpoint', async () => {

				const PROGRAM = path.join(DATA_ROOT, 'app-state-changes/state-changes.teal');
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
				path.join(DATA_ROOT, 'stack-scratch/simulate-response.json'),
				path.join(DATA_ROOT, 'stack-scratch/sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', DEBUG_CLIENT_PATH, 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'stack-scratch/stack-scratch.teal');

			await dc.hitBreakpoint({ program: PROGRAM }, { path: PROGRAM, line: 3 });

			await assertVariables(dc, {
				pc: 6,
				stack: [
					1005
				],
				scratch: new Map(),
			});

			await advanceTo(dc, { program: PROGRAM, line: 12 });

			await assertVariables(dc, {
				pc: 18,
				stack: [
					10
				],
				scratch: new Map(),
			});

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
		});
	});

	describe('Global state changes', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'app-state-changes/global-simulate-response.json'),
				path.join(DATA_ROOT, 'app-state-changes/sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', DEBUG_CLIENT_PATH, 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'app-state-changes/state-changes.teal');

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
				path.join(DATA_ROOT, 'app-state-changes/local-simulate-response.json'),
				path.join(DATA_ROOT, 'app-state-changes/sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', DEBUG_CLIENT_PATH, 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'app-state-changes/state-changes.teal');

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
				path.join(DATA_ROOT, 'app-state-changes/box-simulate-response.json'),
				path.join(DATA_ROOT, 'app-state-changes/sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', DEBUG_CLIENT_PATH, 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		it('should return variables correctly', async () => {
			const PROGRAM = path.join(DATA_ROOT, 'app-state-changes/state-changes.teal');

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

	describe('Source mapping', () => {
		let server: BasicServer;
		let dc: DebugClient;

		beforeEach(async () => {
			const debugAssets: TEALDebuggingAssets = await TEALDebuggingAssets.loadFromFiles(
				testFileAccessor,
				path.join(DATA_ROOT, 'sourcemap-test/simulate-response.json'),
				path.join(DATA_ROOT, 'sourcemap-test/sources.json')
			);
			server = new BasicServer(testFileAccessor, debugAssets);

			dc = new DebugClient('node', DEBUG_CLIENT_PATH, 'teal');
			await dc.start(server.port());
		});

		afterEach(async () => {
			await dc.stop();
			server.dispose();
		});

		interface SourceInfo {
			path: string,
			validBreakpoints: DebugProtocol.BreakpointLocation[],
		}

		const testSources: SourceInfo[] = [
			{
				path: path.join(DATA_ROOT, 'sourcemap-test/sourcemap-test.teal'),
				validBreakpoints: [
					{ line: 4, column: 1 },
					{ line: 4, column: 20 },
					{ line: 4, column: 27 },
					{ line: 4, column: 31 },
					{ line: 7, column: 5 },
					{ line: 7, column: 12 },
					{ line: 7, column: 19 },
					{ line: 8, column: 5 },
					{ line: 8, column: 12 },
					{ line: 8, column: 19 },
					{ line: 12, column: 5 },
					{ line: 13, column: 5 },
				]
			},
			{
				path: path.join(DATA_ROOT, 'sourcemap-test/lib.teal'),
				validBreakpoints: [
					{ line: 2, column: 22 },
					{ line: 2, column: 26 },
				]
			},
		];

		it('should return correct breakpoint locations', async () => {
			for (const source of testSources) {
				const response = await dc.breakpointLocationsRequest({
					source: {
						path: source.path,
					},
					line: 0,
					endLine: 100,
				});
				assert.ok(response.success);
				
				const actualBreakpointLocations = response.body.breakpoints.slice();
				// Sort the response so that it's easier to compare
				actualBreakpointLocations.sort((a, b) => {
					if (a.line === b.line) {
						return (a.column ?? 0) - (b.column ?? 0);
					}
					return a.line - b.line;
				});
	
				assert.deepStrictEqual(actualBreakpointLocations, source.validBreakpoints);
			}
		});

		it('should correctly set and stop at valid breakpoints', async () => {
			await Promise.all([
				dc.configurationSequence(),
				dc.launch({
					program: path.join(DATA_ROOT, 'sourcemap-test/simulate-response.json'),
					stopOnEntry: true
				}),
				dc.assertStoppedLocation('entry', {})
			]);

			for (const source of testSources) {
				const result = await dc.setBreakpointsRequest({
					source: { path: source.path },
					breakpoints: source.validBreakpoints, 
				});
				assert.ok(result.success);

				assert.ok(result.body.breakpoints.every(bp => bp.verified));
				const actualBreakpointLocations = result.body.breakpoints
					.map(bp => ({ line: bp.line, column: bp.column }));
				assert.deepStrictEqual(actualBreakpointLocations, source.validBreakpoints);
			}

			// The breakpoints will not necessarily be hit in order, since PCs map to different
			// places in the source file, so we will keep track of which breakpoints have been hit.
			const seenBreakpointLocation: boolean[][] = testSources.map(source => source.validBreakpoints.map(() => false));

			while (seenBreakpointLocation.some(sourceBreakpoints => sourceBreakpoints.some(seen => !seen))) {
				await dc.continueRequest({ threadId: 1 });
				const stoppedResponse = await dc.assertStoppedLocation('breakpoint', {});
				const stoppedFrame = stoppedResponse.body.stackFrames[0];
				let found = false;
				for (let sourceIndex = 0; sourceIndex < testSources.length; sourceIndex++) {
					const source = testSources[sourceIndex];
					if (source.path !== stoppedFrame.source?.path) {
						continue;
					}
					for (let i = 0; i < source.validBreakpoints.length; i++) {
						if (source.validBreakpoints[i].line === stoppedFrame.line &&
							source.validBreakpoints[i].column === stoppedFrame.column) {
							assert.strictEqual(seenBreakpointLocation[sourceIndex][i], false, `Breakpoint ${i} was hit twice. Line: ${stoppedFrame.line}, Column: ${stoppedFrame.column}, Path: ${source.path}`);
							seenBreakpointLocation[sourceIndex][i] = true;
							found = true;
							break;
						}
					}
				}
				assert.ok(found, `Breakpoint at path ${stoppedFrame.source?.path}, line ${stoppedFrame.line}, column ${stoppedFrame.column} was not expected`);
			}
		});

		it('should correctly handle invalid breakpoints and not stop at them', async () => {
			await Promise.all([
				dc.configurationSequence(),
				dc.launch({
					program: path.join(DATA_ROOT, 'sourcemap-test/simulate-response.json'),
					stopOnEntry: true
				}),
				dc.assertStoppedLocation('entry', {})
			]);

			const result = await dc.setBreakpointsRequest({
				source: { path: path.join(DATA_ROOT, 'sourcemap-test/sourcemap-test.teal') },
				breakpoints: [
					{ line: 0, column: 0 },
					{ line: 100, column: 0 },
					{ line: 0, column: 100 },
					{ line: 100, column: 100 },
				],
			});
			assert.ok(result.success);

			assert.ok(result.body.breakpoints.every(bp => !bp.verified));

			await Promise.all([
				dc.continueRequest({ threadId: 1 }),
				dc.waitForEvent('terminated')
			]);
		});
	});
});
