import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import { PendingTransactionsResponse } from './models/types';
/**
 * returns all transactions for a PK [addr] in the [first, last] rounds range.
 */
export default class PendingTransactionsByAddress extends JSONRequest<PendingTransactionsResponse, Uint8Array> {
    private address;
    constructor(c: HTTPClient, address: string);
    prepare(body: Uint8Array): PendingTransactionsResponse;
    path(): string;
    max(max: number): this;
}
