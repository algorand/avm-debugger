"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
class SetBlockOffsetTimestamp extends jsonrequest_1.default {
    constructor(c, intDecoding, offset) {
        super(c, intDecoding);
        this.offset = offset;
        this.offset = offset;
    }
    path() {
        return `/v2/devmode/blocks/offset/${this.offset}`;
    }
    async do(headers = {}) {
        const res = await this.c.post(this.path(), null, null, headers);
        return res.body;
    }
}
exports.default = SetBlockOffsetTimestamp;
