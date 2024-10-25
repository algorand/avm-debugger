/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  DebugSession,
  InitializedEvent,
  TerminatedEvent,
  StoppedEvent,
  BreakpointEvent,
  OutputEvent,
  Thread,
  StackFrame,
  Scope,
  Source,
  Handles,
  Breakpoint,
} from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';
import { AvmRuntime, IRuntimeBreakpoint } from './runtime';
import { Subject } from 'await-notify';
import * as algosdk from 'algosdk';
import { FileAccessor } from './fileAccessor';
import {
  AvmDebuggingAssets,
  utf8Decode,
  limitArray,
  ProgramSourceEntryFile,
  prefixPotentialError,
  isPuyaFrontendSourceExtension,
} from './utils';

const GENERIC_ERROR_ID = 9999;

export enum RuntimeEvents {
  stopOnEntry = 'stopOnEntry',
  stopOnStep = 'stopOnStep',
  stopOnBreakpoint = 'stopOnBreakpoint',
  stopOnException = 'stopOnException',
  breakpointValidated = 'breakpointValidated',
  end = 'end',
  error = 'error',
}

/**
 * This interface describes the avm-debug specific launch attributes
 * (which are not part of the Debug Adapter Protocol).
 * The schema for these attributes lives in the package.json of the avm-debug extension.
 * The interface should always match this schema.
 */
