"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setHeaders = void 0;
const binarydata_1 = require("../../../encoding/binarydata");
const types_1 = require("./models/types");
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
/**
 * Sets the default header (if not previously set)
 * @param headers - A headers object
 */
function setHeaders(headers = {}) {
    let hdrs = headers;
    if (Object.keys(hdrs).every((key) => key.toLowerCase() !== 'content-type')) {
        hdrs = { ...headers };
        hdrs['Content-Type'] = 'text/plain';
    }
    return hdrs;
}
exports.setHeaders = setHeaders;
/**
 * Executes disassemble
 */
class Disassemble extends jsonrequest_1.default {
    constructor(c, source) {
        super(c);
        this.source = source;
        this.source = source;
    }
    // eslint-disable-next-line class-methods-use-this
    path() {
        return `/v2/teal/disassemble`;
    }
    /**
     * Executes disassemble
     * @param headers - A headers object
     */
    async do(headers = {}) {
        const txHeaders = setHeaders(headers);
        const res = await this.c.post(this.path(), (0, binarydata_1.coerceToBytes)(this.source), this.query, txHeaders);
        return res.body;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.DisassembleResponse.from_obj_for_encoding(body);
    }
}
exports.default = Disassemble;
