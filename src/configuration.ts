'use strict';

import * as vscode from 'vscode';
import {
  WorkspaceFolder,
  DebugConfiguration,
  ProviderResult,
  CancellationToken,
} from 'vscode';

export class TealDebugConfigProvider
  implements vscode.DebugConfigurationProvider
{
  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  resolveDebugConfiguration(
    _folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    _token?: CancellationToken,
  ): ProviderResult<DebugConfiguration> {
    // NOTE: log the overloaded config to window
    vscode.window.showInformationMessage(JSON.stringify(config));

    // Check necessary part, we do need these 2 files for debug
    if (!config.simulationTraceFile) {
      return vscode.window
        .showInformationMessage(
          'missing critical part: simulationTraceFile in launch.json',
        )
        .then((_) => {
          return undefined;
        });
    }

    if (!config.appSourceDescriptionFile) {
      return vscode.window
        .showInformationMessage(
          'missing critical part: appSourceDescriptionFile in launch.json',
        )
        .then((_) => {
          return undefined;
        });
    }

    return config;
  }
}
