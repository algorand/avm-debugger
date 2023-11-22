import { TransactionType, TransactionParams } from './base';
import { ConstructTransaction } from './builder';
declare type SpecificParameters = Pick<TransactionParams, 'receiver' | 'amount' | 'closeRemainderTo'>;
interface Overwrites {
    type?: TransactionType.pay;
}
declare type PaymentTransaction = ConstructTransaction<SpecificParameters, Overwrites>;
export default PaymentTransaction;
