'use strict';

import { assert } from 'console';
import * as vscode from 'vscode';
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

    assert(configs.length && configs.length > 0);

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