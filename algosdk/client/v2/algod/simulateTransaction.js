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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSimulateTransactionsHeaders = void 0;
const encoding = __importStar(require("../../../encoding/encoding"));
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
/**
 * Sets the default header (if not previously set) for simulating a raw
 * transaction.
 * @param headers - A headers object
 */
function setSimulateTransactionsHeaders(headers = {}) {
    let hdrs = headers;
    if (Object.keys(hdrs).every((key) => key.toLowerCase() !== 'content-type')) {
        hdrs = { ...headers };
        hdrs['Content-Type'] = 'application/msgpack';
    }
    return hdrs;
}
exports.setSimulateTransactionsHeaders = setSimulateTransactionsHeaders;
/**
 * Simulates signed txns.
 */
class SimulateRawTransactions extends jsonrequest_1.default {
    constructor(c, request) {
        super(c);
        this.query.format = 'msgpack';
        this.requestBytes = encoding.rawEncode(request.get_obj_for_encoding(true));
    }
    // eslint-disable-next-line class-methods-use-this
    path() {
        return '/v2/transactions/simulate';
    }
    async do(headers = {}) {
        const txHeaders = setSimulateTransactionsHeaders(headers);
        const res = await this.c.post(this.path(), this.requestBytes, this.query, txHeaders, false);
        return this.prepare(res.body);
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        const decoded = encoding.decode(body);
        return types_1.SimulateResponse.from_obj_for_encoding(decoded);
    }
}
exports.default = SimulateRawTransactions;
