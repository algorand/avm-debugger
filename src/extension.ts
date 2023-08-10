'use strict';

import * as Net from 'net';
import * as vscode from 'vscode';
import { ProviderResult } from 'vscode';
import { MockDebugSession } from './mockDebug';
import { activateTealDebug, workspaceFileAccessor } from './activateMockDebug';
import { TEALDebuggingAssets, TEALDebuggingAssetsDescriptor, loadTEALDAConfiguration } from './utils';

const runMode: 'external' | 'server' = 'server';

export function activate(context: vscode.ExtensionContext) {

	// Load config for debug from launch.json here
	// Error abort if failed to load
	let config: vscode.DebugConfiguration | undefined = loadTEALDAConfiguration();
	if (typeof config === "undefined") {
		// TODO: check if this is the best practice of aborting?
		console.assert(0);
		return;
	}

	const debugAssetDescriptor: TEALDebuggingAssetsDescriptor = new TEALDebuggingAssetsDescriptor(config);
	const debugAssets: TEALDebuggingAssets = new TEALDebuggingAssets(config);

	switch (runMode) {
		case 'server':
			activateTealDebug(
				context, new TEALDebugAdapterServerDescriptorFactory(debugAssets), config);
			break;

		case 'external': default:
			activateTealDebug(context, new TEALDebugAdapterExecutableFactory(debugAssetDescriptor), config);
			break;
	}
}

export function deactivate() { }

export interface TEALDebugAdapterDescriptorFactory
	extends vscode.DebugAdapterDescriptorFactory {

	dispose(): any
}

// TODO: both factory should have constructor passing in debug asset descriptor class

class TEALDebugAdapterExecutableFactory
	implements TEALDebugAdapterDescriptorFactory {

	private _debugAssetDescriptor: TEALDebuggingAssetsDescriptor;

	constructor(debugAssetDescriptor: TEALDebuggingAssetsDescriptor) {
		this._debugAssetDescriptor = debugAssetDescriptor;
	}

	createDebugAdapterDescriptor(
		_session: vscode.DebugSession,
		executable: vscode.DebugAdapterExecutable | undefined
	): ProviderResult<vscode.DebugAdapterDescriptor> {
		// param "executable" contains the executable optionally specified in the package.json (if any)

		// use the executable specified in the package.json if it exists or determine it based on some other information (e.g. the session)

		// TODO: IMPLEMENT HERE
		if (!executable) {
			const command = "absolute path to my DA executable";
			const args = [
				"some args",
				"another arg"
			];
			const options = {
				cwd: "working directory for executable",
				env: { "envVariable": "some value" }
			};
			executable = new vscode.DebugAdapterExecutable(
				command, args, options
			);
		}

		// make VS Code launch the DA executable
		return executable;
	}

	dispose() { }
}

class TEALDebugAdapterServerDescriptorFactory
	implements TEALDebugAdapterDescriptorFactory {

	private server?: Net.Server;

	private _debugAssets: TEALDebuggingAssets;

	constructor(debugAssets: TEALDebuggingAssets) {
		this._debugAssets = debugAssets;
	}

	createDebugAdapterDescriptor(
		_session: vscode.DebugSession,
		_executable: vscode.DebugAdapterExecutable | undefined
	): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {

		if (!this.server) {
			this.server = Net.createServer(socket => {
				const session = new MockDebugSession(workspaceFileAccessor, this._debugAssets);
				session.setRunAsServer(true);
				session.start(socket as NodeJS.ReadableStream, socket);
			}).listen(0);
		}

		return new vscode.DebugAdapterServer(
			(this.server.address() as Net.AddressInfo).port
		);
	}

	dispose() {
		if (this.server) {
			this.server.close();
		}
	}
}
