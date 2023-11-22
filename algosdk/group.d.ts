import * as txnBuilder from './transaction';
interface EncodedTxGroup {
    txlist: Uint8Array[];
}
/**
 * Aux class for group id calculation of a group of transactions
 */
export declare class TxGroup {
    name: string;
    tag: Uint8Array;
    txGroupHashes: Uint8Array[];
    constructor(hashes: Uint8Array[]);
    get_obj_for_encoding(): EncodedTxGroup;
    static from_obj_for_encoding(txgroupForEnc: EncodedTxGroup): any;
    toByte(): Uint8Array;
}
/**
 * computeGroupID returns group ID for a group of transactions
 * @param txns - array of transactions (every element is a dict or Transaction)
 * @returns Uint8Array
 */
export declare function computeGroupID(txns: txnBuilder.TransactionLike[]): Uint8Array;
/**
 * assignGroupID assigns group id to a given list of unsigned transactions
 * @param txns - array of transactions (every element is a dict or Transaction)
 * @param sender - optional sender address specifying which transaction return
 * @returns possible list of matching transactions
 */
export declare function assignGroupID(txns: txnBuilder.TransactionLike[], sender?: string): txnBuilder.Transaction[];
export default TxGroup;
