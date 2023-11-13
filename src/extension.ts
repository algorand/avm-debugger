'use strict';

import * as vscode from 'vscode';
import { activateTealDebug } from './activateMockDebug';
import {
  ServerDebugAdapterFactory,
  ExecutableDebugAdapterFactory,
} from './externalDescriptorFactory';
import { InlineDebugAdapterFactory } from './internalDescriptorFactory';

const runMode: 'external' | 'server' | 'inline' = 'inline';

export function activate(context: vscode.ExtensionContext) {
  switch (runMode) {
    case 'server':
      // run the debug adapter as a server inside the extension and communicate via a socket
      activateTealDebug(context, new ServerDebugAdapterFactory());
      break;

    case 'external':
      // run the debug adapter as a separate process
      activateTealDebug(context, new ExecutableDebugAdapterFactory());
      break;

    case 'inline':
      // run the debug adapter inside the extension and directly talk to it
      activateTealDebug(context, new InlineDebugAdapterFactory());
      break;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
