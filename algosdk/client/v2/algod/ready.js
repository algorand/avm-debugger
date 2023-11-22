"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
class Ready extends jsonrequest_1.default {
    // eslint-disable-next-line class-methods-use-this
    path() {
        return `/ready`;
    }
}
exports.default = Ready;
//# sourceMappingURL=ready.js.map