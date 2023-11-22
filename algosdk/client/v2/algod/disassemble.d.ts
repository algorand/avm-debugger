import HTTPClient from '../../client';
import { DisassembleResponse } from './models/types';
import JSONRequest from '../jsonrequest';
/**
 * Sets the default header (if not previously set)
 * @param headers - A headers object
 */
export declare function setHeaders(headers?: {}): {};
/**
 * Executes disassemble
 */
export default class Disassemble extends JSONRequest<DisassembleResponse, Record<string, any>> {
    private source;
    constructor(c: HTTPClient, source: string | Uint8Array);
    path(): string;
    /**
     * Executes disassemble
     * @param headers - A headers object
     */
    do(headers?: {}): Promise<any>;
    prepare(body: Record<string, any>): DisassembleResponse;
}
