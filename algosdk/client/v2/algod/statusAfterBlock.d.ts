import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { NodeStatusResponse } from './models/types';
export default class StatusAfterBlock extends JSONRequest<NodeStatusResponse, Record<string, any>> {
    private round;
    constructor(c: HTTPClient, intDecoding: IntDecoding, round: number);
    path(): string;
    prepare(body: Record<string, any>): NodeStatusResponse;
}
