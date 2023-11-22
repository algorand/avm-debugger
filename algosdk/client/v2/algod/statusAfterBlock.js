"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class StatusAfterBlock extends jsonrequest_1.default {
    constructor(c, intDecoding, round) {
        super(c, intDecoding);
        this.round = round;
        if (!Number.isInteger(round))
            throw Error('round should be an integer');
        this.round = round;
    }
    path() {
        return `/v2/status/wait-for-block-after/${this.round}`;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.NodeStatusResponse.from_obj_for_encoding(body);
    }
}
exports.default = StatusAfterBlock;
//# sourceMappingURL=statusAfterBlock.js.map