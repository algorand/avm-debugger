import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
export default class GetLedgerStateDelta extends JSONRequest {
    private round;
    constructor(c: HTTPClient, intDecoding: IntDecoding, round: number);
    path(): string;
}
