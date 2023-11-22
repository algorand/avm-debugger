import { PostTransactionsResponse } from './models/types';
import HTTPClient from '../../client';
import JSONRequest from '../jsonrequest';
/**
 * Sets the default header (if not previously set) for sending a raw
 * transaction.
 * @param headers - A headers object
 */
export declare function setSendTransactionHeaders(headers?: {}): {};
/**
 * broadcasts the passed signed txns to the network
 */
export default class SendRawTransaction extends JSONRequest<PostTransactionsResponse, Record<string, any>> {
    private txnBytesToPost;
    constructor(c: HTTPClient, stxOrStxs: Uint8Array | Uint8Array[]);
    path(): string;
    do(headers?: {}): Promise<PostTransactionsResponse>;
    prepare(body: Record<string, any>): PostTransactionsResponse;
}