export interface ILaunchRequestArguments
  extends DebugProtocol.LaunchRequestArguments {
  /** An absolute path to the simulate response to debug. */
  simulateTraceFile: string;
  /** An absolute path to the file which maps programs to source maps. */
  programSourcesDescriptionFile?: string;
  /** JSON encoded content of the program sources description file. */
  programSourcesDescription?: ProgramSourceEntryFile;
  /** The folder containing the program sources description file (when using programSourcesDescription). */
  programSourcesDescriptionFolder?: string;
  /** Automatically stop target after launch. If not specified, target does not stop. */
  stopOnEntry?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IAttachRequestArguments extends ILaunchRequestArguments {}

export class AvmDebugSession extends DebugSession {
  // we don't support multiple threads, so we can use a hardcoded ID for the default thread
  private static threadID = 1;

  // txn group walker runtime for walking txn group.
  private _runtime: AvmRuntime;

  private _variableHandles = new Handles<
    | ProgramStateScope
    | OnChainStateScope
    | AppStateScope
    | AppSpecificStateScope
    | AvmValueReference
    | PuyaScope
  >();

  private _sourceHandles = new Handles<{
    content: string;
    mimeType?: string;
  }>();

  private _configurationDone = new Subject();

  /**
   * Creates a new debug adapter that is used for one debug session.
   * We configure the default implementation of a debug adapter here.
   */
  public constructor(private readonly fileAccessor: FileAccessor) {
    super();

    // this debugger uses zero-based lines and columns
    this.setDebuggerLinesStartAt1(false);
    this.setDebuggerColumnsStartAt1(false);

    this._runtime = new AvmRuntime(fileAccessor);

    // setup event handlers
    this._runtime.on(RuntimeEvents.stopOnEntry, () => {
      this.sendEvent(new StoppedEvent('entry', AvmDebugSession.threadID));
    });
    this._runtime.on(RuntimeEvents.stopOnStep, () => {
      this.sendEvent(new StoppedEvent('step', AvmDebugSession.threadID));
    });
    this._runtime.on(RuntimeEvents.stopOnBreakpoint, (breakpointID: number) => {
      const event = new StoppedEvent(
        'breakpoint',
        AvmDebugSession.threadID,
      ) as DebugProtocol.StoppedEvent;
      event.body.hitBreakpointIds = [breakpointID];
      this.sendEvent(event);
    });
    this._runtime.on(RuntimeEvents.stopOnException, (message) => {
      this.sendEvent(
        new StoppedEvent('exception', AvmDebugSession.threadID, message),
      );
    });
    this._runtime.on(
      RuntimeEvents.breakpointValidated,
      (bp: IRuntimeBreakpoint) => {
        this.sendEvent(
          new BreakpointEvent('changed', {
            verified: bp.verified,
            column: bp.location.column,
            id: bp.id,
          } as DebugProtocol.Breakpoint),
        );
      },
    );
    this._runtime.on(RuntimeEvents.end, () => {
      this.sendEvent(new TerminatedEvent());
    });
    this._runtime.on('error', (err: Error) => {
      this.sendEvent(new OutputEvent(err.message, 'stderr'));
    });
  }

  /**
   * The 'initialize' request is the first request called by the frontend
   * to interrogate the features the debug adapter provides.
   */
  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments,
  ) {
    // build and return the capabilities of this debug adapter:
    response.body = response.body || {};

    // the adapter implements the configurationDone request.
    response.body.supportsConfigurationDoneRequest = true;

    // make VS Code show a 'step back' button
    response.body.supportsStepBack = true;

    // make VS Code send the breakpointLocations request
    response.body.supportsBreakpointLocationsRequest = true;

    response.body.supportsDelayedStackTraceLoading = true;

    this.sendResponse(response);
  }

  /**
   * Called at the end of the configuration sequence.
   * Indicates that all breakpoints etc. have been sent to the DA and that the 'launch' can start.
   */
  protected configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse,
    args: DebugProtocol.ConfigurationDoneArguments,
  ): void {
    super.configurationDoneRequest(response, args);

    // notify the launchRequest that configuration has finished
    this._configurationDone.notify();
  }

  protected disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    args: DebugProtocol.DisconnectArguments,
    request?: DebugProtocol.Request,
  ): void {
    try {
      this._runtime.reset();
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected async attachRequest(
    response: DebugProtocol.AttachResponse,
    args: IAttachRequestArguments,
  ) {
    return this.launchRequest(response, args);
  }

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: ILaunchRequestArguments,
  ) {
    try {
      let programSourcesDescription: ProgramSourceEntryFile;
      let folder: string;
      if (args.programSourcesDescription !== undefined) {
        programSourcesDescription = args.programSourcesDescription;
        folder = args.programSourcesDescriptionFolder || '';
      } else if (args.programSourcesDescriptionFile !== undefined) {
        // earlier versions of avm-debugger passed program source information via a file/
        folder = args.programSourcesDescriptionFile;
        const sourcesDescriptionBytes = await prefixPotentialError(
          this.fileAccessor.readFile(args.programSourcesDescriptionFile),
          'Could not read program sources description file',
        );
        const sourcesDescriptionText = new TextDecoder().decode(
          sourcesDescriptionBytes,
        );
        programSourcesDescription = JSON.parse(
          sourcesDescriptionText,
        ) as ProgramSourceEntryFile;
      } else {
        throw Error('missing programSources');
      }

      const debugAssets = await AvmDebuggingAssets.loadFromFiles(
        this.fileAccessor,
        args.simulateTraceFile,
        programSourcesDescription,
        folder,
      );

      await this._runtime.onLaunch(debugAssets);

      // This indicates that we can now accept configuration requests like 'setBreakpoint'
      this.sendEvent(new InitializedEvent());

      // Wait until configuration has finished (and configurationDoneRequest has been called)
      await this._configurationDone.wait(0);

      // start the program in the runtime
      this._runtime.start(!!args.stopOnEntry, !args.noDebug);

      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments,
  ): void {
    try {
      const { path } = args.source;
      if (typeof path !== 'undefined') {
        const clientBreakpoints = args.breakpoints || [];

        // clear all breakpoints for this file
        this._runtime.clearBreakpoints(path);

        // set and verify breakpoint locations
        const actualBreakpoints = clientBreakpoints.map((clientBp) => {
          const line = this.convertClientLineToDebugger(clientBp.line);
          const column =
            typeof clientBp.column === 'number'
              ? this.convertClientColumnToDebugger(clientBp.column)
              : undefined;
          const runtimeBreakpoint = this._runtime.setBreakPoint(
            path,
            line,
            column,
          );
          const bp = new Breakpoint(
            runtimeBreakpoint.verified,
            this.convertDebuggerLineToClient(runtimeBreakpoint.location.line),
            typeof runtimeBreakpoint.location.column !== 'undefined'
              ? this.convertDebuggerColumnToClient(
                  runtimeBreakpoint.location.column,
                )
              : undefined,
          ) as DebugProtocol.Breakpoint;
          bp.id = runtimeBreakpoint.id;
          return bp;
        });

        // send back the actual breakpoint positions
        response.body = {
          breakpoints: actualBreakpoints,
        };
      }
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected breakpointLocationsRequest(
    response: DebugProtocol.BreakpointLocationsResponse,
    args: DebugProtocol.BreakpointLocationsArguments,
    request?: DebugProtocol.Request,
  ): void {
    try {
      const { path } = args.source;
      if (typeof path !== 'undefined') {
        const startLine = this.convertClientLineToDebugger(args.line);
        const endLine =
          typeof args.endLine === 'number'
            ? this.convertClientLineToDebugger(args.endLine)
            : startLine;
        const startColumn =
          typeof args.column === 'number'
            ? this.convertClientColumnToDebugger(args.column)
            : 0;
        const endColumn =
          typeof args.endColumn === 'number'
            ? this.convertClientColumnToDebugger(args.endColumn)
            : Number.MAX_SAFE_INTEGER;

        const locations = this._runtime
          .breakpointLocations(path)
          .filter(
            ({ line, column }) =>
              line >= startLine &&
              line <= endLine &&
              (typeof column !== 'undefined'
                ? column >= startColumn && column <= endColumn
                : true),
          );

        const responseBreakpoints: DebugProtocol.BreakpointLocation[] = [];
        for (const location of locations) {
          responseBreakpoints.push({
            line: this.convertDebuggerLineToClient(location.line),
            column:
              typeof location.column !== 'undefined'
                ? this.convertDebuggerColumnToClient(location.column)
                : undefined,
          });
        }
        response.body = {
          breakpoints: responseBreakpoints,
        };
      }
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    // runtime supports no threads so just return a default thread.
    response.body = {
      threads: [new Thread(AvmDebugSession.threadID, 'thread 1')],
    };
    this.sendResponse(response);
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
  ): void {
    try {
      const startFrame = args.startFrame || 0;
      const maxLevels = args.levels || 1000;

      const stk = this._runtime.stack(startFrame, startFrame + maxLevels);

      const stackFramesForResponse = stk.frames.map((frame, index) => {
        const id = startFrame + index;

        const protocolFrame = new StackFrame(id, frame.name);
        const sourceFile = frame.source;
        if (sourceFile !== undefined) {
          let source: Source | undefined = undefined;

          if (typeof sourceFile.path !== 'undefined') {
            source = this.createSource(sourceFile.path);
          } else if (typeof sourceFile.content !== 'undefined') {
            source = this.createSourceWithContent(
              sourceFile.name,
              sourceFile.content,
              sourceFile.contentMimeType,
            );
          }
          protocolFrame.source = source;
          protocolFrame.line = this.convertDebuggerLineToClient(
            sourceFile.line,
          );

          if (typeof sourceFile.column !== 'undefined') {
            protocolFrame.column = this.convertDebuggerColumnToClient(
              sourceFile.column,
            );
          }
          if (typeof sourceFile.endLine !== 'undefined') {
            protocolFrame.endLine = this.convertDebuggerLineToClient(
              sourceFile.endLine,
            );
          }
          if (typeof sourceFile.endColumn !== 'undefined') {
            protocolFrame.endColumn = this.convertDebuggerColumnToClient(
              sourceFile.endColumn,
            );
          }
        }
        return protocolFrame;
      });

      response.body = {
        totalFrames: stk.count,
        stackFrames: stackFramesForResponse,
        // 4 options for 'totalFrames':
        //omit totalFrames property: 	// VS Code has to probe/guess. Should result in a max. of two requests
        // totalFrames: stk.count			// stk.count is the correct size, should result in a max. of two requests
        //totalFrames: 1000000 			// not the correct size, should result in a max. of two requests
        //totalFrames: endFrame + 20 	// dynamically increases the size with every requested chunk, results in paging
      };
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments,
  ): void {
    try {
      const frame = this._runtime.getStackFrame(args.frameId);

      const scopes: DebugProtocol.Scope[] = [];
      if (frame !== undefined) {
        if (
          frame.programState?.variables !== undefined &&
          isPuyaFrontendSourceExtension(frame.source?.path)
        ) {
          scopes.push(
            new Scope(
              'Locals',
              this._variableHandles.create(new PuyaScope(args.frameId)),
              false,
            ),
          );
        }

        const programScope = new ProgramStateScope(args.frameId);
        const state = frame.programState;
        if (state !== undefined) {
          let scopeName = 'Program State';
          const appID = state.appId;
          if (typeof appID !== 'undefined') {
            scopeName += `: App ${appID}`;
          }
          scopes.push(
            new Scope(
              scopeName,
              this._variableHandles.create(programScope),
              false,
            ),
          );
        }
        scopes.push(
          new Scope(
            'On-chain State',
            this._variableHandles.create('chain'),
            false,
          ),
        );
      }

      response.body = { scopes };
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
    request?: DebugProtocol.Request,
  ): Promise<void> {
    try {
      let variables: DebugProtocol.Variable[] = [];

      const v = this._variableHandles.get(args.variablesReference);

      if (v instanceof ProgramStateScope) {
        const programState = this.getProgramState(v.frameIndex);
        if (v.specificState === 'program') {
          variables = [
            {
              name: 'pc',
              value: programState.pc.toString(),
              type: 'uint64',
              variablesReference: 0,
              evaluateName: 'pc',
            },
            ...(programState.op !== undefined
              ? [
                  {
                    name: 'op',
                    value: programState.op,
                    type: 'string',
                    variablesReference: 0,
                    evaluateName: 'op',
                  },
                ]
              : []),
            {
              name: 'stack',
              value: programState.stack.length === 0 ? '[]' : '[...]',
              type: 'array',
              variablesReference: this._variableHandles.create(
                new ProgramStateScope(v.frameIndex, 'stack'),
              ),
              indexedVariables: programState.stack.length,
              presentationHint: {
                kind: 'data',
              },
            },
            {
              name: 'scratch',
              value: '[...]',
              type: 'array',
              variablesReference: this._variableHandles.create(
                new ProgramStateScope(v.frameIndex, 'scratch'),
              ),
              indexedVariables: 256,
              presentationHint: {
                kind: 'data',
              },
            },
          ];
        } else if (v.specificState === 'stack') {
          if (args.filter !== 'named') {
            variables = programState.stack.map((value, index) =>
              this.convertAvmValue(v, value, index),
            );
          }
        } else if (v.specificState === 'scratch') {
          const expandedScratch: algosdk.modelsv2.AvmValue[] = [];
          for (let i = 0; i < 256; i++) {
            expandedScratch.push(
              programState.scratch.get(i) ||
                new algosdk.modelsv2.AvmValue({ type: 2 }),
            );
          }
          if (args.filter !== 'named') {
            variables = expandedScratch.map((value, index) =>
              this.convertAvmValue(v, value, index),
            );
          }
        }
      } else if (v instanceof PuyaScope) {
        const state = this.getProgramState(v.frameIndex);
        variables = state.variables.map((variable) => {
          const name = variable[0];
          const avmValue = variable[1];
          return this.convertAvmValue(v, avmValue, name);
        });
      } else if (v === 'chain') {
        const appIDs = this._runtime.getAppStateReferences();
        variables = [
          {
            name: 'app',
            value: '',
            type: 'object',
            variablesReference: this._variableHandles.create('app'),
            namedVariables: appIDs.length,
          },
        ];
      } else if (v === 'app') {
        const appIDs = this._runtime.getAppStateReferences();
        variables = appIDs.map((appID) => ({
          name: appID.toString(),
          value: '',
          type: 'object',
          variablesReference: this._variableHandles.create(
            new AppStateScope(appID),
          ),
          namedVariables: 3,
        }));
      } else if (v instanceof AppStateScope) {
        variables = [
          {
            name: 'global',
            value: '',
            type: 'object',
            variablesReference: this._variableHandles.create(
              new AppSpecificStateScope({ scope: 'global', appID: v.appID }),
            ),
            namedVariables: 1, // TODO
          },
          {
            name: 'local',
            value: '',
            type: 'object',
            variablesReference: this._variableHandles.create(
              new AppSpecificStateScope({ scope: 'local', appID: v.appID }),
            ),
            namedVariables: 1, // TODO
          },
          {
            name: 'box',
            value: '',
            type: 'object',
            variablesReference: this._variableHandles.create(
              new AppSpecificStateScope({ scope: 'box', appID: v.appID }),
            ),
            namedVariables: 1, // TODO
          },
        ];
      } else if (v instanceof AppSpecificStateScope) {
        const state = this._runtime.getAppState(v.appID);
        if (v.scope === 'global') {
          variables = state
            .globalStateArray()
            .map((kv) => this.convertAvmKeyValue(v, kv));
        } else if (v.scope === 'local') {
          if (typeof v.account === 'undefined') {
            const accounts = this._runtime.getAppLocalStateAccounts(v.appID);
            variables = accounts.map((account) => ({
              name: account,
              value: 'local state',
              type: 'object',
              variablesReference: this._variableHandles.create(
                new AppSpecificStateScope({
                  scope: 'local',
                  appID: v.appID,
                  account,
                }),
              ),
              namedVariables: 1, // TODO
              evaluateName: evaluateNameForScope(v, account),
            }));
          } else {
            variables = state
              .localStateArray(v.account)
              .map((kv) => this.convertAvmKeyValue(v, kv));
          }
        } else if (v.scope === 'box') {
          variables = state
            .boxStateArray()
            .map((kv) => this.convertAvmKeyValue(v, kv));
        }
      } else if (v instanceof AvmValueReference) {
        if (
          v.scope instanceof ProgramStateScope ||
          v.scope instanceof PuyaScope
        ) {
          const state = this.getProgramState(v.scope.frameIndex);
          let toExpand: algosdk.modelsv2.AvmValue | undefined;

          if (v.scope instanceof ProgramStateScope) {
            if (v.scope.specificState === 'stack') {
              toExpand = state.stack[v.key as number];
            } else if (v.scope.specificState === 'scratch') {
              toExpand =
                state.scratch.get(v.key as number) ||
                new algosdk.modelsv2.AvmValue({ type: 2 });
            }
          } else if (v.scope instanceof PuyaScope) {
            const variable = state.variables.find(([name]) => name === v.key);
            if (variable) {
              toExpand = variable[1];
            }
          }

          if (toExpand) {
            variables = this.expandAvmValue(toExpand, args.filter);
          }
        } else if (
          v.scope instanceof AppSpecificStateScope &&
          typeof v.key === 'string' &&
          v.key.startsWith('0x')
        ) {
          let toExpand: algosdk.modelsv2.AvmKeyValue;
          const state = this._runtime.getAppState(v.scope.appID);
          const keyHex = v.key.slice(2);
          if (v.scope.scope === 'global') {
            const value = state.globalState.getHex(keyHex);
            if (value) {
              toExpand = new algosdk.modelsv2.AvmKeyValue({
                key: algosdk.hexToBytes(keyHex),
                value,
              });
            } else {
              throw new Error(`key "${v.key}" not found in global state`);
            }
          } else if (v.scope.scope === 'local') {
            if (typeof v.scope.account === 'undefined') {
              throw new Error("this shouldn't happen: " + JSON.stringify(v));
            } else {
              const accountState = state.localState.get(v.scope.account);
              if (!accountState) {
                throw new Error(
                  `account "${v.scope.account}" not found in local state`,
                );
              }
              const value = accountState.getHex(keyHex);
              if (!value) {
                throw new Error(
                  `key "${v.key}" not found in local state for account "${v.scope.account}"`,
                );
              }
              toExpand = new algosdk.modelsv2.AvmKeyValue({
                key: algosdk.hexToBytes(keyHex),
                value,
              });
            }
          } else if (v.scope.scope === 'box') {
            const value = state.boxState.getHex(keyHex);
            if (value) {
              toExpand = new algosdk.modelsv2.AvmKeyValue({
                key: algosdk.hexToBytes(keyHex),
                value,
              });
            } else {
              throw new Error(`key "${v.key}" not found in box state`);
            }
          } else {
            throw new Error(
              `Unexpected AppSpecificStateScope scope: ${v.scope}`,
            );
          }
          variables = this.expandAvmKeyValue(v.scope, toExpand, args.filter);
        }
      }

      variables = limitArray(variables, args.start, args.count);

      response.body = {
        variables,
      };
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  private getProgramState(frameIndex: number) {
    const frame = this._runtime.getStackFrame(frameIndex);
    const state = frame?.programState;
    if (state === undefined) {
      throw new Error(`Unexpected frame: ${typeof frame}`);
    }
    return state;
  }

  protected async evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments,
  ): Promise<void> {
    try {
      // Note, can use args.context to perform different actions based on where the expression is evaluated

      // check if expression matches a Puya local variable
      const frame =
        args.frameId !== undefined
          ? this._runtime.getStackFrame(args.frameId)
          : undefined;
      const frameVariables = frame?.programState?.variables;
      if (frameVariables) {
        const variable = frameVariables.find(
          ([name]) => name == args.expression,
        );
        if (variable) {
          const avmValue = variable[1];
          const debugVariable = this.convertAvmValue(
            new PuyaScope(args.frameId!),
            avmValue,
            args.expression,
          );
          response.body = {
            result: debugVariable.value,
            type: debugVariable.type,
            variablesReference: debugVariable.variablesReference,
            presentationHint: debugVariable.presentationHint,
          };
          this.sendResponse(response);
          return;
        }
      }

      let reply: string | undefined;
      let rv: DebugProtocol.Variable | undefined = undefined;
      let result: [AvmValueScope, number | string] | undefined = undefined;
      try {
        result = evaluateNameToScope(args.expression);
      } catch (e) {
        reply = (e as Error).message;
      }

      if (result) {
        const [scope, key] = result;
        if (scope instanceof ProgramStateScope) {
          if (typeof args.frameId === 'undefined') {
            reply = 'frameId required for program state';
          } else {
            const scopeWithFrame = new ProgramStateScope(
              args.frameId,
              scope.specificState,
            );
            const frame = this._runtime.getStackFrame(args.frameId);
            const state = frame?.programState;
            if (state === undefined) {
              reply = `Unexpected frame: ${typeof frame}`;
            } else {
              if (scope.specificState === 'pc') {
                rv = {
                  name: 'pc',
                  value: state.pc.toString(),
                  type: 'uint64',
                  variablesReference: 0,
                  evaluateName: 'pc',
                };
              } else if (scope.specificState === 'op') {
                rv = {
                  name: 'op',
                  value: state.op || 'unknown',
                  type: 'string',
                  variablesReference: 0,
                  evaluateName: 'op',
                };
              } else if (scope.specificState === 'stack') {
                let index = key as number;
                const stackValues = state.stack;
                if (index < 0) {
                  const adjustedIndex = index + stackValues.length;
                  if (adjustedIndex < 0) {
                    reply = `stack[${index}] out of range`;
                  } else {
                    index = adjustedIndex;
                  }
                }
                if (0 <= index && index < stackValues.length) {
                  rv = this.convertAvmValue(
                    scopeWithFrame,
                    stackValues[index],
                    index,
                  );
                } else if (index < 0 && stackValues.length + index >= 0) {
                  rv = this.convertAvmValue(
                    scopeWithFrame,
                    stackValues[stackValues.length + index],
                    index,
                  );
                } else {
                  reply = `stack[${index}] out of range`;
                }
              } else if (scope.specificState === 'scratch') {
                const index = key as number;
                if (0 <= index && index < 256) {
                  rv = this.convertAvmValue(
                    scopeWithFrame,
                    state.scratch.get(index) ||
                      new algosdk.modelsv2.AvmValue({ type: 2 }),
                    index,
                  );
                } else {
                  reply = `scratch[${index}] out of range`;
                }
              }
            }
          }
        } else if (typeof key === 'string') {
          const state = this._runtime.getAppState(scope.appID);
          if (scope.property) {
            reply = `cannot evaluate property "${scope.property}"`;
          } else if (scope.scope === 'global' && key.startsWith('0x')) {
            const keyHex = key.slice(2);
            const value = state.globalState.getHex(keyHex);
            if (value) {
              const kv = new algosdk.modelsv2.AvmKeyValue({
                key: algosdk.hexToBytes(keyHex),
                value,
              });
              rv = this.convertAvmKeyValue(scope, kv);
            } else {
              reply = `key "${key}" not found in global state`;
            }
          } else if (scope.scope === 'local') {
            if (typeof scope.account === 'undefined') {
              rv = {
                name: key,
                value: 'local state',
                type: 'object',
                variablesReference: this._variableHandles.create(
                  new AppSpecificStateScope({
                    scope: 'local',
                    appID: scope.appID,
                    account: key,
                  }),
                ),
                namedVariables: 1, // TODO
                evaluateName: evaluateNameForScope(scope, key),
              };
            } else {
              const accountState = state.localState.get(scope.account);
              if (!accountState) {
                reply = `account "${scope.account}" not found in local state`;
              } else if (key.startsWith('0x')) {
                const keyHex = key.slice(2);
                const value = accountState.getHex(keyHex);
                if (value) {
                  const kv = new algosdk.modelsv2.AvmKeyValue({
                    key: algosdk.hexToBytes(keyHex),
                    value,
                  });
                  rv = this.convertAvmKeyValue(scope, kv);
                } else {
                  reply = `key "${key}" not found in local state for account "${scope.account}"`;
                }
              } else {
                reply = `cannot evaluate property "${key}"`;
              }
            }
          } else if (scope.scope === 'box' && key.startsWith('0x')) {
            const keyHex = key.slice(2);
            const value = state.boxState.getHex(keyHex);
            if (value) {
              const kv = new algosdk.modelsv2.AvmKeyValue({
                key: algosdk.hexToBytes(keyHex),
                value,
              });
              rv = this.convertAvmKeyValue(scope, kv);
            } else {
              reply = `key "${key}" not found in box state`;
            }
          }
        }
      }

      if (rv) {
        response.body = {
          result: rv.value,
          type: rv.type,
          variablesReference: rv.variablesReference,
          presentationHint: rv.presentationHint,
        };
      } else {
        response.body = {
          result: reply || `unknown expression: "${args.expression}"`,
          variablesReference: 0,
        };
      }

      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected sourceRequest(
    response: DebugProtocol.SourceResponse,
    args: DebugProtocol.SourceArguments,
    request?: DebugProtocol.Request,
  ): void {
    try {
      const sourceInfo = this._sourceHandles.get(args.sourceReference);
      if (typeof sourceInfo !== 'undefined') {
        response.body = {
          content: sourceInfo.content,
          mimeType: sourceInfo.mimeType,
        };
      } else {
        response.body = {
          content: `source not available`,
        };
      }
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected continueRequest(
    response: DebugProtocol.ContinueResponse,
    args: DebugProtocol.ContinueArguments,
  ): void {
    try {
      this.executionResumed();
      this._runtime.continue(false);
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected reverseContinueRequest(
    response: DebugProtocol.ReverseContinueResponse,
    args: DebugProtocol.ReverseContinueArguments,
  ): void {
    try {
      this.executionResumed();
      this._runtime.continue(true);
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments,
  ): void {
    try {
      this.executionResumed();
      this._runtime.step(false);
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected stepBackRequest(
    response: DebugProtocol.StepBackResponse,
    args: DebugProtocol.StepBackArguments,
  ): void {
    try {
      this.executionResumed();
      this._runtime.step(true);
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected stepInRequest(
    response: DebugProtocol.StepInResponse,
    args: DebugProtocol.StepInArguments,
  ): void {
    try {
      this.executionResumed();
      this._runtime.stepIn(args.targetId);
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  protected stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    args: DebugProtocol.StepOutArguments,
  ): void {
    try {
      this.executionResumed();
      this._runtime.stepOut();
      this.sendResponse(response);
    } catch (e) {
      this.sendErrorResponse(response, GENERIC_ERROR_ID, (e as Error).message);
    }
  }

  private executionResumed(): void {
    this._variableHandles.reset();
    this._sourceHandles.reset();
  }

  //---- helpers

  private convertAvmValue(
    scope: AvmValueScope | PuyaScope,
    avmValue: algosdk.modelsv2.AvmValue,
    key: number | string,
    overrideVariableReference?: boolean,
  ): DebugProtocol.Variable {
    let namedVariables: number | undefined = undefined;
    let indexedVariables: number | undefined = undefined;
    let presentationHint: DebugProtocol.VariablePresentationHint | undefined =
      undefined;
    let variablesReference = 0;

    if (avmValue.type === 1) {
      // byte array
      const bytes = avmValue.bytes || new Uint8Array();
      namedVariables = 2;
      if (typeof utf8Decode(bytes) !== 'undefined') {
        namedVariables++;
      }
      indexedVariables = bytes.length;
      presentationHint = {
        kind: 'data',
        attributes: ['rawString'],
      };
      variablesReference = this._variableHandles.create(
        new AvmValueReference(scope, key),
      );
    }
    // For uint64 (type 2), variablesReference remains 0

    if (
      avmValue.type !== 2 &&
      typeof overrideVariableReference !== 'undefined' &&
      overrideVariableReference
    ) {
      variablesReference = this._variableHandles.create(
        new AvmValueReference(scope, key),
      );
    }

    return {
      name: key.toString(),
      value: this.avmValueToString(avmValue),
      type: avmValue.type === 1 ? 'byte[]' : 'uint64',
      variablesReference,
      namedVariables,
      indexedVariables,
      presentationHint,
      evaluateName:
        scope instanceof PuyaScope
          ? key.toString()
          : evaluateNameForScope(scope, key),
    };
  }

  private expandAvmValue(
    avmValue: algosdk.modelsv2.AvmValue,
    filter?: DebugProtocol.VariablesArguments['filter'],
  ): DebugProtocol.Variable[] {
    // uint64 has no expanded variables
    if (avmValue.type !== 1) {
      return [];
    }

    const bytes = avmValue.bytes || new Uint8Array();
    const values: DebugProtocol.Variable[] = [];

    if (filter !== 'indexed') {
      values.push({
        name: 'hex',
        type: 'string',
        value: algosdk.bytesToHex(bytes),
        variablesReference: 0,
      });

      values.push({
        name: 'base64',
        type: 'string',
        value: algosdk.bytesToBase64(bytes),
        variablesReference: 0,
      });

      const utf8Value = utf8Decode(bytes);
      if (typeof utf8Value !== 'undefined') {
        values.push({
          name: 'utf-8',
          type: 'string',
          value: utf8Value,
          variablesReference: 0,
        });
      }

      if (bytes.length === 32) {
        values.push({
          name: 'address',
          type: 'string',
          value: algosdk.encodeAddress(bytes),
          variablesReference: 0,
        });
      }

      values.push({
        name: 'length',
        type: 'int',
        value: bytes.length.toString(),
        variablesReference: 0,
      });
    }

    if (filter !== 'named') {
      for (let i = 0; i < bytes.length; i++) {
        values.push({
          name: i.toString(),
          type: 'uint8',
          value: bytes[i].toString(),
          variablesReference: 0,
        });
      }
    }

    return values;
  }

  private convertAvmKeyValue(
    scope: AvmValueScope,
    avmKeyValue: algosdk.modelsv2.AvmKeyValue,
  ): DebugProtocol.Variable {
    const keyString =
      '0x' + algosdk.bytesToHex(avmKeyValue.key || new Uint8Array());
    const value = this.convertAvmValue(
      scope,
      avmKeyValue.value,
      keyString,
      true,
    );
    delete value.indexedVariables;
    value.namedVariables = 2;
    return value;
  }

  private expandAvmKeyValue(
    scope: AppSpecificStateScope,
    avmKeyValue: algosdk.modelsv2.AvmKeyValue,
    filter?: DebugProtocol.VariablesArguments['filter'],
  ): DebugProtocol.Variable[] {
    if (typeof scope.property === 'undefined') {
      if (filter === 'indexed') {
        return [];
      }
      const keyString =
        '0x' + algosdk.bytesToHex(avmKeyValue.key || new Uint8Array());
      const keyScope = new AppSpecificStateScope({
        scope: scope.scope,
        appID: scope.appID,
        account: scope.account,
        property: 'key',
      });
      const valueScope = new AppSpecificStateScope({
        scope: scope.scope,
        appID: scope.appID,
        account: scope.account,
        property: 'value',
      });
      const keyVariable = this.convertAvmValue(
        keyScope,
        new algosdk.modelsv2.AvmValue({ type: 1, bytes: avmKeyValue.key }),
        '',
        false,
      );
      const valueVariable = this.convertAvmValue(
        valueScope,
        avmKeyValue.value,
        '',
        false,
      );
      const valueHasChildren =
        valueVariable.namedVariables || valueVariable.indexedVariables;
      return [
        {
          name: 'key',
          type: keyVariable.type,
          value: keyVariable.value,
          variablesReference: this._variableHandles.create(
            new AvmValueReference(keyScope, keyString),
          ),
          namedVariables: keyVariable.namedVariables,
          indexedVariables: keyVariable.indexedVariables,
          presentationHint: keyVariable.presentationHint,
          // evaluateName: evaluateNameForScope(keyScope, keyString),
        },
        {
          name: 'value',
          type: keyVariable.type,
          value: valueVariable.value,
          variablesReference: valueHasChildren
            ? this._variableHandles.create(
                new AvmValueReference(valueScope, keyString),
              )
            : 0,
          namedVariables: keyVariable.namedVariables,
          indexedVariables: keyVariable.indexedVariables,
          presentationHint: keyVariable.presentationHint,
          // evaluateName: valueHasChildren ? evaluateNameForScope(valueScope, keyString) : '',
        },
      ];
    }

    if (scope.property === 'key') {
      const avmKey = new algosdk.modelsv2.AvmValue({
        type: 1,
        bytes: avmKeyValue.key,
      });
      return this.expandAvmValue(avmKey, filter);
    }

    return this.expandAvmValue(avmKeyValue.value, filter);
  }

  private avmValueToString(avmValue: algosdk.modelsv2.AvmValue): string {
    if (avmValue.type === 1) {
      // byte array
      const bytes = avmValue.bytes || new Uint8Array();
      return '0x' + algosdk.bytesToHex(bytes);
    }
    // uint64
    const uint = avmValue.uint || 0;
    return uint.toString();
  }

  private createSource(filePath: string): Source {
    return new Source(
      this.fileAccessor.basename(filePath),
      this.convertDebuggerPathToClient(filePath),
    );
  }

  private createSourceWithContent(
    fileName: string,
    content: string,
    mimeType?: string,
  ) {
    const id = this._sourceHandles.create({ content, mimeType });
    return new Source(fileName, undefined, id);
  }
}
class PuyaScope {
  constructor(public readonly frameIndex: number) {}
}
class ProgramStateScope {
  constructor(
    public readonly frameIndex: number,
    public readonly specificState:
      | 'pc'
      | 'op'
      | 'stack'
      | 'scratch'
      | 'program' = 'program',
  ) {}
}

type OnChainStateScope = 'chain' | 'app';

class AppStateScope {
  constructor(public readonly appID: bigint) {}
}

class AppSpecificStateScope {
  public readonly scope: 'global' | 'local' | 'box';
  public readonly appID: bigint;
  public readonly account?: string;
  public readonly property?: 'key' | 'value';

  constructor({
    scope,
    appID,
    account,
    property,
  }: {
    scope: 'global' | 'local' | 'box';
    appID: bigint;
    account?: string;
    property?: 'key' | 'value';
  }) {
    this.scope = scope;
    this.appID = appID;
    this.account = account;
    this.property = property;
  }
}

type AvmValueScope = ProgramStateScope | AppSpecificStateScope;

class AvmValueReference {
  constructor(
    public readonly scope: AvmValueScope | PuyaScope,
    public readonly key: number | string,
  ) {}
}

function evaluateNameForScope(
  scope: AvmValueScope,
  key: number | string,
): string {
  if (scope instanceof ProgramStateScope) {
    return `${scope.specificState}[${key}]`;
  }
  if (scope.scope === 'local') {
    if (typeof scope.account === 'undefined') {
      return `app[${scope.appID}].local[${key}]`;
    }
    return `app[${scope.appID}].local[${scope.account}][${key}]`;
  }
  return `app[${scope.appID}].${scope.scope}[${key}]${
    scope.property ? '.' + scope.property : ''
  }`;
}

function evaluateNameToScope(name: string): [AvmValueScope, number | string] {
  if (name === 'pc') {
    return [new ProgramStateScope(-1, 'pc'), 0];
  }
  if (name === 'op') {
    return [new ProgramStateScope(-1, 'op'), ''];
  }
  const stackMatches = /^stack\[(-?\d+)\]$/.exec(name);
  if (stackMatches) {
    return [new ProgramStateScope(-1, 'stack'), parseInt(stackMatches[1], 10)];
  }
  const scratchMatches = /^scratch\[(\d+)\]$/.exec(name);
  if (scratchMatches) {
    return [
      new ProgramStateScope(-1, 'scratch'),
      parseInt(scratchMatches[1], 10),
    ];
  }
  const appMatches =
    /^app\[(\d+)\]\.(global|box)\[(0[xX][0-9a-fA-F]+)\](?:\.(key|value))?$/.exec(
      name,
    );
  if (appMatches) {
    const scope = appMatches[2];
    if (scope !== 'global' && scope !== 'box') {
      throw new Error(`Unexpected app scope: ${scope}`);
    }
    const property = appMatches.length > 4 ? appMatches[4] : undefined;
    if (
      typeof property !== 'undefined' &&
      property !== 'key' &&
      property !== 'value'
    ) {
      throw new Error(`Unexpected app property: ${property}`);
    }
    const newScope = new AppSpecificStateScope({
      scope: scope,
      appID: BigInt(appMatches[1]),
      property,
    });
    return [newScope, appMatches[3]];
  }
  const appLocalMatches =
    /^app\[(\d+)\]\.local\[([A-Z2-7]{58})\](?:\[(0[xX][0-9a-fA-F]+)\](?:\.(key|value))?)?$/.exec(
      name,
    );
  if (appLocalMatches) {
    const property =
      appLocalMatches.length > 4 ? appLocalMatches[4] : undefined;
    if (
      typeof property !== 'undefined' &&
      property !== 'key' &&
      property !== 'value'
    ) {
      throw new Error(`Unexpected app property: ${property}`);
    }
    try {
      algosdk.decodeAddress(appLocalMatches[2]); // ensure valid address
    } catch {
      throw new Error(`Invalid address: ${appLocalMatches[2]}:`);
    }
    let account: string | undefined;
    let key: string;
    if (
      appLocalMatches.length > 3 &&
      typeof appLocalMatches[3] !== 'undefined'
    ) {
      account = appLocalMatches[2];
      key = appLocalMatches[3];
    } else {
      account = undefined;
      key = appLocalMatches[2];
    }
    const newScope = new AppSpecificStateScope({
      scope: 'local',
      appID: BigInt(appLocalMatches[1]),
      account,
      property,
    });
    return [newScope, key];
  }
  throw new Error(`Unexpected expression: ${name}`);
}
