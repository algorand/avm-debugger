"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class GetBlockOffsetTimestamp extends jsonrequest_1.default {
    // eslint-disable-next-line class-methods-use-this
    path() {
        return `/v2/devmode/blocks/offset`;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.GetBlockTimeStampOffsetResponse.from_obj_for_encoding(body);
    }
}
exports.default = GetBlockOffsetTimestamp;
//# sourceMappingURL=getBlockOffsetTimestamp.js.map