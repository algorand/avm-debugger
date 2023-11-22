import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
export default class GetLedgerStateDeltaForTransactionGroup extends JSONRequest {
    private id;
    constructor(c: HTTPClient, intDecoding: IntDecoding, id: string);
    path(): string;
}
