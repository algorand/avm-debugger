import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { StateProof as SP } from './models/types';
export default class StateProof extends JSONRequest<SP, Record<string, any>> {
    private round;
    constructor(c: HTTPClient, intDecoding: IntDecoding, round: number);
    path(): string;
    prepare(body: Record<string, any>): SP;
}
