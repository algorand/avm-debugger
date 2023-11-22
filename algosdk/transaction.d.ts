import { Address } from './types/address';
import AnyTransaction, { EncodedLogicSig, EncodedMultisig, EncodedTransaction } from './types/transactions';
import { BoxReference, OnApplicationComplete, TransactionParams, TransactionType } from './types/transactions/base';
export declare const ALGORAND_MIN_TX_FEE = 1000;
/**
 * A modified version of the transaction params. Represents the internal structure that the Transaction class uses
 * to store inputted transaction objects.
 */
interface TransactionStorageStructure extends Omit<TransactionParams, 'sender' | 'receiver' | 'genesisHash' | 'closeRemainderTo' | 'voteKey' | 'selectionKey' | 'stateProofKey' | 'assetManager' | 'assetReserve' | 'assetFreeze' | 'assetClawback' | 'assetSender' | 'freezeAccount' | 'appAccounts' | 'suggestedParams' | 'rekeyTo'> {
    sender: string | Address;
    receiver: string | Address;
    fee: number;
    amount: number | bigint;
    firstValid: number;
    lastValid: number;
    note?: Uint8Array;
    genesisID: string;
    genesisHash: string | Uint8Array;
    lease?: Uint8Array;
    closeRemainderTo?: string | Address;
    voteKey: string | Uint8Array;
    selectionKey: string | Uint8Array;
    stateProofKey: string | Uint8Array;
    voteFirst: number;
    voteLast: number;
    voteKeyDilution: number;
    assetIndex: number;
    assetTotal: number | bigint;
    assetDecimals: number;
    assetDefaultFrozen: boolean;
    assetManager: string | Address;
    assetReserve: string | Address;
    assetFreeze: string | Address;
    assetClawback: string | Address;
    assetUnitName: string;
    assetName: string;
    assetURL: string;
    assetMetadataHash?: string | Uint8Array;
    freezeAccount: string | Address;
    assetFrozen: boolean;
    assetSender?: string | Address;
    appIndex: number;
    appOnComplete: OnApplicationComplete;
    appLocalInts: number;
    appLocalByteSlices: number;
    appGlobalInts: number;
    appGlobalByteSlices: number;
    appApprovalProgram: Uint8Array;
    appClearProgram: Uint8Array;
    appArgs?: Uint8Array[];
    appAccounts?: string[] | Address[];
    appForeignApps?: number[];
    appForeignAssets?: number[];
    type?: TransactionType;
    flatFee: boolean;
    rekeyTo?: string | Address;
    nonParticipation?: boolean;
    group?: Uint8Array;
    extraPages?: number;
    boxes?: BoxReference[];
    stateProofType?: number | bigint;
    stateProof?: Uint8Array;
    stateProofMessage?: Uint8Array;
}
/**
 * Transaction enables construction of Algorand transactions
 * */
