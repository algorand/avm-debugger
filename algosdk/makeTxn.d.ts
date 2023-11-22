import * as txnBuilder from './transaction';
import { PaymentTxn, KeyRegistrationTxn, MustHaveSuggestedParams, AssetCreateTxn, AssetConfigTxn, AssetDestroyTxn, AssetFreezeTxn, AssetTransferTxn, AppCreateTxn, AppUpdateTxn, AppDeleteTxn, AppOptInTxn, AppCloseOutTxn, AppClearStateTxn, AppNoOpTxn } from './types/transactions';
import { RenameProperties, RenameProperty, Expand } from './types/utils';
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
export declare function makePaymentTxnWithSuggestedParams(sender: PaymentTxn['sender'], receiver: PaymentTxn['receiver'], amount: PaymentTxn['amount'], closeRemainderTo: PaymentTxn['closeRemainderTo'], note: PaymentTxn['note'], suggestedParams: MustHaveSuggestedParams<PaymentTxn>['suggestedParams'], rekeyTo?: PaymentTxn['rekeyTo']): txnBuilder.Transaction;
export declare function makePaymentTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperty<MustHaveSuggestedParams<PaymentTxn>, 'rekeyTo', 'rekeyTo'>, 'sender' | 'receiver' | 'amount' | 'closeRemainderTo' | 'note' | 'suggestedParams' | 'rekeyTo'>>): txnBuilder.Transaction;
/**
 * makeKeyRegistrationTxnWithSuggestedParams takes key registration arguments and returns a Transaction object for
 * that key registration operation
 *
 * @param sender - string representation of Algorand address of sender
 * @param note - uint8array of arbitrary data for sender to store
 * @param voteKey - voting key. for key deregistration, leave undefined
 * @param selectionKey - selection key. for key deregistration, leave undefined
 * @param voteFirst - first round on which voteKey is valid
 * @param voteLast - last round on which voteKey is valid
 * @param voteKeyDilution - integer
 * @param suggestedParams - a dict holding common-to-all-txns args:
 * fee - integer fee per byte, in microAlgos. for a flat fee, set flatFee to true
 * flatFee - bool optionally set this to true to specify fee as microalgos-per-txn
 *       If true, txn fee may fall below the ALGORAND_MIN_TX_FEE
 * firstValid - integer first protocol round on which this txn is valid
 * lastValid - integer last protocol round on which this txn is valid
 * genesisHash - string specifies hash genesis block of network in use
 * genesisID - string specifies genesis ID of network in use
 * @param rekeyTo - rekeyTo address, optional
 * @param nonParticipation - configure whether the address wants to stop participating. If true,
 *   voteKey, selectionKey, voteFirst, voteLast, and voteKeyDilution must be undefined.
 * @param stateProofKey - state proof key. for key deregistration, leave undefined
 */
