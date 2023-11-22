import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import { PendingTransactionResponse } from './models/types';
/**
 * returns the transaction information for a specific txid of a pending transaction
 */
export default class PendingTransactionInformation extends JSONRequest<PendingTransactionResponse, Uint8Array> {
    private txid;
    constructor(c: HTTPClient, txid: string);
    prepare(body: Uint8Array): PendingTransactionResponse;
    path(): string;
    max(max: number): this;
}
