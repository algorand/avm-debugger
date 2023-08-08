'use strict';

import * as console from 'console';
import * as vscode from 'vscode';
import * as path from 'path';
import * as algosdk from 'algosdk';
import * as _ from 'lodash';

/**
 * loadTEALDAConfiguration reads from launch.json for configuration,
 * then checks for the first debug config unit containing 
 * {
 *    'type': typeString,
 *    'request': requestString
 * }.
 */
export function loadTEALDAConfiguration({
    typeString = "teal",
    requestString = "launch"
}: { typeString?: string, requestString?: string; } = {}):
    vscode.DebugConfiguration | undefined {

    const launchJson = vscode.workspace.getConfiguration('launch');

    const configs: vscode.DebugConfiguration[] | undefined
        = launchJson.get('configurations');
    if (!configs) {
        vscode.window.showErrorMessage(
            "TEAL Debug Plugin Error: load configurations from launch.json error"
        );
        return undefined;
    }

    console.assert(configs.length && configs.length > 0);

    for (let i = 0; i < configs.length; i++) {
        if (_.isMatch(configs[i], {
            "type": typeString,
            "request": requestString,
        })) {
            return configs[i];
        }
    }

    vscode.window.showErrorMessage(
        "TEAL Debug Plugin Error: launch.json configurations array did not contain relevant TEAL Debug configuration"
    );
    return undefined;
}

export function absPathAgainstWorkspace(pathStr: string): vscode.Uri {
    // TODO: wtf is this ${workspacefolder}?
    if (!path.isAbsolute(pathStr)) {
        console.assert(vscode.workspace.workspaceFolders);
        const workspaceFolders = <vscode.WorkspaceFolder[]>vscode.workspace.workspaceFolders;

        console.assert(workspaceFolders.length > 0);
        const workspaceFolderUri = workspaceFolders[0].uri;

        return vscode.Uri.joinPath(workspaceFolderUri, pathStr);
    }
    return vscode.Uri.file(pathStr);
}

export class TEALDebuggingAssetsDescriptor {
    private _simulateRespFilesysFullPath: vscode.Uri;
    private _txnGroupSourcesDescriptionFullPath: vscode.Uri;

    constructor(config: vscode.DebugConfiguration) {
        console.assert(config.simulationTraceFile);
        this._simulateRespFilesysFullPath =
            absPathAgainstWorkspace(config.simulationTraceFile);
        console.assert(config.appSourceDescriptionFile);
        this._txnGroupSourcesDescriptionFullPath =
            absPathAgainstWorkspace(config.appSourceDescriptionFile);

        vscode.window.showInformationMessage(this._simulateRespFilesysFullPath.fsPath);
        vscode.window.showInformationMessage(this._txnGroupSourcesDescriptionFullPath.fsPath);
    }

    public get simulateResponseFullPath(): vscode.Uri {
        return this._simulateRespFilesysFullPath;
    }

    public get txnGroupSourceDescriptionFullPath(): vscode.Uri {
        return this._txnGroupSourcesDescriptionFullPath;
    }
}

export class TEALDebuggingAssets {
    private _debugAssetDescriptor: TEALDebuggingAssetsDescriptor;
    //     private _simulateResponse: algosdk.modelsv2.SimulateResponse;

    constructor(config: vscode.DebugConfiguration) {
        this._debugAssetDescriptor = new TEALDebuggingAssetsDescriptor(config);
    }
}
