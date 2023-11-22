import { DistributiveOverwrite } from '../utils';
import { TransactionParams, SuggestedParams } from './base';
/**
 * Transaction base with suggested params as object
 */
declare type TransactionBaseWithSuggestedParams = Pick<TransactionParams, 'suggestedParams' | 'sender' | 'type' | 'lease' | 'note' | 'rekeyTo'>;
/**
 * Transaction base with suggested params included as parameters
 */
declare type TransactionBaseWithoutSuggestedParams = Pick<TransactionParams, 'flatFee' | 'fee' | 'firstValid' | 'lastValid' | 'genesisHash' | 'sender' | 'type' | 'genesisID' | 'lease' | 'note' | 'rekeyTo'>;
/**
 * Transaction common fields.
 *
 * Base transaction type that is extended for all other transaction types.
 * Suggested params must be included, either as named object or included in the rest
 * of the parameters.
 */
export declare type TransactionBase = TransactionBaseWithoutSuggestedParams | TransactionBaseWithSuggestedParams | (TransactionBaseWithSuggestedParams & TransactionBaseWithoutSuggestedParams);
/**
 * Transaction builder type that accepts 2 generics:
 * - A: Additional parameters on top of the base transaction parameters
 * - O: A set of overwrites for transaction parameters
 */
export declare type ConstructTransaction<A = {}, O extends Partial<TransactionBase & A> = {}> = DistributiveOverwrite<TransactionBase & A, O>;
/**
 * Only accept transaction objects that include suggestedParams as an object
 */
export declare type MustHaveSuggestedParams<T extends ConstructTransaction> = Extract<T, {
    suggestedParams: SuggestedParams;
}>;
/**
 * Only accept transaction objects that include suggestedParams inline instead of being
 * enclosed in its own property
 */
export declare type MustHaveSuggestedParamsInline<T extends ConstructTransaction> = Extract<T, SuggestedParams>;
export default ConstructTransaction;
