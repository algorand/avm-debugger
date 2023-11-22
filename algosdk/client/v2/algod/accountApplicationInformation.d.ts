import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { AccountApplicationResponse } from './models/types';
export default class AccountApplicationInformation extends JSONRequest<AccountApplicationResponse, Record<string, any>> {
    private account;
    private applicationID;
    constructor(c: HTTPClient, intDecoding: IntDecoding, account: string, applicationID: number);
    path(): string;
    prepare(body: Record<string, any>): AccountApplicationResponse;
}
