import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { Asset } from './models/types';
export default class GetAssetByID extends JSONRequest<Asset, Record<string, any>> {
    private index;
    constructor(c: HTTPClient, intDecoding: IntDecoding, index: number);
    path(): string;
    prepare(body: Record<string, any>): Asset;
}
