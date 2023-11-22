import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { BlockHashResponse } from './models/types';
export default class GetBlockHash extends JSONRequest<BlockHashResponse, Record<string, any>> {
    round: number | bigint;
    constructor(c: HTTPClient, intDecoding: IntDecoding, roundNumber: number);
    path(): string;
    prepare(body: Record<string, any>): BlockHashResponse;
}
