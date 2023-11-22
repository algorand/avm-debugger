import JSONRequest from '../jsonrequest';
export default class UnsetSyncRound extends JSONRequest {
    path(): string;
    do(headers?: {}): Promise<any>;
}
