import JSONRequest from '../jsonrequest';
import HTTPClient from '../../client';
import IntDecoding from '../../../types/intDecoding';
import { LightBlockHeaderProof as LBHP } from './models/types';
export default class LightBlockHeaderProof extends JSONRequest<LBHP, Record<string, any>> {
    private round;
    constructor(c: HTTPClient, intDecoding: IntDecoding, round: number);
    path(): string;
    prepare(body: Record<string, any>): LBHP;
}
