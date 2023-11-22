import HTTPClient from '../../client';
import { CompileResponse } from './models/types';
import JSONRequest from '../jsonrequest';
/**
 * Sets the default header (if not previously set)
 * @param headers - A headers object
 */
export declare function setHeaders(headers?: {}): {};
/**
 * Executes compile
 */
export default class Compile extends JSONRequest<CompileResponse, Record<string, any>> {
    private source;
    constructor(c: HTTPClient, source: string | Uint8Array);
    path(): string;
    sourcemap(map?: boolean): this;
    /**
     * Executes compile
     * @param headers - A headers object
     */
    do(headers?: {}): Promise<any>;
    prepare(body: Record<string, any>): CompileResponse;
}
