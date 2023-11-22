"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
class GetLedgerStateDeltaForTransactionGroup extends jsonrequest_1.default {
    constructor(c, intDecoding, id) {
        super(c, intDecoding);
        this.id = id;
        this.id = id;
        this.query = { format: 'json' };
    }
    // eslint-disable-next-line class-methods-use-this
    path() {
        return `/v2/deltas/txn/group/${this.id}`;
    }
}
exports.default = GetLedgerStateDeltaForTransactionGroup;
//# sourceMappingURL=getLedgerStateDeltaForTransactionGroup.js.map