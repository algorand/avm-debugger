"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class StateProof extends jsonrequest_1.default {
    constructor(c, intDecoding, round) {
        super(c, intDecoding);
        this.round = round;
        this.round = round;
    }
    path() {
        return `/v2/stateproofs/${this.round}`;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.StateProof.from_obj_for_encoding(body);
    }
}
exports.default = StateProof;
//# sourceMappingURL=stateproof.js.map