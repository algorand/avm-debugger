"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramSourceMap = void 0;
const vlq = __importStar(require("vlq"));
/**
 * Contains a mapping from TEAL program PC to source file location.
 */
class ProgramSourceMap {
    constructor({ version, sources, names, mappings, }) {
        this.version = version;
        this.sources = sources;
        this.names = names;
        this.mappings = mappings;
        if (this.version !== 3)
            throw new Error(`Only version 3 is supported, got ${this.version}`);
        if (this.mappings === undefined)
            throw new Error('mapping undefined, cannot build source map without `mapping`');
        const pcList = this.mappings.split(';').map(vlq.decode);
        this.pcToLocation = new Map();
        this.sourceAndLineToPc = new Map();
        const lastLocation = {
            line: 0,
            column: 0,
            sourceIndex: 0,
            nameIndex: 0,
        };
        for (const [pc, data] of pcList.entries()) {
            if (data.length < 4)
                continue;
            const nameDelta = data.length > 4 ? data[4] : undefined;
            const [, sourceDelta, lineDelta, columnDelta] = data;
            lastLocation.sourceIndex += sourceDelta;
            lastLocation.line += lineDelta;
            lastLocation.column += columnDelta;
            if (typeof nameDelta !== 'undefined') {
                lastLocation.nameIndex += nameDelta;
            }
            const sourceAndLineKey = `${lastLocation.sourceIndex}:${lastLocation.line}`;
            let pcsForSourceAndLine = this.sourceAndLineToPc.get(sourceAndLineKey);
            if (pcsForSourceAndLine === undefined) {
                pcsForSourceAndLine = [];
                this.sourceAndLineToPc.set(sourceAndLineKey, pcsForSourceAndLine);
            }
            const pcInLine = {
                pc,
                column: lastLocation.column,
            };
            const pcLocation = {
                line: lastLocation.line,
                column: lastLocation.column,
                sourceIndex: lastLocation.sourceIndex,
            };
            if (typeof nameDelta !== 'undefined') {
                pcInLine.nameIndex = lastLocation.nameIndex;
                pcLocation.nameIndex = lastLocation.nameIndex;
            }
            pcsForSourceAndLine.push(pcInLine);
            this.pcToLocation.set(pc, pcLocation);
        }
    }
    getPcs() {
        return Array.from(this.pcToLocation.keys());
    }
    getLocationForPc(pc) {
        return this.pcToLocation.get(pc);
    }
    getPcsOnSourceLine(sourceIndex, line) {
        const pcs = this.sourceAndLineToPc.get(`${sourceIndex}:${line}`);
        if (pcs === undefined)
            return [];
        return pcs;
    }
}
exports.ProgramSourceMap = ProgramSourceMap;
//# sourceMappingURL=sourcemap.js.map