'use strict';

import { assert } from 'console';
import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';

// TODO: check https://code.visualstudio.com/api/extension-guides/debugger-extension#using-a-debugconfigurationprovider
export class TealDebugConfigProvider
	implements vscode.DebugConfigurationProvider {

	/**
	 * Massage a debug configuration just before a debug session is being launched,
	 * e.g. add all missing attributes to the debug configuration.
	 */
	resolveDebugConfiguration(
		_folder: WorkspaceFolder | undefined,
		config: DebugConfiguration,
		_token?: CancellationToken
	): ProviderResult<DebugConfiguration> {

		// TODO: Move the force override and check launch.json to activate
		// XXX: HACK: we are forcing overriding the config here
		const configs = vscode.workspace.getConfiguration('launch')
			.get('configurations') as vscode.DebugConfiguration[];

		assert(configs?.length && configs?.length > 0);
		config = configs[0];

		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'markdown') {
				config.type = 'teal';
				config.name = 'Launch';
				config.request = 'launch';
				config.program = '${file}';
				config.stopOnEntry = true;
			}
		}

		// NOTE: log the overloaded config to window
		vscode.window.showInformationMessage(JSON.stringify(config));

		// Check necessary part, we do need these 2 files for debug
		if (!config.simulationTraceFile) {
			return vscode.window.showInformationMessage(
				'missing critical part: simulationTraceFile in launch.json'
			).then(_ => {
				return undefined;
			});
		}

		if (!config.appSourceDescriptionFile) {
			return vscode.window.showInformationMessage(
				'missing critical part: appSourceDescriptionFile in launch.json'
			).then(_ => {
				return undefined;
			});
		}

		return config;
	}
}
