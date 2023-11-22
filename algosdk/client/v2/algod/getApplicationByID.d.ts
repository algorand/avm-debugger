import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { Application } from './models/types';
export default class GetApplicationByID extends JSONRequest<Application, Record<string, any>> {
    private index;
    constructor(c: HTTPClient, intDecoding: IntDecoding, index: number);
    path(): string;
    prepare(body: Record<string, any>): Application;
}
