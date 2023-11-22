"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
class GetLedgerStateDelta extends jsonrequest_1.default {
    constructor(c, intDecoding, round) {
        super(c, intDecoding);
        this.round = round;
        this.round = round;
        this.query = { format: 'json' };
    }
    // eslint-disable-next-line class-methods-use-this
    path() {
        return `/v2/deltas/${this.round}`;
    }
}
exports.default = GetLedgerStateDelta;
//# sourceMappingURL=getLedgerStateDelta.js.map