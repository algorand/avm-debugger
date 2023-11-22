"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
class SetSyncRound extends jsonrequest_1.default {
    constructor(c, intDecoding, round) {
        super(c, intDecoding);
        this.round = round;
        this.round = round;
    }
    path() {
        return `/v2/ledger/sync/${this.round}`;
    }
    async do(headers = {}) {
        const res = await this.c.post(this.path(), null, null, headers);
        return res.body;
    }
}
exports.default = SetSyncRound;
//# sourceMappingURL=setSyncRound.js.map