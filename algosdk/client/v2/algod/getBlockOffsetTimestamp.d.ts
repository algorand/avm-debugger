import JSONRequest from '../jsonrequest';
import { GetBlockTimeStampOffsetResponse } from './models/types';
export default class GetBlockOffsetTimestamp extends JSONRequest<GetBlockTimeStampOffsetResponse, Record<string, any>> {
    path(): string;
    prepare(body: Record<string, any>): GetBlockTimeStampOffsetResponse;
}
