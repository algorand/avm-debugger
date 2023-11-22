import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import { PendingTransactionsResponse } from './models/types';
/**
 * pendingTransactionsInformation returns transactions that are pending in the pool
 */
export default class PendingTransactions extends JSONRequest<PendingTransactionsResponse, Uint8Array> {
    constructor(c: HTTPClient);
    path(): string;
    prepare(body: Uint8Array): PendingTransactionsResponse;
    max(max: number): this;
}
