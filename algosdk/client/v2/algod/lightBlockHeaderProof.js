"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class LightBlockHeaderProof extends jsonrequest_1.default {
    constructor(c, intDecoding, round) {
        super(c, intDecoding);
        this.round = round;
        this.round = round;
    }
    path() {
        return `/v2/blocks/${this.round}/lightheader/proof`;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.LightBlockHeaderProof.from_obj_for_encoding(body);
    }
}
exports.default = LightBlockHeaderProof;
