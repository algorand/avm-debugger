import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import { BlockResponse } from './models/types';
/**
 * block gets the block info for the given round. this call may block
 */
export default class Block extends JSONRequest<BlockResponse, Uint8Array> {
    private round;
    constructor(c: HTTPClient, roundNumber: number);
    path(): string;
    prepare(body: Uint8Array): BlockResponse;
}
