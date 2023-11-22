import JSONRequest from '../jsonrequest';
import { NodeStatusResponse } from './models/types';
export default class Status extends JSONRequest<NodeStatusResponse, Record<string, any>> {
    path(): string;
    prepare(body: Record<string, any>): NodeStatusResponse;
}
