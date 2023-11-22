"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTransactionWithSigner = exports.makeEmptyTransactionSigner = exports.makeMultiSigAccountTransactionSigner = exports.makeLogicSigAccountTransactionSigner = exports.makeBasicAccountTransactionSigner = void 0;
const transaction_1 = require("./transaction");
const logicsig_1 = require("./logicsig");
const multisig_1 = require("./multisig");
/**
 * Create a TransactionSigner that can sign transactions for the provided basic Account.
 */
function makeBasicAccountTransactionSigner(account) {
    return (txnGroup, indexesToSign) => {
        const signed = [];
        for (const index of indexesToSign) {
            signed.push(txnGroup[index].signTxn(account.sk));
        }
        return Promise.resolve(signed);
    };
}
exports.makeBasicAccountTransactionSigner = makeBasicAccountTransactionSigner;
/**
 * Create a TransactionSigner that can sign transactions for the provided LogicSigAccount.
 */
function makeLogicSigAccountTransactionSigner(account) {
    return (txnGroup, indexesToSign) => {
        const signed = [];
        for (const index of indexesToSign) {
            const { blob } = (0, logicsig_1.signLogicSigTransactionObject)(txnGroup[index], account);
            signed.push(blob);
        }
        return Promise.resolve(signed);
    };
}
exports.makeLogicSigAccountTransactionSigner = makeLogicSigAccountTransactionSigner;
/**
 * Create a TransactionSigner that can sign transactions for the provided Multisig account.
 * @param msig - The Multisig account metadata
 * @param sks - An array of private keys belonging to the msig which should sign the transactions.
 */
function makeMultiSigAccountTransactionSigner(msig, sks) {
    return (txnGroup, indexesToSign) => {
        const signed = [];
        for (const index of indexesToSign) {
            const txn = txnGroup[index];
            const partialSigs = [];
            for (const sk of sks) {
                const { blob } = (0, multisig_1.signMultisigTransaction)(txn, msig, sk);
                partialSigs.push(blob);
            }
            if (partialSigs.length > 1) {
                signed.push((0, multisig_1.mergeMultisigTransactions)(partialSigs));
            }
            else {
                signed.push(partialSigs[0]);
            }
        }
        return Promise.resolve(signed);
    };
}
exports.makeMultiSigAccountTransactionSigner = makeMultiSigAccountTransactionSigner;
/**
 * Create a makeEmptyTransactionSigner that does not specify any signer or
 * signing capabilities. This should only be used to simulate transactions.
 */
function makeEmptyTransactionSigner() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (txnGroup, indexesToSign) => {
        const unsigned = [];
        for (const index of indexesToSign) {
            unsigned.push((0, transaction_1.encodeUnsignedSimulateTransaction)(txnGroup[index]));
        }
        return Promise.resolve(unsigned);
    };
}
exports.makeEmptyTransactionSigner = makeEmptyTransactionSigner;
/**
 * Check if a value conforms to the TransactionWithSigner structure.
 * @param value - The value to check.
 * @returns True if an only if the value has the structure of a TransactionWithSigner.
 */
function isTransactionWithSigner(value) {
    return (typeof value === 'object' &&
        Object.keys(value).length === 2 &&
        typeof value.txn === 'object' &&
        typeof value.signer === 'function');
}
exports.isTransactionWithSigner = isTransactionWithSigner;
//# sourceMappingURL=signer.js.map