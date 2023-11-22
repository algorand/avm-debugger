import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { AccountAssetResponse } from './models/types';
export default class AccountAssetInformation extends JSONRequest<AccountAssetResponse, Record<string, any>> {
    private account;
    private assetID;
    constructor(c: HTTPClient, intDecoding: IntDecoding, account: string, assetID: number);
    path(): string;
    prepare(body: Record<string, any>): AccountAssetResponse;
}
