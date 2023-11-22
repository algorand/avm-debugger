import HTTPClient from '../../client';
import JSONRequest from '../jsonrequest';
import { DryrunResponse } from './models/types';
import * as modelsv2 from './models/types';
export default class Dryrun extends JSONRequest<DryrunResponse, Record<string, any>> {
    private blob;
    constructor(c: HTTPClient, dr: modelsv2.DryrunRequest);
    path(): string;
    /**
     * Executes dryrun
     * @param headers - A headers object
     */
    do(headers?: {}): Promise<DryrunResponse>;
    prepare(body: Record<string, any>): DryrunResponse;
}
