"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class GetTransactionGroupLedgerStateDeltasForRound extends jsonrequest_1.default {
    constructor(c, intDecoding, round) {
        super(c, intDecoding);
        this.round = round;
        this.round = round;
        this.query = { format: 'json' };
    }
    // eslint-disable-next-line class-methods-use-this
    path() {
        return `/v2/deltas/${this.round}/txn/group`;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.TransactionGroupLedgerStateDeltasForRoundResponse.from_obj_for_encoding(body);
    }
}
exports.default = GetTransactionGroupLedgerStateDeltasForRound;
//# sourceMappingURL=getTransactionGroupLedgerStateDeltasForRound.js.map