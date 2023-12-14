"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class Supply extends jsonrequest_1.default {
    // eslint-disable-next-line class-methods-use-this
    path() {
        return '/v2/ledger/supply';
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.SupplyResponse.from_obj_for_encoding(body);
    }
}
exports.default = Supply;