export declare class Transaction implements TransactionStorageStructure {
    name: string;
    tag: Uint8Array;
    sender: Address;
    receiver: Address;
    fee: number;
    amount: number | bigint;
    firstValid: number;
    lastValid: number;
    note?: Uint8Array;
    genesisID: string;
    genesisHash: Uint8Array;
    lease?: Uint8Array;
    closeRemainderTo?: Address;
    voteKey: Uint8Array;
    selectionKey: Uint8Array;
    stateProofKey: Uint8Array;
    voteFirst: number;
    voteLast: number;
    voteKeyDilution: number;
    assetIndex: number;
    assetTotal: number | bigint;
    assetDecimals: number;
    assetDefaultFrozen: boolean;
    assetManager: Address;
    assetReserve: Address;
    assetFreeze: Address;
    assetClawback: Address;
    assetUnitName: string;
    assetName: string;
    assetURL: string;
    assetMetadataHash?: Uint8Array;
    freezeAccount: Address;
    assetFrozen: boolean;
    assetSender?: Address;
    appIndex: number;
    appOnComplete: OnApplicationComplete;
    appLocalInts: number;
    appLocalByteSlices: number;
    appGlobalInts: number;
    appGlobalByteSlices: number;
    appApprovalProgram: Uint8Array;
    appClearProgram: Uint8Array;
    appArgs?: Uint8Array[];
    appAccounts?: Address[];
    appForeignApps?: number[];
    appForeignAssets?: number[];
    boxes?: BoxReference[];
    type?: TransactionType;
    flatFee: boolean;
    rekeyTo?: Address;
    nonParticipation?: boolean;
    group?: Uint8Array;
    extraPages?: number;
    stateProofType?: number | bigint;
    stateProof?: Uint8Array;
    stateProofMessage?: Uint8Array;
    constructor({ ...transaction }: AnyTransaction);
    get_obj_for_encoding(): EncodedTransaction;
    static from_obj_for_encoding(txnForEnc: EncodedTransaction): Transaction;
    estimateSize(): number;
    bytesToSign(): Uint8Array;
    toByte(): Uint8Array;
    rawSignTxn(sk: Uint8Array): Uint8Array;
    signTxn(sk: Uint8Array): Uint8Array;
    attachSignature(signerAddr: string, signature: Uint8Array): Uint8Array;
    rawTxID(): Uint8Array;
    txID(): string;
    addLease(lease: Uint8Array, feePerByte?: number): void;
    addRekey(rekeyTo: string, feePerByte?: number): void;
    _getDictForDisplay(): TransactionStorageStructure & Record<string, any>;
    prettyPrint(): void;
    toString(): string;
}
/**
 * encodeUnsignedSimulateTransaction takes a txnBuilder.Transaction object,
 * converts it into a SignedTransaction-like object, and converts it to a Buffer.
 *
 * Note: this function should only be used to simulate unsigned transactions.
 *
 * @param transactionObject - Transaction object to simulate.
 */
export declare function encodeUnsignedSimulateTransaction(transactionObject: Transaction): Uint8Array;
/**
 * encodeUnsignedTransaction takes a completed txnBuilder.Transaction object, such as from the makeFoo
 * family of transactions, and converts it to a Buffer
 * @param transactionObject - the completed Transaction object
 */
export declare function encodeUnsignedTransaction(transactionObject: Transaction): Uint8Array;
/**
 * decodeUnsignedTransaction takes a Uint8Array (as if from encodeUnsignedTransaction) and converts it to a txnBuilder.Transaction object
 * @param transactionBuffer - the Uint8Array containing a transaction
 */
export declare function decodeUnsignedTransaction(transactionBuffer: ArrayLike<number>): Transaction;
/**
 * Object representing a transaction with a signature
 */
export interface SignedTransaction {
    /**
     * Transaction signature
     */
    sig?: Uint8Array;
    /**
     * The transaction that was signed
     */
    txn: Transaction;
    /**
     * Multisig structure
     */
    msig?: EncodedMultisig;
    /**
     * Logic signature
     */
    lsig?: EncodedLogicSig;
    /**
     * The signer, if signing with a different key than the Transaction type `sender` property indicates
     */
    sgnr?: Uint8Array;
}
/**
 * decodeSignedTransaction takes a Uint8Array (from transaction.signTxn) and converts it to an object
 * containing the Transaction (txn), the signature (sig), and the auth-addr field if applicable (sgnr)
 * @param transactionBuffer - the Uint8Array containing a transaction
 * @returns containing a Transaction, the signature, and possibly an auth-addr field
 */
export declare function decodeSignedTransaction(transactionBuffer: Uint8Array): SignedTransaction;
/**
 * Either a valid transaction object or an instance of the Transaction class
 */
export declare type TransactionLike = AnyTransaction | Transaction;
export declare function instantiateTxnIfNeeded(transactionLike: TransactionLike): Transaction;
export default Transaction;
