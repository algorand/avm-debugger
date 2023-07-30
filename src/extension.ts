'use strict';

import * as Net from 'net';
import * as vscode from 'vscode';
import { ProviderResult } from 'vscode';
import { MockDebugSession } from './mockDebug';
import { activateTealDebug, workspaceFileAccessor } from './activateMockDebug';

const runMode: 'external' | 'server' = 'server';

export function activate(context: vscode.ExtensionContext) {

	switch (runMode) {
		case 'server':
			activateTealDebug(
				context, new TEALDebugAdapterServerDescriptorFactory());
			break;

		case 'external': default:
			activateTealDebug(context, new TEALDebugAdapterExecutableFactory());
			break;
	}
}

export function deactivate() { }

export interface TEALDebugAdapterDescriptorFactory
	extends vscode.DebugAdapterDescriptorFactory {

	dispose(): any
}

class TEALDebugAdapterExecutableFactory
	implements TEALDebugAdapterDescriptorFactory {

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

	createDebugAdapterDescriptor(
		_session: vscode.DebugSession,
		_executable: vscode.DebugAdapterExecutable | undefined
	): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {

		if (!this.server) {
			this.server = Net.createServer(socket => {
				const session = new MockDebugSession(workspaceFileAccessor);
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