export declare function makeKeyRegistrationTxnWithSuggestedParams(sender: KeyRegistrationTxn['sender'], note: KeyRegistrationTxn['note'], voteKey: KeyRegistrationTxn['voteKey'], selectionKey: KeyRegistrationTxn['selectionKey'], voteFirst: KeyRegistrationTxn['voteFirst'], voteLast: KeyRegistrationTxn['voteLast'], voteKeyDilution: KeyRegistrationTxn['voteKeyDilution'], suggestedParams: MustHaveSuggestedParams<KeyRegistrationTxn>['suggestedParams'], rekeyTo?: KeyRegistrationTxn['rekeyTo'], nonParticipation?: false, stateProofKey?: KeyRegistrationTxn['stateProofKey']): txnBuilder.Transaction;
export declare function makeKeyRegistrationTxnWithSuggestedParams(sender: KeyRegistrationTxn['sender'], note: KeyRegistrationTxn['note'], voteKey: undefined, selectionKey: undefined, voteFirst: undefined, voteLast: undefined, voteKeyDilution: undefined, suggestedParams: MustHaveSuggestedParams<KeyRegistrationTxn>['suggestedParams'], rekeyTo?: KeyRegistrationTxn['rekeyTo'], nonParticipation?: true, stateProofKey?: undefined): txnBuilder.Transaction;
export declare function makeKeyRegistrationTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperty<MustHaveSuggestedParams<KeyRegistrationTxn>, 'rekeyTo', 'rekeyTo'>, 'sender' | 'note' | 'voteKey' | 'selectionKey' | 'stateProofKey' | 'voteFirst' | 'voteLast' | 'voteKeyDilution' | 'suggestedParams' | 'rekeyTo'> & {
    nonParticipation?: false;
}>): txnBuilder.Transaction;
export declare function makeKeyRegistrationTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperty<MustHaveSuggestedParams<KeyRegistrationTxn>, 'rekeyTo', 'rekeyTo'>, 'sender' | 'note' | 'suggestedParams' | 'rekeyTo' | 'nonParticipation'>>): txnBuilder.Transaction;
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
export declare function makeAssetCreateTxnWithSuggestedParams(sender: AssetCreateTxn['sender'], note: AssetCreateTxn['note'], total: AssetCreateTxn['assetTotal'], decimals: AssetCreateTxn['assetDecimals'], defaultFrozen: AssetCreateTxn['assetDefaultFrozen'], manager: AssetCreateTxn['assetManager'], reserve: AssetCreateTxn['assetReserve'], freeze: AssetCreateTxn['assetFreeze'], clawback: AssetCreateTxn['assetClawback'], unitName: AssetCreateTxn['assetUnitName'], assetName: AssetCreateTxn['assetName'], assetURL: AssetCreateTxn['assetURL'], assetMetadataHash: AssetCreateTxn['assetMetadataHash'] | undefined, suggestedParams: MustHaveSuggestedParams<AssetCreateTxn>['suggestedParams'], rekeyTo?: AssetCreateTxn['rekeyTo']): txnBuilder.Transaction;
export declare function makeAssetCreateTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AssetCreateTxn>, {
    rekeyTo: 'rekeyTo';
    assetTotal: 'total';
    assetDecimals: 'decimals';
    assetDefaultFrozen: 'defaultFrozen';
    assetManager: 'manager';
    assetReserve: 'reserve';
    assetFreeze: 'freeze';
    assetClawback: 'clawback';
    assetUnitName: 'unitName';
}>, 'sender' | 'note' | 'total' | 'decimals' | 'defaultFrozen' | 'manager' | 'reserve' | 'freeze' | 'clawback' | 'unitName' | 'assetName' | 'assetURL' | 'assetMetadataHash' | 'suggestedParams' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeAssetConfigTxnWithSuggestedParams(sender: AssetConfigTxn['sender'], note: AssetConfigTxn['note'], assetIndex: AssetConfigTxn['assetIndex'], manager: AssetConfigTxn['assetManager'], reserve: AssetConfigTxn['assetReserve'], freeze: AssetConfigTxn['assetFreeze'], clawback: AssetConfigTxn['assetClawback'], suggestedParams: MustHaveSuggestedParams<AssetConfigTxn>['suggestedParams'], rekeyTo?: AssetConfigTxn['rekeyTo'], strictEmptyAddressChecking?: boolean): txnBuilder.Transaction;
export declare function makeAssetConfigTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AssetConfigTxn>, {
    rekeyTo: 'rekeyTo';
    assetManager: 'manager';
    assetReserve: 'reserve';
    assetFreeze: 'freeze';
    assetClawback: 'clawback';
}>, 'sender' | 'note' | 'assetIndex' | 'manager' | 'reserve' | 'freeze' | 'clawback' | 'suggestedParams' | 'rekeyTo'> & {
    strictEmptyAddressChecking: boolean;
}>): txnBuilder.Transaction;
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
export declare function makeAssetDestroyTxnWithSuggestedParams(sender: AssetDestroyTxn['sender'], note: AssetDestroyTxn['note'], assetIndex: AssetDestroyTxn['assetIndex'], suggestedParams: MustHaveSuggestedParams<AssetDestroyTxn>['suggestedParams'], rekeyTo?: AssetDestroyTxn['rekeyTo']): txnBuilder.Transaction;
export declare function makeAssetDestroyTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperty<MustHaveSuggestedParams<AssetDestroyTxn>, 'rekeyTo', 'rekeyTo'>, 'sender' | 'note' | 'assetIndex' | 'suggestedParams' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeAssetFreezeTxnWithSuggestedParams(sender: AssetFreezeTxn['sender'], note: AssetFreezeTxn['note'], assetIndex: AssetFreezeTxn['assetIndex'], freezeTarget: AssetFreezeTxn['freezeAccount'], assetFrozen: AssetFreezeTxn['assetFrozen'], suggestedParams: MustHaveSuggestedParams<AssetFreezeTxn>['suggestedParams'], rekeyTo?: AssetFreezeTxn['rekeyTo']): txnBuilder.Transaction;
export declare function makeAssetFreezeTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AssetFreezeTxn>, {
    freezeAccount: 'freezeTarget';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'note' | 'assetIndex' | 'freezeTarget' | 'assetFrozen' | 'suggestedParams' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeAssetTransferTxnWithSuggestedParams(sender: AssetTransferTxn['sender'], receiver: AssetTransferTxn['receiver'], closeRemainderTo: AssetTransferTxn['closeRemainderTo'], assetSender: AssetTransferTxn['assetSender'], amount: AssetTransferTxn['amount'], note: AssetTransferTxn['note'], assetIndex: AssetTransferTxn['assetIndex'], suggestedParams: MustHaveSuggestedParams<AssetTransferTxn>['suggestedParams'], rekeyTo?: AssetTransferTxn['rekeyTo']): txnBuilder.Transaction;
export declare function makeAssetTransferTxnWithSuggestedParamsFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AssetTransferTxn>, {
    assetSender: 'assetSender';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'receiver' | 'closeRemainderTo' | 'assetSender' | 'amount' | 'note' | 'assetIndex' | 'suggestedParams' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeApplicationCreateTxn(sender: AppCreateTxn['sender'], suggestedParams: MustHaveSuggestedParams<AppCreateTxn>['suggestedParams'], onComplete: AppCreateTxn['appOnComplete'], approvalProgram: AppCreateTxn['appApprovalProgram'], clearProgram: AppCreateTxn['appClearProgram'], numLocalInts: AppCreateTxn['appLocalInts'], numLocalByteSlices: AppCreateTxn['appLocalByteSlices'], numGlobalInts: AppCreateTxn['appGlobalInts'], numGlobalByteSlices: AppCreateTxn['appGlobalByteSlices'], appArgs?: AppCreateTxn['appArgs'], accounts?: AppCreateTxn['appAccounts'], foreignApps?: AppCreateTxn['appForeignApps'], foreignAssets?: AppCreateTxn['appForeignAssets'], note?: AppCreateTxn['note'], lease?: AppCreateTxn['lease'], rekeyTo?: AppCreateTxn['rekeyTo'], extraPages?: AppCreateTxn['extraPages'], boxes?: AppCreateTxn['boxes']): txnBuilder.Transaction;
export declare function makeApplicationCreateTxnFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppCreateTxn>, {
    appOnComplete: 'onComplete';
    appApprovalProgram: 'approvalProgram';
    appClearProgram: 'clearProgram';
    appLocalInts: 'numLocalInts';
    appLocalByteSlices: 'numLocalByteSlices';
    appGlobalInts: 'numGlobalInts';
    appGlobalByteSlices: 'numGlobalByteSlices';
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'onComplete' | 'approvalProgram' | 'clearProgram' | 'numLocalInts' | 'numLocalByteSlices' | 'numGlobalInts' | 'numGlobalByteSlices' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo' | 'extraPages'>>): txnBuilder.Transaction;
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
export declare function makeApplicationUpdateTxn(sender: AppUpdateTxn['sender'], suggestedParams: MustHaveSuggestedParams<AppUpdateTxn>['suggestedParams'], appIndex: AppUpdateTxn['appIndex'], approvalProgram: AppUpdateTxn['appApprovalProgram'], clearProgram: AppUpdateTxn['appClearProgram'], appArgs?: AppUpdateTxn['appArgs'], accounts?: AppUpdateTxn['appAccounts'], foreignApps?: AppUpdateTxn['appForeignApps'], foreignAssets?: AppUpdateTxn['appForeignAssets'], note?: AppUpdateTxn['note'], lease?: AppUpdateTxn['lease'], rekeyTo?: AppUpdateTxn['rekeyTo'], boxes?: AppUpdateTxn['boxes']): txnBuilder.Transaction;
export declare function makeApplicationUpdateTxnFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppUpdateTxn>, {
    appApprovalProgram: 'approvalProgram';
    appClearProgram: 'clearProgram';
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'appIndex' | 'approvalProgram' | 'clearProgram' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeApplicationDeleteTxn(sender: AppDeleteTxn['sender'], suggestedParams: MustHaveSuggestedParams<AppDeleteTxn>['suggestedParams'], appIndex: AppDeleteTxn['appIndex'], appArgs?: AppDeleteTxn['appArgs'], accounts?: AppDeleteTxn['appAccounts'], foreignApps?: AppDeleteTxn['appForeignApps'], foreignAssets?: AppDeleteTxn['appForeignAssets'], note?: AppDeleteTxn['note'], lease?: AppDeleteTxn['lease'], rekeyTo?: AppDeleteTxn['rekeyTo'], boxes?: AppDeleteTxn['boxes']): txnBuilder.Transaction;
export declare function makeApplicationDeleteTxnFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppDeleteTxn>, {
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'appIndex' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeApplicationOptInTxn(sender: AppOptInTxn['sender'], suggestedParams: MustHaveSuggestedParams<AppOptInTxn>['suggestedParams'], appIndex: AppOptInTxn['appIndex'], appArgs?: AppOptInTxn['appArgs'], accounts?: AppOptInTxn['appAccounts'], foreignApps?: AppOptInTxn['appForeignApps'], foreignAssets?: AppOptInTxn['appForeignAssets'], note?: AppOptInTxn['note'], lease?: AppOptInTxn['lease'], rekeyTo?: AppOptInTxn['rekeyTo'], boxes?: AppOptInTxn['boxes']): txnBuilder.Transaction;
export declare function makeApplicationOptInTxnFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppOptInTxn>, {
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'appIndex' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeApplicationCloseOutTxn(sender: AppCloseOutTxn['sender'], suggestedParams: MustHaveSuggestedParams<AppCloseOutTxn>['suggestedParams'], appIndex: AppCloseOutTxn['appIndex'], appArgs?: AppCloseOutTxn['appArgs'], accounts?: AppCloseOutTxn['appAccounts'], foreignApps?: AppCloseOutTxn['appForeignApps'], foreignAssets?: AppCloseOutTxn['appForeignAssets'], note?: AppCloseOutTxn['note'], lease?: AppCloseOutTxn['lease'], rekeyTo?: AppCloseOutTxn['rekeyTo'], boxes?: AppCloseOutTxn['boxes']): txnBuilder.Transaction;
export declare function makeApplicationCloseOutTxnFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppOptInTxn>, {
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'appIndex' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeApplicationClearStateTxn(sender: AppClearStateTxn['sender'], suggestedParams: MustHaveSuggestedParams<AppClearStateTxn>['suggestedParams'], appIndex: AppClearStateTxn['appIndex'], appArgs?: AppClearStateTxn['appArgs'], accounts?: AppClearStateTxn['appAccounts'], foreignApps?: AppClearStateTxn['appForeignApps'], foreignAssets?: AppClearStateTxn['appForeignAssets'], note?: AppClearStateTxn['note'], lease?: AppClearStateTxn['lease'], rekeyTo?: AppClearStateTxn['rekeyTo'], boxes?: AppClearStateTxn['boxes']): txnBuilder.Transaction;
export declare function makeApplicationClearStateTxnFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppOptInTxn>, {
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'appIndex' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo'>>): txnBuilder.Transaction;
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
export declare function makeApplicationNoOpTxn(sender: AppNoOpTxn['sender'], suggestedParams: MustHaveSuggestedParams<AppNoOpTxn>['suggestedParams'], appIndex: AppNoOpTxn['appIndex'], appArgs?: AppNoOpTxn['appArgs'], accounts?: AppNoOpTxn['appAccounts'], foreignApps?: AppNoOpTxn['appForeignApps'], foreignAssets?: AppNoOpTxn['appForeignAssets'], note?: AppNoOpTxn['note'], lease?: AppNoOpTxn['lease'], rekeyTo?: AppNoOpTxn['rekeyTo'], boxes?: AppNoOpTxn['boxes']): txnBuilder.Transaction;
export declare function makeApplicationNoOpTxnFromObject(o: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppOptInTxn>, {
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'appIndex' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo'>>): txnBuilder.Transaction;
export { OnApplicationComplete } from './types/transactions/base';
/**
 * Generic function for creating any application call transaction.
 */
export declare function makeApplicationCallTxnFromObject(options: Expand<Pick<RenameProperties<MustHaveSuggestedParams<AppCreateTxn>, {
    appOnComplete: 'onComplete';
    appAccounts: 'accounts';
    appForeignApps: 'foreignApps';
    appForeignAssets: 'foreignAssets';
    rekeyTo: 'rekeyTo';
}>, 'sender' | 'suggestedParams' | 'appIndex' | 'onComplete' | 'appArgs' | 'accounts' | 'foreignApps' | 'foreignAssets' | 'boxes' | 'note' | 'lease' | 'rekeyTo' | 'extraPages'> & Partial<Pick<RenameProperties<MustHaveSuggestedParams<AppCreateTxn>, {
    appApprovalProgram: 'approvalProgram';
    appClearProgram: 'clearProgram';
    appLocalInts: 'numLocalInts';
    appLocalByteSlices: 'numLocalByteSlices';
    appGlobalInts: 'numGlobalInts';
    appGlobalByteSlices: 'numGlobalByteSlices';
}>, 'approvalProgram' | 'clearProgram' | 'numLocalInts' | 'numLocalByteSlices' | 'numGlobalInts' | 'numGlobalByteSlices'>>>): txnBuilder.Transaction;
