import * as vscode from 'vscode';
import { ProviderResult } from 'vscode';
import { Server as DebugAdapterServer } from '../../src/node';
import { workspaceFileAccessor } from './fileAccessor';

export class ServerDebugAdapterFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  private server?: DebugAdapterServer;

  createDebugAdapterDescriptor(
    _session: vscode.DebugSession,
    _executable: vscode.DebugAdapterExecutable | undefined,
  ): ProviderResult<vscode.DebugAdapterDescriptor> {
    if (!this.server) {
      this.server = new DebugAdapterServer({
        fileAccessor: workspaceFileAccessor,
        port: 0,
        onSocketError: (err) => {
          vscode.window.showErrorMessage(
            `Debugger adapter socket error: ${err.message}`,
          );
        },
        onServerError: (err) => {
          vscode.window.showErrorMessage(
            `Debugger adapter server error: ${err.message}`,
          );
        },
      });
    }

    return new vscode.DebugAdapterServer(this.server.port());
  }

  dispose() {
    if (this.server) {
      this.server.close();
    }
  }
}
