"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
class UnsetSyncRound extends jsonrequest_1.default {
    // eslint-disable-next-line class-methods-use-this
    path() {
        return `/v2/ledger/sync`;
    }
    async do(headers = {}) {
        const res = await this.c.delete(this.path(), headers);
        return res.body;
    }
}
exports.default = UnsetSyncRound;
//# sourceMappingURL=unsetSyncRound.js.map