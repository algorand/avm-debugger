import JSONRequest from '../jsonrequest';
import { SupplyResponse } from './models/types';
export default class Supply extends JSONRequest<SupplyResponse, Record<string, any>> {
    path(): string;
    prepare(body: Record<string, any>): SupplyResponse;
}
