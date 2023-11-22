"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeApplicationCallTxnFromObject = exports.OnApplicationComplete = exports.makeApplicationNoOpTxnFromObject = exports.makeApplicationNoOpTxn = exports.makeApplicationClearStateTxnFromObject = exports.makeApplicationClearStateTxn = exports.makeApplicationCloseOutTxnFromObject = exports.makeApplicationCloseOutTxn = exports.makeApplicationOptInTxnFromObject = exports.makeApplicationOptInTxn = exports.makeApplicationDeleteTxnFromObject = exports.makeApplicationDeleteTxn = exports.makeApplicationUpdateTxnFromObject = exports.makeApplicationUpdateTxn = exports.makeApplicationCreateTxnFromObject = exports.makeApplicationCreateTxn = exports.makeAssetTransferTxnWithSuggestedParamsFromObject = exports.makeAssetTransferTxnWithSuggestedParams = exports.makeAssetFreezeTxnWithSuggestedParamsFromObject = exports.makeAssetFreezeTxnWithSuggestedParams = exports.makeAssetDestroyTxnWithSuggestedParamsFromObject = exports.makeAssetDestroyTxnWithSuggestedParams = exports.makeAssetConfigTxnWithSuggestedParamsFromObject = exports.makeAssetConfigTxnWithSuggestedParams = exports.makeAssetCreateTxnWithSuggestedParamsFromObject = exports.makeAssetCreateTxnWithSuggestedParams = exports.makeKeyRegistrationTxnWithSuggestedParamsFromObject = exports.makeKeyRegistrationTxnWithSuggestedParams = exports.makePaymentTxnWithSuggestedParamsFromObject = exports.makePaymentTxnWithSuggestedParams = void 0;
const txnBuilder = __importStar(require("./transaction"));
const base_1 = require("./types/transactions/base");
const transactions_1 = require("./types/transactions");
/**
 * makePaymentTxnWithSuggestedParams takes payment arguments and returns a Transaction object
 * @param sender - string representation of Algorand address of sender
 * @param receiver - string representation of Algorand address of recipient
 * @param amount - integer amount to send, in microAlgos
 * @param closeRemainderTo - optionally close out remaining account balance to this account, represented as string rep of Algorand address
 * @param note - uint8array of arbitrary data for sender to store
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param rekeyTo - rekeyTo address, optional
 */
