'use strict';

import * as console from 'console';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as algosdk from 'algosdk';
import * as _ from 'lodash';
import JSONbigWithoutConfig from 'json-bigint';

// TODO: replace with algosdk.parseJson once it is available in v3
const JSON_BIG = JSONbigWithoutConfig({ useNativeBigInt: true, strict: true });

function vscodeVariables(string, recursive = false) {
    console.assert(vscode.workspace.workspaceFolders);

    let workspaces: vscode.WorkspaceFolder[] = <vscode.WorkspaceFolder[]>vscode.workspace.workspaceFolders;

    let workspace = workspaces.length ? workspaces[0] : null;
    let activeFile = vscode.window.activeTextEditor?.document;
    let absoluteFilePath: string = <string>(activeFile?.uri.fsPath);
    string = string.replace(/\${workspaceFolder}/g, workspace?.uri.fsPath);
    string = string.replace(/\${workspaceFolderBasename}/g, workspace?.name);
    string = string.replace(/\${file}/g, absoluteFilePath);
    let activeWorkspace = workspace;
    let relativeFilePath = absoluteFilePath;
    for (let workspace of workspaces) {
        if (absoluteFilePath.replace(workspace.uri.fsPath, '') !== absoluteFilePath) {
            activeWorkspace = workspace;
            relativeFilePath = absoluteFilePath.replace(workspace.uri.fsPath, '').substring(path.sep.length);
            break;
        }
    }
    let parsedPath = path.parse(absoluteFilePath);
    string = string.replace(/\${fileWorkspaceFolder}/g, activeWorkspace?.uri.fsPath);
    string = string.replace(/\${relativeFile}/g, relativeFilePath);
    string = string.replace(/\${relativeFileDirname}/g, relativeFilePath.substring(0, relativeFilePath.lastIndexOf(path.sep)));
    string = string.replace(/\${fileBasename}/g, parsedPath.base);
    string = string.replace(/\${fileBasenameNoExtension}/g, parsedPath.name);
    string = string.replace(/\${fileExtname}/g, parsedPath.ext);
    string = string.replace(/\${fileDirname}/g, parsedPath.dir.substring(parsedPath.dir.lastIndexOf(path.sep) + 1));
    string = string.replace(/\${cwd}/g, parsedPath.dir);
    string = string.replace(/\${pathSeparator}/g, path.sep);
    // string = string.replace(/\${lineNumber}/g, vscode.window.activeTextEditor.selection.start.line + 1);
    // string = string.replace(/\${selectedText}/g, vscode.window.activeTextEditor.document.getText(new vscode.Range(vscode.window.activeTextEditor.selection.start, vscode.window.activeTextEditor.selection.end)));
    string = string.replace(/\${env:(.*?)}/g, function (variable) {
        return process.env[variable.match(/\${env:(.*?)}/)[1]] || '';
    });
    string = string.replace(/\${config:(.*?)}/g, function (variable) {
        return vscode.workspace.getConfiguration().get(variable.match(/\${config:(.*?)}/)[1], '');
    });

    if (recursive && string.match(/\${(workspaceFolder|workspaceFolderBasename|fileWorkspaceFolder|relativeFile|fileBasename|fileBasenameNoExtension|fileExtname|fileDirname|cwd|pathSeparator|lineNumber|selectedText|env:(.*?)|config:(.*?))}/)) {
        string = vscodeVariables(string, recursive);
    }
    return string;
}

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
    pathStr = vscodeVariables(pathStr);

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

export class TxnGroupSourceDescriptor {
    private _fileLocation: vscode.Uri;
    private _sourcemap: algosdk.SourceMap;
    private _hash: string;

    constructor({
        fileLocation,
        sourcemapLocation,
        hash,
    }: {
        fileLocation: string,
        sourcemapLocation: string,
        hash: string,
    }) {
        this._fileLocation = absPathAgainstWorkspace(fileLocation);
        const _sourcemapLocation = absPathAgainstWorkspace(sourcemapLocation);
        this._sourcemap = new algosdk.SourceMap(JSON.parse(fs.readFileSync(_sourcemapLocation.fsPath, 'utf-8')));
        this._hash = hash;
    }

    public get fileLocation(): vscode.Uri {
        return this._fileLocation;
    }

    public get sourcemap(): algosdk.SourceMap {
        return this._sourcemap;
    }

    public get hash(): string | undefined {
        return this._hash;
    }

    static fromJSONObj(data: Record<string, any>): TxnGroupSourceDescriptor {
        return new TxnGroupSourceDescriptor({
            fileLocation: data['file-location'],
            sourcemapLocation: data['sourcemap-location'],
            hash: data['hash'],
        });
    }
}

