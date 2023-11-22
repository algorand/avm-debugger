import JSONRequest from '../jsonrequest';
import { Version } from './models/types';
/**
 * retrieves the VersionResponse from the running node
 */
export default class Versions extends JSONRequest<Version, Record<string, any>> {
    path(): string;
    prepare(body: Record<string, any>): Version;
}