function makePaymentTxnWithSuggestedParams(sender, receiver, amount, closeRemainderTo, note, suggestedParams, rekeyTo) {
    const o = {
        sender,
        receiver,
        amount,
        closeRemainderTo,
        note,
        suggestedParams,
        type: transactions_1.TransactionType.pay,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makePaymentTxnWithSuggestedParams = makePaymentTxnWithSuggestedParams;
// helper for above makePaymentTxnWithSuggestedParams, instead accepting an arguments object
function makePaymentTxnWithSuggestedParamsFromObject(o) {
    return makePaymentTxnWithSuggestedParams(o.sender, o.receiver, o.amount, o.closeRemainderTo, o.note, o.suggestedParams, o.rekeyTo);
}
exports.makePaymentTxnWithSuggestedParamsFromObject = makePaymentTxnWithSuggestedParamsFromObject;
function makeKeyRegistrationTxnWithSuggestedParams(sender, note, voteKey, selectionKey, voteFirst, voteLast, voteKeyDilution, suggestedParams, rekeyTo, nonParticipation = false, stateProofKey = undefined) {
    const o = {
        sender,
        note,
        voteKey,
        selectionKey,
        voteFirst,
        voteLast,
        voteKeyDilution,
        suggestedParams,
        type: transactions_1.TransactionType.keyreg,
        rekeyTo,
        nonParticipation,
        stateProofKey,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeKeyRegistrationTxnWithSuggestedParams = makeKeyRegistrationTxnWithSuggestedParams;
function makeKeyRegistrationTxnWithSuggestedParamsFromObject(o) {
    return makeKeyRegistrationTxnWithSuggestedParams(o.sender, o.note, o.voteKey, o.selectionKey, o.voteFirst, o.voteLast, o.voteKeyDilution, o.suggestedParams, o.rekeyTo, o.nonParticipation, o.stateProofKey);
}
exports.makeKeyRegistrationTxnWithSuggestedParamsFromObject = makeKeyRegistrationTxnWithSuggestedParamsFromObject;
/** makeAssetCreateTxnWithSuggestedParams takes asset creation arguments and returns a Transaction object
 * for creating that asset
 *
 * @param sender - string representation of Algorand address of sender
 * @param note - uint8array of arbitrary data for sender to store
 * @param total - integer total supply of the asset
 * @param decimals - integer number of decimals for asset unit calculation
 * @param defaultFrozen - boolean whether asset accounts should default to being frozen
 * @param manager - string representation of Algorand address in charge of reserve, freeze, clawback, destruction, etc
 * @param reserve - string representation of Algorand address representing asset reserve
 * @param freeze - string representation of Algorand address with power to freeze/unfreeze asset holdings
 * @param clawback - string representation of Algorand address with power to revoke asset holdings
 * @param unitName - string units name for this asset
 * @param assetName - string name for this asset
 * @param assetURL - string URL relating to this asset
 * @param assetMetadataHash - Uint8Array or UTF-8 string representation of a hash commitment with respect to the asset. Must be exactly 32 bytes long.
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param rekeyTo - rekeyTo address, optional
 */
function makeAssetCreateTxnWithSuggestedParams(sender, note, total, decimals, defaultFrozen, manager, reserve, freeze, clawback, unitName, assetName, assetURL, assetMetadataHash, suggestedParams, rekeyTo) {
    const o = {
        sender,
        note,
        suggestedParams,
        assetTotal: total,
        assetDecimals: decimals,
        assetDefaultFrozen: defaultFrozen,
        assetUnitName: unitName,
        assetName,
        assetURL,
        assetMetadataHash,
        assetManager: manager,
        assetReserve: reserve,
        assetFreeze: freeze,
        assetClawback: clawback,
        type: transactions_1.TransactionType.acfg,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeAssetCreateTxnWithSuggestedParams = makeAssetCreateTxnWithSuggestedParams;
// helper for above makeAssetCreateTxnWithSuggestedParams, instead accepting an arguments object
function makeAssetCreateTxnWithSuggestedParamsFromObject(o) {
    return makeAssetCreateTxnWithSuggestedParams(o.sender, o.note, o.total, o.decimals, o.defaultFrozen, o.manager, o.reserve, o.freeze, o.clawback, o.unitName, o.assetName, o.assetURL, o.assetMetadataHash, o.suggestedParams, o.rekeyTo);
}
exports.makeAssetCreateTxnWithSuggestedParamsFromObject = makeAssetCreateTxnWithSuggestedParamsFromObject;
/** makeAssetConfigTxnWithSuggestedParams can be issued by the asset manager to change the manager, reserve, freeze, or clawback
 * you must respecify existing addresses to keep them the same; leaving a field blank is the same as turning
 * that feature off for this asset
 *
 * @param sender - string representation of Algorand address of sender
 * @param note - uint8array of arbitrary data for sender to store
 * @param assetIndex - int asset index uniquely specifying the asset
 * @param manager - string representation of new asset manager Algorand address
 * @param reserve - string representation of new reserve Algorand address
 * @param freeze - string representation of new freeze manager Algorand address
 * @param clawback - string representation of new revocation manager Algorand address
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param rekeyTo - rekeyTo address, optional
 * @param strictEmptyAddressChecking - boolean - throw an error if any of manager, reserve, freeze, or clawback are undefined. optional, defaults to true.
 */
function makeAssetConfigTxnWithSuggestedParams(sender, note, assetIndex, manager, reserve, freeze, clawback, suggestedParams, rekeyTo, strictEmptyAddressChecking = true) {
    if (strictEmptyAddressChecking &&
        (manager === undefined ||
            reserve === undefined ||
            freeze === undefined ||
            clawback === undefined)) {
        throw Error('strict empty address checking was turned on, but at least one empty address was provided');
    }
    const o = {
        sender,
        suggestedParams,
        assetIndex,
        assetManager: manager,
        assetReserve: reserve,
        assetFreeze: freeze,
        assetClawback: clawback,
        type: transactions_1.TransactionType.acfg,
        note,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeAssetConfigTxnWithSuggestedParams = makeAssetConfigTxnWithSuggestedParams;
// helper for above makeAssetConfigTxnWithSuggestedParams, instead accepting an arguments object
function makeAssetConfigTxnWithSuggestedParamsFromObject(o) {
    return makeAssetConfigTxnWithSuggestedParams(o.sender, o.note, o.assetIndex, o.manager, o.reserve, o.freeze, o.clawback, o.suggestedParams, o.rekeyTo, o.strictEmptyAddressChecking);
}
exports.makeAssetConfigTxnWithSuggestedParamsFromObject = makeAssetConfigTxnWithSuggestedParamsFromObject;
/** makeAssetDestroyTxnWithSuggestedParams will allow the asset's manager to remove this asset from the ledger, so long
 * as all outstanding assets are held by the creator.
 *
 * @param sender - string representation of Algorand address of sender
 * @param note - uint8array of arbitrary data for sender to store
 * @param assetIndex - int asset index uniquely specifying the asset
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param rekeyTo - rekeyTo address, optional
 */
function makeAssetDestroyTxnWithSuggestedParams(sender, note, assetIndex, suggestedParams, rekeyTo) {
    const o = {
        sender,
        suggestedParams,
        assetIndex,
        type: transactions_1.TransactionType.acfg,
        note,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeAssetDestroyTxnWithSuggestedParams = makeAssetDestroyTxnWithSuggestedParams;
// helper for above makeAssetDestroyTxnWithSuggestedParams, instead accepting an arguments object
function makeAssetDestroyTxnWithSuggestedParamsFromObject(o) {
    return makeAssetDestroyTxnWithSuggestedParams(o.sender, o.note, o.assetIndex, o.suggestedParams, o.rekeyTo);
}
exports.makeAssetDestroyTxnWithSuggestedParamsFromObject = makeAssetDestroyTxnWithSuggestedParamsFromObject;
/** makeAssetFreezeTxnWithSuggestedParams will allow the asset's freeze manager to freeze or un-freeze an account,
 * blocking or allowing asset transfers to and from the targeted account.
 *
 * @param sender - string representation of Algorand address of sender
 * @param note - uint8array of arbitrary data for sender to store
 * @param assetIndex - int asset index uniquely specifying the asset
 * @param freezeTarget - string representation of Algorand address being frozen or unfrozen
 * @param assetFrozen - true if freezeTarget should be frozen, false if freezeTarget should be allowed to transact
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param rekeyTo - rekeyTo address, optional
 */
function makeAssetFreezeTxnWithSuggestedParams(sender, note, assetIndex, freezeTarget, assetFrozen, suggestedParams, rekeyTo) {
    const o = {
        sender,
        type: transactions_1.TransactionType.afrz,
        freezeAccount: freezeTarget,
        assetIndex,
        assetFrozen,
        note,
        suggestedParams,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeAssetFreezeTxnWithSuggestedParams = makeAssetFreezeTxnWithSuggestedParams;
// helper for above makeAssetFreezeTxnWithSuggestedParams, instead accepting an arguments object
function makeAssetFreezeTxnWithSuggestedParamsFromObject(o) {
    return makeAssetFreezeTxnWithSuggestedParams(o.sender, o.note, o.assetIndex, o.freezeTarget, o.assetFrozen, o.suggestedParams, o.rekeyTo);
}
exports.makeAssetFreezeTxnWithSuggestedParamsFromObject = makeAssetFreezeTxnWithSuggestedParamsFromObject;
/** makeAssetTransferTxnWithSuggestedParams allows for the creation of an asset transfer transaction.
 * Special case: to begin accepting assets, set amount=0 and sender=receiver.
 *
 * @param sender - string representation of Algorand address of sender
 * @param receiver - string representation of Algorand address of asset recipient
 * @param closeRemainderTo - optional - string representation of Algorand address - if provided,
 * send all remaining assets after transfer to the "closeRemainderTo" address and close "sender"'s asset holdings
 * @param assetSender - optional - string representation of Algorand address - if provided,
 * and if "sender" is the asset's revocation manager, then deduct from "assetSender" rather than "sender"
 * @param amount - integer amount of assets to send
 * @param note - uint8array of arbitrary data for sender to store
 * @param assetIndex - int asset index uniquely specifying the asset
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param rekeyTo - rekeyTo address, optional
 */
function makeAssetTransferTxnWithSuggestedParams(sender, receiver, closeRemainderTo, assetSender, amount, note, assetIndex, suggestedParams, rekeyTo) {
    const o = {
        type: transactions_1.TransactionType.axfer,
        sender,
        receiver,
        amount,
        suggestedParams,
        assetIndex,
        note,
        assetSender,
        closeRemainderTo,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeAssetTransferTxnWithSuggestedParams = makeAssetTransferTxnWithSuggestedParams;
// helper for above makeAssetTransferTxnWithSuggestedParams, instead accepting an arguments object
function makeAssetTransferTxnWithSuggestedParamsFromObject(o) {
    return makeAssetTransferTxnWithSuggestedParams(o.sender, o.receiver, o.closeRemainderTo, o.assetSender, o.amount, o.note, o.assetIndex, o.suggestedParams, o.rekeyTo);
}
exports.makeAssetTransferTxnWithSuggestedParamsFromObject = makeAssetTransferTxnWithSuggestedParamsFromObject;
/**
 * Make a transaction that will create an application.
 * @param sender - address of sender
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param onComplete - algosdk.OnApplicationComplete, what application should do once the program is done being run
 * @param approvalProgram - Uint8Array, the compiled TEAL that approves a transaction
 * @param clearProgram - Uint8Array, the compiled TEAL that runs when clearing state
 * @param numLocalInts - restricts number of ints in per-user local state
 * @param numLocalByteSlices - restricts number of byte slices in per-user local state
 * @param numGlobalInts - restricts number of ints in global state
 * @param numGlobalByteSlices - restricts number of byte slices in global state
 * @param appArgs - Array of Uint8Array, any additional arguments to the application
 * @param accounts - Array of Address strings, any additional accounts to supply to the application
 * @param foreignApps - Array of int, any other apps used by the application, identified by index
 * @param foreignAssets - Array of int, any assets used by the application, identified by index
 * @param note - Arbitrary data for sender to store
 * @param lease - Lease a transaction
 * @param rekeyTo - String representation of the Algorand address that will be used to authorize all future transactions
 * @param extraPages - integer extra pages of memory to rent on creation of application
 * @param boxes - Array of BoxReference, app ID and name of box to be accessed
 */
function makeApplicationCreateTxn(sender, suggestedParams, onComplete, approvalProgram, clearProgram, numLocalInts, numLocalByteSlices, numGlobalInts, numGlobalByteSlices, appArgs, accounts, foreignApps, foreignAssets, note, lease, rekeyTo, extraPages, boxes) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender,
        suggestedParams,
        appIndex: 0,
        appOnComplete: onComplete,
        appLocalInts: numLocalInts,
        appLocalByteSlices: numLocalByteSlices,
        appGlobalInts: numGlobalInts,
        appGlobalByteSlices: numGlobalByteSlices,
        appApprovalProgram: approvalProgram,
        appClearProgram: clearProgram,
        appArgs,
        appAccounts: accounts,
        appForeignApps: foreignApps,
        appForeignAssets: foreignAssets,
        boxes,
        note,
        lease,
        rekeyTo,
        extraPages,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationCreateTxn = makeApplicationCreateTxn;
// helper for above makeApplicationCreateTxn, instead accepting an arguments object
function makeApplicationCreateTxnFromObject(o) {
    return makeApplicationCreateTxn(o.sender, o.suggestedParams, o.onComplete, o.approvalProgram, o.clearProgram, o.numLocalInts, o.numLocalByteSlices, o.numGlobalInts, o.numGlobalByteSlices, o.appArgs, o.accounts, o.foreignApps, o.foreignAssets, o.note, o.lease, o.rekeyTo, o.extraPages, o.boxes);
}
exports.makeApplicationCreateTxnFromObject = makeApplicationCreateTxnFromObject;
/**
 * Make a transaction that changes an application's approval and clear programs
 * @param sender - address of sender
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param appIndex - the ID of the app to be updated
 * @param approvalProgram - Uint8Array, the compiled TEAL that approves a transaction
 * @param clearProgram - Uint8Array, the compiled TEAL that runs when clearing state
 * @param appArgs - Array of Uint8Array, any additional arguments to the application
 * @param accounts - Array of Address strings, any additional accounts to supply to the application
 * @param foreignApps - Array of int, any other apps used by the application, identified by index
 * @param foreignAssets - Array of int, any assets used by the application, identified by index
 * @param note - Arbitrary data for sender to store
 * @param lease - Lease a transaction
 * @param rekeyTo - String representation of the Algorand address that will be used to authorize all future transactions
 * @param boxes - Array of BoxReference, app ID and name of box to be accessed
 */
function makeApplicationUpdateTxn(sender, suggestedParams, appIndex, approvalProgram, clearProgram, appArgs, accounts, foreignApps, foreignAssets, note, lease, rekeyTo, boxes) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender,
        suggestedParams,
        appIndex,
        appApprovalProgram: approvalProgram,
        appOnComplete: base_1.OnApplicationComplete.UpdateApplicationOC,
        appClearProgram: clearProgram,
        appArgs,
        appAccounts: accounts,
        appForeignApps: foreignApps,
        appForeignAssets: foreignAssets,
        boxes,
        note,
        lease,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationUpdateTxn = makeApplicationUpdateTxn;
// helper for above makeApplicationUpdateTxn, instead accepting an arguments object
function makeApplicationUpdateTxnFromObject(o) {
    return makeApplicationUpdateTxn(o.sender, o.suggestedParams, o.appIndex, o.approvalProgram, o.clearProgram, o.appArgs, o.accounts, o.foreignApps, o.foreignAssets, o.note, o.lease, o.rekeyTo, o.boxes);
}
exports.makeApplicationUpdateTxnFromObject = makeApplicationUpdateTxnFromObject;
/**
 * Make a transaction that deletes an application
 * @param sender - address of sender
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param appIndex - the ID of the app to be deleted
 * @param appArgs - Array of Uint8Array, any additional arguments to the application
 * @param accounts - Array of Address strings, any additional accounts to supply to the application
 * @param foreignApps - Array of int, any other apps used by the application, identified by index
 * @param foreignAssets - Array of int, any assets used by the application, identified by index
 * @param note - Arbitrary data for sender to store
 * @param lease - Lease a transaction
 * @param rekeyTo - String representation of the Algorand address that will be used to authorize all future transactions
 * @param boxes - Array of BoxReference, app ID and name of box to be accessed
 */
function makeApplicationDeleteTxn(sender, suggestedParams, appIndex, appArgs, accounts, foreignApps, foreignAssets, note, lease, rekeyTo, boxes) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender,
        suggestedParams,
        appIndex,
        appOnComplete: base_1.OnApplicationComplete.DeleteApplicationOC,
        appArgs,
        appAccounts: accounts,
        appForeignApps: foreignApps,
        appForeignAssets: foreignAssets,
        boxes,
        note,
        lease,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationDeleteTxn = makeApplicationDeleteTxn;
// helper for above makeApplicationDeleteTxn, instead accepting an arguments object
function makeApplicationDeleteTxnFromObject(o) {
    return makeApplicationDeleteTxn(o.sender, o.suggestedParams, o.appIndex, o.appArgs, o.accounts, o.foreignApps, o.foreignAssets, o.note, o.lease, o.rekeyTo, o.boxes);
}
exports.makeApplicationDeleteTxnFromObject = makeApplicationDeleteTxnFromObject;
/**
 * Make a transaction that opts in to use an application
 * @param sender - address of sender
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param appIndex - the ID of the app to join
 * @param appArgs - Array of Uint8Array, any additional arguments to the application
 * @param accounts - Array of Address strings, any additional accounts to supply to the application
 * @param foreignApps - Array of int, any other apps used by the application, identified by index
 * @param foreignAssets - Array of int, any assets used by the application, identified by index
 * @param note - Arbitrary data for sender to store
 * @param lease - Lease a transaction
 * @param rekeyTo - String representation of the Algorand address that will be used to authorize all future transactions
 * @param boxes - Array of BoxReference, app ID and name of box to be accessed
 */
function makeApplicationOptInTxn(sender, suggestedParams, appIndex, appArgs, accounts, foreignApps, foreignAssets, note, lease, rekeyTo, boxes) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender,
        suggestedParams,
        appIndex,
        appOnComplete: base_1.OnApplicationComplete.OptInOC,
        appArgs,
        appAccounts: accounts,
        appForeignApps: foreignApps,
        appForeignAssets: foreignAssets,
        boxes,
        note,
        lease,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationOptInTxn = makeApplicationOptInTxn;
// helper for above makeApplicationOptInTxn, instead accepting an argument object
function makeApplicationOptInTxnFromObject(o) {
    return makeApplicationOptInTxn(o.sender, o.suggestedParams, o.appIndex, o.appArgs, o.accounts, o.foreignApps, o.foreignAssets, o.note, o.lease, o.rekeyTo, o.boxes);
}
exports.makeApplicationOptInTxnFromObject = makeApplicationOptInTxnFromObject;
/**
 * Make a transaction that closes out a user's state in an application
 * @param sender - address of sender
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param appIndex - the ID of the app to use
 * @param appArgs - Array of Uint8Array, any additional arguments to the application
 * @param accounts - Array of Address strings, any additional accounts to supply to the application
 * @param foreignApps - Array of int, any other apps used by the application, identified by index
 * @param foreignAssets - Array of int, any assets used by the application, identified by index
 * @param note - Arbitrary data for sender to store
 * @param lease - Lease a transaction
 * @param rekeyTo - String representation of the Algorand address that will be used to authorize all future transactions
 * @param boxes - Array of BoxReference, app ID and name of box to be accessed
 */
function makeApplicationCloseOutTxn(sender, suggestedParams, appIndex, appArgs, accounts, foreignApps, foreignAssets, note, lease, rekeyTo, boxes) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender,
        suggestedParams,
        appIndex,
        appOnComplete: base_1.OnApplicationComplete.CloseOutOC,
        appArgs,
        appAccounts: accounts,
        appForeignApps: foreignApps,
        appForeignAssets: foreignAssets,
        boxes,
        note,
        lease,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationCloseOutTxn = makeApplicationCloseOutTxn;
// helper for above makeApplicationCloseOutTxn, instead accepting an argument object
function makeApplicationCloseOutTxnFromObject(o) {
    return makeApplicationCloseOutTxn(o.sender, o.suggestedParams, o.appIndex, o.appArgs, o.accounts, o.foreignApps, o.foreignAssets, o.note, o.lease, o.rekeyTo, o.boxes);
}
exports.makeApplicationCloseOutTxnFromObject = makeApplicationCloseOutTxnFromObject;
/**
 * Make a transaction that clears a user's state in an application
 * @param sender - address of sender
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param appIndex - the ID of the app to use
 * @param appArgs - Array of Uint8Array, any additional arguments to the application
 * @param accounts - Array of Address strings, any additional accounts to supply to the application
 * @param foreignApps - Array of int, any other apps used by the application, identified by index
 * @param foreignAssets - Array of int, any assets used by the application, identified by index
 * @param note - Arbitrary data for sender to store
 * @param lease - Lease a transaction
 * @param rekeyTo - String representation of the Algorand address that will be used to authorize all future transactions
 * @param boxes - Array of BoxReference, app ID and name of box to be accessed
 */
function makeApplicationClearStateTxn(sender, suggestedParams, appIndex, appArgs, accounts, foreignApps, foreignAssets, note, lease, rekeyTo, boxes) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender,
        suggestedParams,
        appIndex,
        appOnComplete: base_1.OnApplicationComplete.ClearStateOC,
        appArgs,
        appAccounts: accounts,
        appForeignApps: foreignApps,
        appForeignAssets: foreignAssets,
        boxes,
        note,
        lease,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationClearStateTxn = makeApplicationClearStateTxn;
// helper for above makeApplicationClearStateTxn, instead accepting an argument object
function makeApplicationClearStateTxnFromObject(o) {
    return makeApplicationClearStateTxn(o.sender, o.suggestedParams, o.appIndex, o.appArgs, o.accounts, o.foreignApps, o.foreignAssets, o.note, o.lease, o.rekeyTo, o.boxes);
}
exports.makeApplicationClearStateTxnFromObject = makeApplicationClearStateTxnFromObject;
/**
 * Make a transaction that just calls an application, doing nothing on completion
 * @param sender - address of sender
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param appIndex - the ID of the app to use
 * @param appArgs - Array of Uint8Array, any additional arguments to the application
 * @param accounts - Array of Address strings, any additional accounts to supply to the application
 * @param foreignApps - Array of int, any other apps used by the application, identified by index
 * @param foreignAssets - Array of int, any assets used by the application, identified by index
 * @param note - Arbitrary data for sender to store
 * @param lease - Lease a transaction
 * @param rekeyTo - String representation of the Algorand address that will be used to authorize all future transactions
 * @param boxes - Array of BoxReference, app ID and name of box to be accessed
 */
function makeApplicationNoOpTxn(sender, suggestedParams, appIndex, appArgs, accounts, foreignApps, foreignAssets, note, lease, rekeyTo, boxes) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender,
        suggestedParams,
        appIndex,
        appOnComplete: base_1.OnApplicationComplete.NoOpOC,
        appArgs,
        appAccounts: accounts,
        appForeignApps: foreignApps,
        appForeignAssets: foreignAssets,
        boxes,
        note,
        lease,
        rekeyTo,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationNoOpTxn = makeApplicationNoOpTxn;
// helper for above makeApplicationNoOpTxn, instead accepting an argument object
function makeApplicationNoOpTxnFromObject(o) {
    return makeApplicationNoOpTxn(o.sender, o.suggestedParams, o.appIndex, o.appArgs, o.accounts, o.foreignApps, o.foreignAssets, o.note, o.lease, o.rekeyTo, o.boxes);
}
exports.makeApplicationNoOpTxnFromObject = makeApplicationNoOpTxnFromObject;
var base_2 = require("./types/transactions/base");
Object.defineProperty(exports, "OnApplicationComplete", { enumerable: true, get: function () { return base_2.OnApplicationComplete; } });
/**
 * Generic function for creating any application call transaction.
 */
function makeApplicationCallTxnFromObject(options) {
    const o = {
        type: transactions_1.TransactionType.appl,
        sender: options.sender,
        suggestedParams: options.suggestedParams,
        appIndex: options.appIndex,
        appOnComplete: options.onComplete,
        appLocalInts: options.numLocalInts,
        appLocalByteSlices: options.numLocalByteSlices,
        appGlobalInts: options.numGlobalInts,
        appGlobalByteSlices: options.numGlobalByteSlices,
        appApprovalProgram: options.approvalProgram,
        appClearProgram: options.clearProgram,
        appArgs: options.appArgs,
        appAccounts: options.accounts,
        appForeignApps: options.foreignApps,
        appForeignAssets: options.foreignAssets,
        boxes: options.boxes,
        note: options.note,
        lease: options.lease,
        rekeyTo: options.rekeyTo,
        extraPages: options.extraPages,
    };
    return new txnBuilder.Transaction(o);
}
exports.makeApplicationCallTxnFromObject = makeApplicationCallTxnFromObject;
//# sourceMappingURL=makeTxn.js.map