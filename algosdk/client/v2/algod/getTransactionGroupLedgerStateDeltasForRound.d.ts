import JSONRequest from '../jsonrequest';
import { TransactionGroupLedgerStateDeltasForRoundResponse } from './models/types';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
export default class GetTransactionGroupLedgerStateDeltasForRound extends JSONRequest<TransactionGroupLedgerStateDeltasForRoundResponse, Record<string, any>> {
    private round;
    constructor(c: HTTPClient, intDecoding: IntDecoding, round: number);
    path(): string;
    prepare(body: Record<string, any>): TransactionGroupLedgerStateDeltasForRoundResponse;
}
