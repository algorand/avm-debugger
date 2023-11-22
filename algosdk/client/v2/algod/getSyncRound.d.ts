import JSONRequest from '../jsonrequest';
import { GetSyncRoundResponse } from './models/types';
export default class GetSyncRound extends JSONRequest<GetSyncRoundResponse, Record<string, any>> {
    path(): string;
    prepare(body: Record<string, any>): GetSyncRoundResponse;
}
