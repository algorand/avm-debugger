"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class GetBlockHash extends jsonrequest_1.default {
    constructor(c, intDecoding, roundNumber) {
        super(c, intDecoding);
        this.round = roundNumber;
    }
    path() {
        return `/v2/blocks/${this.round}/hash`;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.BlockHashResponse.from_obj_for_encoding(body);
    }
}
exports.default = GetBlockHash;
//# sourceMappingURL=getBlockHash.js.map