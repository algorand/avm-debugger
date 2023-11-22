import HTTPClient from '../../client';
import JSONRequest from '../jsonrequest';
import { SimulateRequest, SimulateResponse } from './models/types';
/**
 * Sets the default header (if not previously set) for simulating a raw
 * transaction.
 * @param headers - A headers object
 */
export declare function setSimulateTransactionsHeaders(headers?: {}): {};
/**
 * Simulates signed txns.
 */
export default class SimulateRawTransactions extends JSONRequest<SimulateResponse, Uint8Array> {
    private requestBytes;
    constructor(c: HTTPClient, request: SimulateRequest);
    path(): string;
    do(headers?: {}): Promise<SimulateResponse>;
    prepare(body: Uint8Array): SimulateResponse;
}