export class TxnGroupSourceDescriptorList {
    private _txnGroupSources: Array<TxnGroupSourceDescriptor>;

    constructor({ txnGroupSources }: {
        txnGroupSources: Array<TxnGroupSourceDescriptor>;
    }) {
        this._txnGroupSources = txnGroupSources;
    }

    public get txnGroupSources(): Array<TxnGroupSourceDescriptor> {
        return this._txnGroupSources;
    }

    public findByHash(hash: string): TxnGroupSourceDescriptor | undefined {
        for (let i = 0; i < this._txnGroupSources.length; i++) {
            if (this._txnGroupSources[i].hash && this._txnGroupSources[i].hash === hash) {
                return this._txnGroupSources[i];
            }
        }
        return undefined;
    }

    static fromJSONObj(data: Record<string, any>): TxnGroupSourceDescriptorList {
        return new TxnGroupSourceDescriptorList({
            txnGroupSources: data['txn-group-sources'].map(TxnGroupSourceDescriptor.fromJSONObj),
        });
    }
}

export class TEALDebuggingAssets {
    private _debugAssetDescriptor: TEALDebuggingAssetsDescriptor;
    private _simulateResponse: algosdk.modelsv2.SimulateResponse;
    private _txnGroupDescriptorList: TxnGroupSourceDescriptorList;

    constructor(config: vscode.DebugConfiguration) {
        this._debugAssetDescriptor = new TEALDebuggingAssetsDescriptor(config);

        const jsonStringSimulate = fs.readFileSync(
            this._debugAssetDescriptor.simulateResponseFullPath.fsPath,
            'utf-8'
        );
        this._simulateResponse
            = algosdk.modelsv2.SimulateResponse.from_obj_for_encoding(
                parseJsonWithBigints(jsonStringSimulate)
            );

        const jsonStringTxnG = fs.readFileSync(
            this._debugAssetDescriptor.txnGroupSourceDescriptionFullPath.fsPath,
            'utf-8'
        );
        this._txnGroupDescriptorList
            = TxnGroupSourceDescriptorList.fromJSONObj(
                JSON.parse(jsonStringTxnG) as Record<string, any>
            );

        vscode.window.showInformationMessage(
            JSON.stringify(this._txnGroupDescriptorList)
        );
    }

    public get debugAssetDescriptor(): TEALDebuggingAssetsDescriptor {
        return this._debugAssetDescriptor;
    }

    public get simulateResponse(): algosdk.modelsv2.SimulateResponse {
        return this._simulateResponse;
    }

    public get txnGroupDescriptorList(): TxnGroupSourceDescriptorList {
        return this._txnGroupDescriptorList;
    }
}

export function isAsciiPrintable(data: Uint8Array): boolean {
    for (let i = 0; i < data.length; i++) {
        if (data[i] < 32 || data[i] > 126) {
            return false;
        }
    }
    return true;
}

export function limitArray<T>(array: Array<T>, start?: number, count?: number): Array<T> {
    if (start === undefined) {
        start = 0;
    }
    if (count === undefined) {
        count = array.length;
    }
    if (start < 0) {
        start = 0;
    }
    if (count < 0) {
        count = 0;
    }
    if (start >= array.length) {
        return [];
    }
    if (start + count > array.length) {
        count = array.length - start;
    }
    return array.slice(start, start + count);
}

export function parseJsonWithBigints(json: string): any {
    return JSON_BIG.parse(json);
}

export class ByteArrayMap<T> {
    
    private map: Map<string, T>;

    constructor() {
        this.map = new Map<string, T>();
    }

    public set(key: Uint8Array, value: T): void {
        this.map.set(Buffer.from(key).toString('hex'), value);
    }

    public setHex(key: string, value: T): void {
        this.map.set(key, value);
    }

    public get(key: Uint8Array): T | undefined {
        return this.map.get(Buffer.from(key).toString('hex'));
    }

    public getHex(key: string): T | undefined {
        return this.map.get(key);
    }

    public hasHex(key: string): boolean {
        return this.map.has(key);
    }

    public has(key: Uint8Array): boolean {
        return this.map.has(Buffer.from(key).toString('hex'));
    }

    public delete(key: Uint8Array): boolean {
        return this.map.delete(Buffer.from(key).toString('hex'));
    }

    public deleteHex(key: string): boolean {
        return this.map.delete(key);
    }

    public clear(): void {
        this.map.clear();
    }

    public* entries(): IterableIterator<[Uint8Array, T]> {
        for (const [key, value] of this.map.entries()) {
            yield [Buffer.from(key, 'hex'), value];
        }
    }

    public entriesHex(): IterableIterator<[string, T]> {
        return this.map.entries();
    }
}
