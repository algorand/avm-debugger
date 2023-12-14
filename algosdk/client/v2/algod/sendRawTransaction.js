"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSendTransactionHeaders = void 0;
const utils_1 = require("../../../utils/utils");
const types_1 = require("./models/types");
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
/**
 * Sets the default header (if not previously set) for sending a raw
 * transaction.
 * @param headers - A headers object
 */
function setSendTransactionHeaders(headers = {}) {
    let hdrs = headers;
    if (Object.keys(hdrs).every((key) => key.toLowerCase() !== 'content-type')) {
        hdrs = { ...headers };
        hdrs['Content-Type'] = 'application/x-binary';
    }
    return hdrs;
}
exports.setSendTransactionHeaders = setSendTransactionHeaders;
function isByteArray(array) {
    return array && array.byteLength !== undefined;
}
/**
 * broadcasts the passed signed txns to the network
 */
class SendRawTransaction extends jsonrequest_1.default {
    constructor(c, stxOrStxs) {
        super(c);
        let forPosting = stxOrStxs;
        if (Array.isArray(stxOrStxs)) {
            if (!stxOrStxs.every(isByteArray)) {
                throw new TypeError('Array elements must be byte arrays');
            }
            // Flatten into a single Uint8Array
            forPosting = (0, utils_1.concatArrays)(...stxOrStxs);
        }
        else if (!isByteArray(forPosting)) {
            throw new TypeError('Argument must be byte array');
        }
        this.txnBytesToPost = forPosting;
    }
    // eslint-disable-next-line class-methods-use-this
    path() {
        return '/v2/transactions';
    }
    async do(headers = {}) {
        const txHeaders = setSendTransactionHeaders(headers);
        const res = await this.c.post(this.path(), this.txnBytesToPost, null, txHeaders);
        return this.prepare(res.body);
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.PostTransactionsResponse.from_obj_for_encoding(body);
    }
}
exports.default = SendRawTransaction;
