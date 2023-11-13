import * as vscode from 'vscode';
import { activateTealDebug } from './activateMockDebug';
import { InlineDebugAdapterFactory } from './internalDescriptorFactory';

export function activate(context: vscode.ExtensionContext) {
  // Inline is the only supported mode for running the debug adapter in the browser.
  activateTealDebug(context, new InlineDebugAdapterFactory());
}

export function deactivate() {
  // nothing to do
}
