import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
export default class SetBlockOffsetTimestamp extends JSONRequest {
    private offset;
    constructor(c: HTTPClient, intDecoding: IntDecoding, offset: number);
    path(): string;
    do(headers?: {}): Promise<any>;
}
