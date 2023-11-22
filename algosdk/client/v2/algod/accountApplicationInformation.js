"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrequest_1 = __importDefault(require("../jsonrequest"));
const types_1 = require("./models/types");
class AccountApplicationInformation extends jsonrequest_1.default {
    constructor(c, intDecoding, account, applicationID) {
        super(c, intDecoding);
        this.account = account;
        this.applicationID = applicationID;
        this.account = account;
        this.applicationID = applicationID;
    }
    path() {
        return `/v2/accounts/${this.account}/applications/${this.applicationID}`;
    }
    // eslint-disable-next-line class-methods-use-this
    prepare(body) {
        return types_1.AccountApplicationResponse.from_obj_for_encoding(body);
    }
}
exports.default = AccountApplicationInformation;
//# sourceMappingURL=accountApplicationInformation.js.map