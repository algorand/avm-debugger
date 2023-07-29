'use strict';

import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';

// TODO: fix this MockConfigurationProvider and line it up with package.json
// TODO: so I figured out that, when we are testing the plugin, modify the launch.json,
//       the input to resolveDebugConfiguration should give you full changed
//       config: DebugConfiguration.
// TODO: also remember to npm run build before each test tho.
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

		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'markdown') {
				config.type = 'mock';
				config.name = 'Launch';
				config.request = 'launch';
				config.program = '${file}';
				config.stopOnEntry = true;
			}
		}

		if (!config.program) {
			return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
				return undefined;	// abort launch
			});
		}

		return config;
	}
}
