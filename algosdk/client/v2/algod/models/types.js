"use strict";
/**
 * NOTICE: This file was generated. Editing this file manually is not recommended.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulateRequestTransactionGroup = exports.SimulateRequest = exports.SimulateInitialStates = exports.ScratchChange = exports.PostTransactionsResponse = exports.PendingTransactionsResponse = exports.PendingTransactionResponse = exports.NodeStatusResponse = exports.LightBlockHeaderProof = exports.LedgerStateDeltaForTransactionGroup = exports.KvDelta = exports.GetSyncRoundResponse = exports.GetBlockTimeStampOffsetResponse = exports.EvalDeltaKeyValue = exports.EvalDelta = exports.ErrorResponse = exports.DryrunTxnResult = exports.DryrunState = exports.DryrunSource = exports.DryrunResponse = exports.DryrunRequest = exports.DisassembleResponse = exports.CompileResponse = exports.BuildVersion = exports.BoxesResponse = exports.BoxReference = exports.BoxDescriptor = exports.Box = exports.BlockTxidsResponse = exports.BlockResponse = exports.BlockHashResponse = exports.AvmValue = exports.AvmKeyValue = exports.AssetParams = exports.AssetHoldingReference = exports.AssetHolding = exports.Asset = exports.ApplicationStateSchema = exports.ApplicationStateOperation = exports.ApplicationParams = exports.ApplicationLocalState = exports.ApplicationLocalReference = exports.ApplicationKVStorage = exports.ApplicationInitialStates = exports.Application = exports.AccountStateDelta = exports.AccountParticipation = exports.AccountAssetResponse = exports.AccountApplicationResponse = exports.Account = void 0;
exports.Version = exports.TransactionProofResponse = exports.TransactionParametersResponse = exports.TransactionGroupLedgerStateDeltasForRoundResponse = exports.TealValue = exports.TealKeyValue = exports.SupplyResponse = exports.StateProofMessage = exports.StateProof = exports.SimulationTransactionExecTrace = exports.SimulationOpcodeTraceUnit = exports.SimulationEvalOverrides = exports.SimulateUnnamedResourcesAccessed = exports.SimulateTransactionResult = exports.SimulateTransactionGroupResult = exports.SimulateTraceConfig = exports.SimulateResponse = void 0;
/* eslint-disable no-use-before-define */
const binarydata_1 = require("../../../../encoding/binarydata");
const basemodel_1 = __importDefault(require("../../basemodel"));
/**
 * Account information at a given round.
 * Definition:
 * data/basics/userBalance.go : AccountData
 */
class Account extends basemodel_1.default {
    /**
     * Creates a new `Account` object.
     * @param address - the account public key
     * @param amount - (algo) total number of MicroAlgos in the account
     * @param amountWithoutPendingRewards - specifies the amount of MicroAlgos in the account, without the pending rewards.
     * @param minBalance - MicroAlgo balance required by the account.
     * The requirement grows based on asset and application usage.
     * @param pendingRewards - amount of MicroAlgos of pending rewards in this account.
     * @param rewards - (ern) total rewards of MicroAlgos the account has received, including pending
     * rewards.
     * @param round - The round for which this information is relevant.
     * @param status - (onl) delegation status of the account's MicroAlgos
     * * Offline - indicates that the associated account is delegated.
     * * Online - indicates that the associated account used as part of the delegation
     * pool.
     * * NotParticipating - indicates that the associated account is neither a
     * delegator nor a delegate.
     * @param totalAppsOptedIn - The count of all applications that have been opted in, equivalent to the count
     * of application local data (AppLocalState objects) stored in this account.
     * @param totalAssetsOptedIn - The count of all assets that have been opted in, equivalent to the count of
     * AssetHolding objects held by this account.
     * @param totalCreatedApps - The count of all apps (AppParams objects) created by this account.
     * @param totalCreatedAssets - The count of all assets (AssetParams objects) created by this account.
     * @param appsLocalState - (appl) applications local data stored in this account.
     * Note the raw object uses `map[int] -> AppLocalState` for this type.
     * @param appsTotalExtraPages - (teap) the sum of all extra application program pages for this account.
     * @param appsTotalSchema - (tsch) stores the sum of all of the local schemas and global schemas in this
     * account.
     * Note: the raw account uses `StateSchema` for this type.
     * @param assets - (asset) assets held by this account.
     * Note the raw object uses `map[int] -> AssetHolding` for this type.
     * @param authAddr - (spend) the address against which signing should be checked. If empty, the
     * address of the current account is used. This field can be updated in any
     * transaction by setting the RekeyTo field.
     * @param createdApps - (appp) parameters of applications created by this account including app global
     * data.
     * Note: the raw account uses `map[int] -> AppParams` for this type.
     * @param createdAssets - (apar) parameters of assets created by this account.
     * Note: the raw account uses `map[int] -> Asset` for this type.
     * @param participation - AccountParticipation describes the parameters used by this account in consensus
     * protocol.
     * @param rewardBase - (ebase) used as part of the rewards computation. Only applicable to accounts
     * which are participating.
     * @param sigType - Indicates what type of signature is used by this account, must be one of:
     * * sig
     * * msig
     * * lsig
     * @param totalBoxBytes - (tbxb) The total number of bytes used by this account's app's box keys and
     * values.
     * @param totalBoxes - (tbx) The number of existing boxes created by this account's app.
     */
    constructor({ address, amount, amountWithoutPendingRewards, minBalance, pendingRewards, rewards, round, status, totalAppsOptedIn, totalAssetsOptedIn, totalCreatedApps, totalCreatedAssets, appsLocalState, appsTotalExtraPages, appsTotalSchema, assets, authAddr, createdApps, createdAssets, participation, rewardBase, sigType, totalBoxBytes, totalBoxes, }) {
        super();
        this.address = address;
        this.amount = amount;
        this.amountWithoutPendingRewards = amountWithoutPendingRewards;
        this.minBalance = minBalance;
        this.pendingRewards = pendingRewards;
        this.rewards = rewards;
        this.round = round;
        this.status = status;
        this.totalAppsOptedIn = totalAppsOptedIn;
        this.totalAssetsOptedIn = totalAssetsOptedIn;
        this.totalCreatedApps = totalCreatedApps;
        this.totalCreatedAssets = totalCreatedAssets;
        this.appsLocalState = appsLocalState;
        this.appsTotalExtraPages = appsTotalExtraPages;
        this.appsTotalSchema = appsTotalSchema;
        this.assets = assets;
        this.authAddr = authAddr;
        this.createdApps = createdApps;
        this.createdAssets = createdAssets;
        this.participation = participation;
        this.rewardBase = rewardBase;
        this.sigType = sigType;
        this.totalBoxBytes = totalBoxBytes;
        this.totalBoxes = totalBoxes;
        this.attribute_map = {
            address: 'address',
            amount: 'amount',
            amountWithoutPendingRewards: 'amount-without-pending-rewards',
            minBalance: 'min-balance',
            pendingRewards: 'pending-rewards',
            rewards: 'rewards',
            round: 'round',
            status: 'status',
            totalAppsOptedIn: 'total-apps-opted-in',
            totalAssetsOptedIn: 'total-assets-opted-in',
            totalCreatedApps: 'total-created-apps',
            totalCreatedAssets: 'total-created-assets',
            appsLocalState: 'apps-local-state',
            appsTotalExtraPages: 'apps-total-extra-pages',
            appsTotalSchema: 'apps-total-schema',
            assets: 'assets',
            authAddr: 'auth-addr',
            createdApps: 'created-apps',
            createdAssets: 'created-assets',
            participation: 'participation',
            rewardBase: 'reward-base',
            sigType: 'sig-type',
            totalBoxBytes: 'total-box-bytes',
            totalBoxes: 'total-boxes',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['address'] === 'undefined')
            throw new Error(`Response is missing required field 'address': ${data}`);
        if (typeof data['amount'] === 'undefined')
            throw new Error(`Response is missing required field 'amount': ${data}`);
        if (typeof data['amount-without-pending-rewards'] === 'undefined')
            throw new Error(`Response is missing required field 'amount-without-pending-rewards': ${data}`);
        if (typeof data['min-balance'] === 'undefined')
            throw new Error(`Response is missing required field 'min-balance': ${data}`);
        if (typeof data['pending-rewards'] === 'undefined')
            throw new Error(`Response is missing required field 'pending-rewards': ${data}`);
        if (typeof data['rewards'] === 'undefined')
            throw new Error(`Response is missing required field 'rewards': ${data}`);
        if (typeof data['round'] === 'undefined')
            throw new Error(`Response is missing required field 'round': ${data}`);
        if (typeof data['status'] === 'undefined')
            throw new Error(`Response is missing required field 'status': ${data}`);
        if (typeof data['total-apps-opted-in'] === 'undefined')
            throw new Error(`Response is missing required field 'total-apps-opted-in': ${data}`);
        if (typeof data['total-assets-opted-in'] === 'undefined')
            throw new Error(`Response is missing required field 'total-assets-opted-in': ${data}`);
        if (typeof data['total-created-apps'] === 'undefined')
            throw new Error(`Response is missing required field 'total-created-apps': ${data}`);
        if (typeof data['total-created-assets'] === 'undefined')
            throw new Error(`Response is missing required field 'total-created-assets': ${data}`);
        return new Account({
            address: data['address'],
            amount: data['amount'],
            amountWithoutPendingRewards: data['amount-without-pending-rewards'],
            minBalance: data['min-balance'],
            pendingRewards: data['pending-rewards'],
            rewards: data['rewards'],
            round: data['round'],
            status: data['status'],
            totalAppsOptedIn: data['total-apps-opted-in'],
            totalAssetsOptedIn: data['total-assets-opted-in'],
            totalCreatedApps: data['total-created-apps'],
            totalCreatedAssets: data['total-created-assets'],
            appsLocalState: typeof data['apps-local-state'] !== 'undefined'
                ? data['apps-local-state'].map(ApplicationLocalState.from_obj_for_encoding)
                : undefined,
            appsTotalExtraPages: data['apps-total-extra-pages'],
            appsTotalSchema: typeof data['apps-total-schema'] !== 'undefined'
                ? ApplicationStateSchema.from_obj_for_encoding(data['apps-total-schema'])
                : undefined,
            assets: typeof data['assets'] !== 'undefined'
                ? data['assets'].map(AssetHolding.from_obj_for_encoding)
                : undefined,
            authAddr: data['auth-addr'],
            createdApps: typeof data['created-apps'] !== 'undefined'
                ? data['created-apps'].map(Application.from_obj_for_encoding)
                : undefined,
            createdAssets: typeof data['created-assets'] !== 'undefined'
                ? data['created-assets'].map(Asset.from_obj_for_encoding)
                : undefined,
            participation: typeof data['participation'] !== 'undefined'
                ? AccountParticipation.from_obj_for_encoding(data['participation'])
                : undefined,
            rewardBase: data['reward-base'],
            sigType: data['sig-type'],
            totalBoxBytes: data['total-box-bytes'],
            totalBoxes: data['total-boxes'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.Account = Account;
/**
 * AccountApplicationResponse describes the account's application local state and
 * global state (AppLocalState and AppParams, if either exists) for a specific
 * application ID. Global state will only be returned if the provided address is
 * the application's creator.
 */
class AccountApplicationResponse extends basemodel_1.default {
    /**
     * Creates a new `AccountApplicationResponse` object.
     * @param round - The round for which this information is relevant.
     * @param appLocalState - (appl) the application local data stored in this account.
     * The raw account uses `AppLocalState` for this type.
     * @param createdApp - (appp) parameters of the application created by this account including app
     * global data.
     * The raw account uses `AppParams` for this type.
     */
    constructor({ round, appLocalState, createdApp, }) {
        super();
        this.round = round;
        this.appLocalState = appLocalState;
        this.createdApp = createdApp;
        this.attribute_map = {
            round: 'round',
            appLocalState: 'app-local-state',
            createdApp: 'created-app',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['round'] === 'undefined')
            throw new Error(`Response is missing required field 'round': ${data}`);
        return new AccountApplicationResponse({
            round: data['round'],
            appLocalState: typeof data['app-local-state'] !== 'undefined'
                ? ApplicationLocalState.from_obj_for_encoding(data['app-local-state'])
                : undefined,
            createdApp: typeof data['created-app'] !== 'undefined'
                ? ApplicationParams.from_obj_for_encoding(data['created-app'])
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.AccountApplicationResponse = AccountApplicationResponse;
/**
 * AccountAssetResponse describes the account's asset holding and asset parameters
 * (if either exist) for a specific asset ID. Asset parameters will only be
 * returned if the provided address is the asset's creator.
 */
class AccountAssetResponse extends basemodel_1.default {
    /**
     * Creates a new `AccountAssetResponse` object.
     * @param round - The round for which this information is relevant.
     * @param assetHolding - (asset) Details about the asset held by this account.
     * The raw account uses `AssetHolding` for this type.
     * @param createdAsset - (apar) parameters of the asset created by this account.
     * The raw account uses `AssetParams` for this type.
     */
    constructor({ round, assetHolding, createdAsset, }) {
        super();
        this.round = round;
        this.assetHolding = assetHolding;
        this.createdAsset = createdAsset;
        this.attribute_map = {
            round: 'round',
            assetHolding: 'asset-holding',
            createdAsset: 'created-asset',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['round'] === 'undefined')
            throw new Error(`Response is missing required field 'round': ${data}`);
        return new AccountAssetResponse({
            round: data['round'],
            assetHolding: typeof data['asset-holding'] !== 'undefined'
                ? AssetHolding.from_obj_for_encoding(data['asset-holding'])
                : undefined,
            createdAsset: typeof data['created-asset'] !== 'undefined'
                ? AssetParams.from_obj_for_encoding(data['created-asset'])
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.AccountAssetResponse = AccountAssetResponse;
/**
 * AccountParticipation describes the parameters used by this account in consensus
 * protocol.
 */
class AccountParticipation extends basemodel_1.default {
    /**
     * Creates a new `AccountParticipation` object.
     * @param selectionParticipationKey - (sel) Selection public key (if any) currently registered for this round.
     * @param voteFirstValid - (voteFst) First round for which this participation is valid.
     * @param voteKeyDilution - (voteKD) Number of subkeys in each batch of participation keys.
     * @param voteLastValid - (voteLst) Last round for which this participation is valid.
     * @param voteParticipationKey - (vote) root participation public key (if any) currently registered for this
     * round.
     * @param stateProofKey - (stprf) Root of the state proof key (if any)
     */
    constructor({ selectionParticipationKey, voteFirstValid, voteKeyDilution, voteLastValid, voteParticipationKey, stateProofKey, }) {
        super();
        this.selectionParticipationKey =
            typeof selectionParticipationKey === 'string'
                ? (0, binarydata_1.base64ToBytes)(selectionParticipationKey)
                : selectionParticipationKey;
        this.voteFirstValid = voteFirstValid;
        this.voteKeyDilution = voteKeyDilution;
        this.voteLastValid = voteLastValid;
        this.voteParticipationKey =
            typeof voteParticipationKey === 'string'
                ? (0, binarydata_1.base64ToBytes)(voteParticipationKey)
                : voteParticipationKey;
        this.stateProofKey =
            typeof stateProofKey === 'string'
                ? (0, binarydata_1.base64ToBytes)(stateProofKey)
                : stateProofKey;
        this.attribute_map = {
            selectionParticipationKey: 'selection-participation-key',
            voteFirstValid: 'vote-first-valid',
            voteKeyDilution: 'vote-key-dilution',
            voteLastValid: 'vote-last-valid',
            voteParticipationKey: 'vote-participation-key',
            stateProofKey: 'state-proof-key',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['selection-participation-key'] === 'undefined')
            throw new Error(`Response is missing required field 'selection-participation-key': ${data}`);
        if (typeof data['vote-first-valid'] === 'undefined')
            throw new Error(`Response is missing required field 'vote-first-valid': ${data}`);
        if (typeof data['vote-key-dilution'] === 'undefined')
            throw new Error(`Response is missing required field 'vote-key-dilution': ${data}`);
        if (typeof data['vote-last-valid'] === 'undefined')
            throw new Error(`Response is missing required field 'vote-last-valid': ${data}`);
        if (typeof data['vote-participation-key'] === 'undefined')
            throw new Error(`Response is missing required field 'vote-participation-key': ${data}`);
        return new AccountParticipation({
            selectionParticipationKey: data['selection-participation-key'],
            voteFirstValid: data['vote-first-valid'],
            voteKeyDilution: data['vote-key-dilution'],
            voteLastValid: data['vote-last-valid'],
            voteParticipationKey: data['vote-participation-key'],
            stateProofKey: data['state-proof-key'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.AccountParticipation = AccountParticipation;
/**
 * Application state delta.
 */
class AccountStateDelta extends basemodel_1.default {
    /**
     * Creates a new `AccountStateDelta` object.
     * @param address -
     * @param delta - Application state delta.
     */
    constructor({ address, delta, }) {
        super();
        this.address = address;
        this.delta = delta;
        this.attribute_map = {
            address: 'address',
            delta: 'delta',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['address'] === 'undefined')
            throw new Error(`Response is missing required field 'address': ${data}`);
        if (!Array.isArray(data['delta']))
            throw new Error(`Response is missing required array field 'delta': ${data}`);
        return new AccountStateDelta({
            address: data['address'],
            delta: data['delta'].map(EvalDeltaKeyValue.from_obj_for_encoding),
        });
        /* eslint-enable dot-notation */
    }
}
exports.AccountStateDelta = AccountStateDelta;
/**
 * Application index and its parameters
 */
class Application extends basemodel_1.default {
    /**
     * Creates a new `Application` object.
     * @param id - (appidx) application index.
     * @param params - (appparams) application parameters.
     */
    constructor({ id, params, }) {
        super();
        this.id = id;
        this.params = params;
        this.attribute_map = {
            id: 'id',
            params: 'params',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['id'] === 'undefined')
            throw new Error(`Response is missing required field 'id': ${data}`);
        if (typeof data['params'] === 'undefined')
            throw new Error(`Response is missing required field 'params': ${data}`);
        return new Application({
            id: data['id'],
            params: ApplicationParams.from_obj_for_encoding(data['params']),
        });
        /* eslint-enable dot-notation */
    }
}
exports.Application = Application;
/**
 * An application's initial global/local/box states that were accessed during
 * simulation.
 */
class ApplicationInitialStates extends basemodel_1.default {
    /**
     * Creates a new `ApplicationInitialStates` object.
     * @param id - Application index.
     * @param appBoxes - An application's global/local/box state.
     * @param appGlobals - An application's global/local/box state.
     * @param appLocals - An application's initial local states tied to different accounts.
     */
    constructor({ id, appBoxes, appGlobals, appLocals, }) {
        super();
        this.id = id;
        this.appBoxes = appBoxes;
        this.appGlobals = appGlobals;
        this.appLocals = appLocals;
        this.attribute_map = {
            id: 'id',
            appBoxes: 'app-boxes',
            appGlobals: 'app-globals',
            appLocals: 'app-locals',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['id'] === 'undefined')
            throw new Error(`Response is missing required field 'id': ${data}`);
        return new ApplicationInitialStates({
            id: data['id'],
            appBoxes: typeof data['app-boxes'] !== 'undefined'
                ? ApplicationKVStorage.from_obj_for_encoding(data['app-boxes'])
                : undefined,
            appGlobals: typeof data['app-globals'] !== 'undefined'
                ? ApplicationKVStorage.from_obj_for_encoding(data['app-globals'])
                : undefined,
            appLocals: typeof data['app-locals'] !== 'undefined'
                ? data['app-locals'].map(ApplicationKVStorage.from_obj_for_encoding)
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.ApplicationInitialStates = ApplicationInitialStates;
/**
 * An application's global/local/box state.
 */
class ApplicationKVStorage extends basemodel_1.default {
    /**
     * Creates a new `ApplicationKVStorage` object.
     * @param kvs - Key-Value pairs representing application states.
     * @param account - The address of the account associated with the local state.
     */
    constructor({ kvs, account }) {
        super();
        this.kvs = kvs;
        this.account = account;
        this.attribute_map = {
            kvs: 'kvs',
            account: 'account',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['kvs']))
            throw new Error(`Response is missing required array field 'kvs': ${data}`);
        return new ApplicationKVStorage({
            kvs: data['kvs'].map(AvmKeyValue.from_obj_for_encoding),
            account: data['account'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.ApplicationKVStorage = ApplicationKVStorage;
/**
 * References an account's local state for an application.
 */
class ApplicationLocalReference extends basemodel_1.default {
    /**
     * Creates a new `ApplicationLocalReference` object.
     * @param account - Address of the account with the local state.
     * @param app - Application ID of the local state application.
     */
    constructor({ account, app }) {
        super();
        this.account = account;
        this.app = app;
        this.attribute_map = {
            account: 'account',
            app: 'app',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['account'] === 'undefined')
            throw new Error(`Response is missing required field 'account': ${data}`);
        if (typeof data['app'] === 'undefined')
            throw new Error(`Response is missing required field 'app': ${data}`);
        return new ApplicationLocalReference({
            account: data['account'],
            app: data['app'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.ApplicationLocalReference = ApplicationLocalReference;
/**
 * Stores local state associated with an application.
 */
class ApplicationLocalState extends basemodel_1.default {
    /**
     * Creates a new `ApplicationLocalState` object.
     * @param id - The application which this local state is for.
     * @param schema - (hsch) schema.
     * @param keyValue - (tkv) storage.
     */
    constructor({ id, schema, keyValue, }) {
        super();
        this.id = id;
        this.schema = schema;
        this.keyValue = keyValue;
        this.attribute_map = {
            id: 'id',
            schema: 'schema',
            keyValue: 'key-value',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['id'] === 'undefined')
            throw new Error(`Response is missing required field 'id': ${data}`);
        if (typeof data['schema'] === 'undefined')
            throw new Error(`Response is missing required field 'schema': ${data}`);
        return new ApplicationLocalState({
            id: data['id'],
            schema: ApplicationStateSchema.from_obj_for_encoding(data['schema']),
            keyValue: typeof data['key-value'] !== 'undefined'
                ? data['key-value'].map(TealKeyValue.from_obj_for_encoding)
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.ApplicationLocalState = ApplicationLocalState;
/**
 * Stores the global information associated with an application.
 */
class ApplicationParams extends basemodel_1.default {
    /**
     * Creates a new `ApplicationParams` object.
     * @param approvalProgram - (approv) approval program.
     * @param clearStateProgram - (clearp) approval program.
     * @param creator - The address that created this application. This is the address where the
     * parameters and global state for this application can be found.
     * @param extraProgramPages - (epp) the amount of extra program pages available to this app.
     * @param globalState - (gs) global state
     * @param globalStateSchema - (gsch) global schema
     * @param localStateSchema - (lsch) local schema
     */
    constructor({ approvalProgram, clearStateProgram, creator, extraProgramPages, globalState, globalStateSchema, localStateSchema, }) {
        super();
        this.approvalProgram =
            typeof approvalProgram === 'string'
                ? (0, binarydata_1.base64ToBytes)(approvalProgram)
                : approvalProgram;
        this.clearStateProgram =
            typeof clearStateProgram === 'string'
                ? (0, binarydata_1.base64ToBytes)(clearStateProgram)
                : clearStateProgram;
        this.creator = creator;
        this.extraProgramPages = extraProgramPages;
        this.globalState = globalState;
        this.globalStateSchema = globalStateSchema;
        this.localStateSchema = localStateSchema;
        this.attribute_map = {
            approvalProgram: 'approval-program',
            clearStateProgram: 'clear-state-program',
            creator: 'creator',
            extraProgramPages: 'extra-program-pages',
            globalState: 'global-state',
            globalStateSchema: 'global-state-schema',
            localStateSchema: 'local-state-schema',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['approval-program'] === 'undefined')
            throw new Error(`Response is missing required field 'approval-program': ${data}`);
        if (typeof data['clear-state-program'] === 'undefined')
            throw new Error(`Response is missing required field 'clear-state-program': ${data}`);
        if (typeof data['creator'] === 'undefined')
            throw new Error(`Response is missing required field 'creator': ${data}`);
        return new ApplicationParams({
            approvalProgram: data['approval-program'],
            clearStateProgram: data['clear-state-program'],
            creator: data['creator'],
            extraProgramPages: data['extra-program-pages'],
            globalState: typeof data['global-state'] !== 'undefined'
                ? data['global-state'].map(TealKeyValue.from_obj_for_encoding)
                : undefined,
            globalStateSchema: typeof data['global-state-schema'] !== 'undefined'
                ? ApplicationStateSchema.from_obj_for_encoding(data['global-state-schema'])
                : undefined,
            localStateSchema: typeof data['local-state-schema'] !== 'undefined'
                ? ApplicationStateSchema.from_obj_for_encoding(data['local-state-schema'])
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.ApplicationParams = ApplicationParams;
/**
 * An operation against an application's global/local/box state.
 */
class ApplicationStateOperation extends basemodel_1.default {
    /**
     * Creates a new `ApplicationStateOperation` object.
     * @param appStateType - Type of application state. Value `g` is **global state**, `l` is **local
     * state**, `b` is **boxes**.
     * @param key - The key (name) of the global/local/box state.
     * @param operation - Operation type. Value `w` is **write**, `d` is **delete**.
     * @param account - For local state changes, the address of the account associated with the local
     * state.
     * @param newValue - Represents an AVM value.
     */
    constructor({ appStateType, key, operation, account, newValue, }) {
        super();
        this.appStateType = appStateType;
        this.key = typeof key === 'string' ? (0, binarydata_1.base64ToBytes)(key) : key;
        this.operation = operation;
        this.account = account;
        this.newValue = newValue;
        this.attribute_map = {
            appStateType: 'app-state-type',
            key: 'key',
            operation: 'operation',
            account: 'account',
            newValue: 'new-value',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['app-state-type'] === 'undefined')
            throw new Error(`Response is missing required field 'app-state-type': ${data}`);
        if (typeof data['key'] === 'undefined')
            throw new Error(`Response is missing required field 'key': ${data}`);
        if (typeof data['operation'] === 'undefined')
            throw new Error(`Response is missing required field 'operation': ${data}`);
        return new ApplicationStateOperation({
            appStateType: data['app-state-type'],
            key: data['key'],
            operation: data['operation'],
            account: data['account'],
            newValue: typeof data['new-value'] !== 'undefined'
                ? AvmValue.from_obj_for_encoding(data['new-value'])
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.ApplicationStateOperation = ApplicationStateOperation;
/**
 * Specifies maximums on the number of each type that may be stored.
 */
class ApplicationStateSchema extends basemodel_1.default {
    /**
     * Creates a new `ApplicationStateSchema` object.
     * @param numUint - (nui) num of uints.
     * @param numByteSlice - (nbs) num of byte slices.
     */
    constructor({ numUint, numByteSlice, }) {
        super();
        this.numUint = numUint;
        this.numByteSlice = numByteSlice;
        this.attribute_map = {
            numUint: 'num-uint',
            numByteSlice: 'num-byte-slice',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['num-uint'] === 'undefined')
            throw new Error(`Response is missing required field 'num-uint': ${data}`);
        if (typeof data['num-byte-slice'] === 'undefined')
            throw new Error(`Response is missing required field 'num-byte-slice': ${data}`);
        return new ApplicationStateSchema({
            numUint: data['num-uint'],
            numByteSlice: data['num-byte-slice'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.ApplicationStateSchema = ApplicationStateSchema;
/**
 * Specifies both the unique identifier and the parameters for an asset
 */
class Asset extends basemodel_1.default {
    /**
     * Creates a new `Asset` object.
     * @param index - unique asset identifier
     * @param params - AssetParams specifies the parameters for an asset.
     * (apar) when part of an AssetConfig transaction.
     * Definition:
     * data/transactions/asset.go : AssetParams
     */
    constructor({ index, params, }) {
        super();
        this.index = index;
        this.params = params;
        this.attribute_map = {
            index: 'index',
            params: 'params',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['index'] === 'undefined')
            throw new Error(`Response is missing required field 'index': ${data}`);
        if (typeof data['params'] === 'undefined')
            throw new Error(`Response is missing required field 'params': ${data}`);
        return new Asset({
            index: data['index'],
            params: AssetParams.from_obj_for_encoding(data['params']),
        });
        /* eslint-enable dot-notation */
    }
}
exports.Asset = Asset;
/**
 * Describes an asset held by an account.
 * Definition:
 * data/basics/userBalance.go : AssetHolding
 */
class AssetHolding extends basemodel_1.default {
    /**
     * Creates a new `AssetHolding` object.
     * @param amount - (a) number of units held.
     * @param assetId - Asset ID of the holding.
     * @param isFrozen - (f) whether or not the holding is frozen.
     */
    constructor({ amount, assetId, isFrozen, }) {
        super();
        this.amount = amount;
        this.assetId = assetId;
        this.isFrozen = isFrozen;
        this.attribute_map = {
            amount: 'amount',
            assetId: 'asset-id',
            isFrozen: 'is-frozen',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['amount'] === 'undefined')
            throw new Error(`Response is missing required field 'amount': ${data}`);
        if (typeof data['asset-id'] === 'undefined')
            throw new Error(`Response is missing required field 'asset-id': ${data}`);
        if (typeof data['is-frozen'] === 'undefined')
            throw new Error(`Response is missing required field 'is-frozen': ${data}`);
        return new AssetHolding({
            amount: data['amount'],
            assetId: data['asset-id'],
            isFrozen: data['is-frozen'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.AssetHolding = AssetHolding;
/**
 * References an asset held by an account.
 */
class AssetHoldingReference extends basemodel_1.default {
    /**
     * Creates a new `AssetHoldingReference` object.
     * @param account - Address of the account holding the asset.
     * @param asset - Asset ID of the holding.
     */
    constructor({ account, asset }) {
        super();
        this.account = account;
        this.asset = asset;
        this.attribute_map = {
            account: 'account',
            asset: 'asset',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['account'] === 'undefined')
            throw new Error(`Response is missing required field 'account': ${data}`);
        if (typeof data['asset'] === 'undefined')
            throw new Error(`Response is missing required field 'asset': ${data}`);
        return new AssetHoldingReference({
            account: data['account'],
            asset: data['asset'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.AssetHoldingReference = AssetHoldingReference;
/**
 * AssetParams specifies the parameters for an asset.
 * (apar) when part of an AssetConfig transaction.
 * Definition:
 * data/transactions/asset.go : AssetParams
 */
class AssetParams extends basemodel_1.default {
    /**
     * Creates a new `AssetParams` object.
     * @param creator - The address that created this asset. This is the address where the parameters
     * for this asset can be found, and also the address where unwanted asset units can
     * be sent in the worst case.
     * @param decimals - (dc) The number of digits to use after the decimal point when displaying this
     * asset. If 0, the asset is not divisible. If 1, the base unit of the asset is in
     * tenths. If 2, the base unit of the asset is in hundredths, and so on. This value
     * must be between 0 and 19 (inclusive).
     * @param total - (t) The total number of units of this asset.
     * @param clawback - (c) Address of account used to clawback holdings of this asset. If empty,
     * clawback is not permitted.
     * @param defaultFrozen - (df) Whether holdings of this asset are frozen by default.
     * @param freeze - (f) Address of account used to freeze holdings of this asset. If empty, freezing
     * is not permitted.
     * @param manager - (m) Address of account used to manage the keys of this asset and to destroy it.
     * @param metadataHash - (am) A commitment to some unspecified asset metadata. The format of this
     * metadata is up to the application.
     * @param name - (an) Name of this asset, as supplied by the creator. Included only when the
     * asset name is composed of printable utf-8 characters.
     * @param nameB64 - Base64 encoded name of this asset, as supplied by the creator.
     * @param reserve - (r) Address of account holding reserve (non-minted) units of this asset.
     * @param unitName - (un) Name of a unit of this asset, as supplied by the creator. Included only
     * when the name of a unit of this asset is composed of printable utf-8 characters.
     * @param unitNameB64 - Base64 encoded name of a unit of this asset, as supplied by the creator.
     * @param url - (au) URL where more information about the asset can be retrieved. Included only
     * when the URL is composed of printable utf-8 characters.
     * @param urlB64 - Base64 encoded URL where more information about the asset can be retrieved.
     */
    constructor({ creator, decimals, total, clawback, defaultFrozen, freeze, manager, metadataHash, name, nameB64, reserve, unitName, unitNameB64, url, urlB64, }) {
        super();
        this.creator = creator;
        this.decimals = decimals;
        this.total = total;
        this.clawback = clawback;
        this.defaultFrozen = defaultFrozen;
        this.freeze = freeze;
        this.manager = manager;
        this.metadataHash =
            typeof metadataHash === 'string'
                ? (0, binarydata_1.base64ToBytes)(metadataHash)
                : metadataHash;
        this.name = name;
        this.nameB64 =
            typeof nameB64 === 'string' ? (0, binarydata_1.base64ToBytes)(nameB64) : nameB64;
        this.reserve = reserve;
        this.unitName = unitName;
        this.unitNameB64 =
            typeof unitNameB64 === 'string'
                ? (0, binarydata_1.base64ToBytes)(unitNameB64)
                : unitNameB64;
        this.url = url;
        this.urlB64 = typeof urlB64 === 'string' ? (0, binarydata_1.base64ToBytes)(urlB64) : urlB64;
        this.attribute_map = {
            creator: 'creator',
            decimals: 'decimals',
            total: 'total',
            clawback: 'clawback',
            defaultFrozen: 'default-frozen',
            freeze: 'freeze',
            manager: 'manager',
            metadataHash: 'metadata-hash',
            name: 'name',
            nameB64: 'name-b64',
            reserve: 'reserve',
            unitName: 'unit-name',
            unitNameB64: 'unit-name-b64',
            url: 'url',
            urlB64: 'url-b64',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['creator'] === 'undefined')
            throw new Error(`Response is missing required field 'creator': ${data}`);
        if (typeof data['decimals'] === 'undefined')
            throw new Error(`Response is missing required field 'decimals': ${data}`);
        if (typeof data['total'] === 'undefined')
            throw new Error(`Response is missing required field 'total': ${data}`);
        return new AssetParams({
            creator: data['creator'],
            decimals: data['decimals'],
            total: data['total'],
            clawback: data['clawback'],
            defaultFrozen: data['default-frozen'],
            freeze: data['freeze'],
            manager: data['manager'],
            metadataHash: data['metadata-hash'],
            name: data['name'],
            nameB64: data['name-b64'],
            reserve: data['reserve'],
            unitName: data['unit-name'],
            unitNameB64: data['unit-name-b64'],
            url: data['url'],
            urlB64: data['url-b64'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.AssetParams = AssetParams;
/**
 * Represents an AVM key-value pair in an application store.
 */
class AvmKeyValue extends basemodel_1.default {
    /**
     * Creates a new `AvmKeyValue` object.
     * @param key -
     * @param value - Represents an AVM value.
     */
    constructor({ key, value }) {
        super();
        this.key = typeof key === 'string' ? (0, binarydata_1.base64ToBytes)(key) : key;
        this.value = value;
        this.attribute_map = {
            key: 'key',
            value: 'value',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['key'] === 'undefined')
            throw new Error(`Response is missing required field 'key': ${data}`);
        if (typeof data['value'] === 'undefined')
            throw new Error(`Response is missing required field 'value': ${data}`);
        return new AvmKeyValue({
            key: data['key'],
            value: AvmValue.from_obj_for_encoding(data['value']),
        });
        /* eslint-enable dot-notation */
    }
}
exports.AvmKeyValue = AvmKeyValue;
/**
 * Represents an AVM value.
 */
class AvmValue extends basemodel_1.default {
    /**
     * Creates a new `AvmValue` object.
     * @param type - value type. Value `1` refers to **bytes**, value `2` refers to **uint64**
     * @param bytes - bytes value.
     * @param uint - uint value.
     */
    constructor({ type, bytes, uint, }) {
        super();
        this.type = type;
        this.bytes = typeof bytes === 'string' ? (0, binarydata_1.base64ToBytes)(bytes) : bytes;
        this.uint = uint;
        this.attribute_map = {
            type: 'type',
            bytes: 'bytes',
            uint: 'uint',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['type'] === 'undefined')
            throw new Error(`Response is missing required field 'type': ${data}`);
        return new AvmValue({
            type: data['type'],
            bytes: data['bytes'],
            uint: data['uint'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.AvmValue = AvmValue;
/**
 * Hash of a block header.
 */
class BlockHashResponse extends basemodel_1.default {
    /**
     * Creates a new `BlockHashResponse` object.
     * @param blockhash - Block header hash.
     */
    constructor({ blockhash }) {
        super();
        this.blockhash = blockhash;
        this.attribute_map = {
            blockhash: 'blockHash',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['blockHash'] === 'undefined')
            throw new Error(`Response is missing required field 'blockHash': ${data}`);
        return new BlockHashResponse({
            blockhash: data['blockHash'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.BlockHashResponse = BlockHashResponse;
/**
 * Encoded block object.
 */
class BlockResponse extends basemodel_1.default {
    /**
     * Creates a new `BlockResponse` object.
     * @param block - Block header data.
     * @param cert - Optional certificate object. This is only included when the format is set to
     * message pack.
     */
    constructor({ block, cert, }) {
        super();
        this.block = block;
        this.cert = cert;
        this.attribute_map = {
            block: 'block',
            cert: 'cert',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['block'] === 'undefined')
            throw new Error(`Response is missing required field 'block': ${data}`);
        return new BlockResponse({
            block: data['block'],
            cert: data['cert'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.BlockResponse = BlockResponse;
/**
 * Top level transaction IDs in a block.
 */
class BlockTxidsResponse extends basemodel_1.default {
    /**
     * Creates a new `BlockTxidsResponse` object.
     * @param blocktxids - Block transaction IDs.
     */
    constructor({ blocktxids }) {
        super();
        this.blocktxids = blocktxids;
        this.attribute_map = {
            blocktxids: 'blockTxids',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['blockTxids']))
            throw new Error(`Response is missing required array field 'blockTxids': ${data}`);
        return new BlockTxidsResponse({
            blocktxids: data['blockTxids'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.BlockTxidsResponse = BlockTxidsResponse;
/**
 * Box name and its content.
 */
class Box extends basemodel_1.default {
    /**
     * Creates a new `Box` object.
     * @param name - (name) box name, base64 encoded
     * @param round - The round for which this information is relevant
     * @param value - (value) box value, base64 encoded.
     */
    constructor({ name, round, value, }) {
        super();
        this.name = typeof name === 'string' ? (0, binarydata_1.base64ToBytes)(name) : name;
        this.round = round;
        this.value = typeof value === 'string' ? (0, binarydata_1.base64ToBytes)(value) : value;
        this.attribute_map = {
            name: 'name',
            round: 'round',
            value: 'value',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['name'] === 'undefined')
            throw new Error(`Response is missing required field 'name': ${data}`);
        if (typeof data['round'] === 'undefined')
            throw new Error(`Response is missing required field 'round': ${data}`);
        if (typeof data['value'] === 'undefined')
            throw new Error(`Response is missing required field 'value': ${data}`);
        return new Box({
            name: data['name'],
            round: data['round'],
            value: data['value'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.Box = Box;
/**
 * Box descriptor describes a Box.
 */
class BoxDescriptor extends basemodel_1.default {
    /**
     * Creates a new `BoxDescriptor` object.
     * @param name - Base64 encoded box name
     */
    constructor({ name }) {
        super();
        this.name = typeof name === 'string' ? (0, binarydata_1.base64ToBytes)(name) : name;
        this.attribute_map = {
            name: 'name',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['name'] === 'undefined')
            throw new Error(`Response is missing required field 'name': ${data}`);
        return new BoxDescriptor({
            name: data['name'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.BoxDescriptor = BoxDescriptor;
/**
 * References a box of an application.
 */
class BoxReference extends basemodel_1.default {
    /**
     * Creates a new `BoxReference` object.
     * @param app - Application ID which this box belongs to
     * @param name - Base64 encoded box name
     */
    constructor({ app, name, }) {
        super();
        this.app = app;
        this.name = typeof name === 'string' ? (0, binarydata_1.base64ToBytes)(name) : name;
        this.attribute_map = {
            app: 'app',
            name: 'name',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['app'] === 'undefined')
            throw new Error(`Response is missing required field 'app': ${data}`);
        if (typeof data['name'] === 'undefined')
            throw new Error(`Response is missing required field 'name': ${data}`);
        return new BoxReference({
            app: data['app'],
            name: data['name'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.BoxReference = BoxReference;
/**
 * Box names of an application
 */
class BoxesResponse extends basemodel_1.default {
    /**
     * Creates a new `BoxesResponse` object.
     * @param boxes -
     */
    constructor({ boxes }) {
        super();
        this.boxes = boxes;
        this.attribute_map = {
            boxes: 'boxes',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['boxes']))
            throw new Error(`Response is missing required array field 'boxes': ${data}`);
        return new BoxesResponse({
            boxes: data['boxes'].map(BoxDescriptor.from_obj_for_encoding),
        });
        /* eslint-enable dot-notation */
    }
}
exports.BoxesResponse = BoxesResponse;
class BuildVersion extends basemodel_1.default {
    /**
     * Creates a new `BuildVersion` object.
     * @param branch -
     * @param buildNumber -
     * @param channel -
     * @param commitHash -
     * @param major -
     * @param minor -
     */
    constructor({ branch, buildNumber, channel, commitHash, major, minor, }) {
        super();
        this.branch = branch;
        this.buildNumber = buildNumber;
        this.channel = channel;
        this.commitHash = commitHash;
        this.major = major;
        this.minor = minor;
        this.attribute_map = {
            branch: 'branch',
            buildNumber: 'build_number',
            channel: 'channel',
            commitHash: 'commit_hash',
            major: 'major',
            minor: 'minor',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['branch'] === 'undefined')
            throw new Error(`Response is missing required field 'branch': ${data}`);
        if (typeof data['build_number'] === 'undefined')
            throw new Error(`Response is missing required field 'build_number': ${data}`);
        if (typeof data['channel'] === 'undefined')
            throw new Error(`Response is missing required field 'channel': ${data}`);
        if (typeof data['commit_hash'] === 'undefined')
            throw new Error(`Response is missing required field 'commit_hash': ${data}`);
        if (typeof data['major'] === 'undefined')
            throw new Error(`Response is missing required field 'major': ${data}`);
        if (typeof data['minor'] === 'undefined')
            throw new Error(`Response is missing required field 'minor': ${data}`);
        return new BuildVersion({
            branch: data['branch'],
            buildNumber: data['build_number'],
            channel: data['channel'],
            commitHash: data['commit_hash'],
            major: data['major'],
            minor: data['minor'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.BuildVersion = BuildVersion;
/**
 * Teal compile Result
 */
class CompileResponse extends basemodel_1.default {
    /**
     * Creates a new `CompileResponse` object.
     * @param hash - base32 SHA512_256 of program bytes (Address style)
     * @param result - base64 encoded program bytes
     * @param sourcemap - JSON of the source map
     */
    constructor({ hash, result, sourcemap, }) {
        super();
        this.hash = hash;
        this.result = result;
        this.sourcemap = sourcemap;
        this.attribute_map = {
            hash: 'hash',
            result: 'result',
            sourcemap: 'sourcemap',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['hash'] === 'undefined')
            throw new Error(`Response is missing required field 'hash': ${data}`);
        if (typeof data['result'] === 'undefined')
            throw new Error(`Response is missing required field 'result': ${data}`);
        return new CompileResponse({
            hash: data['hash'],
            result: data['result'],
            sourcemap: data['sourcemap'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.CompileResponse = CompileResponse;
/**
 * Teal disassembly Result
 */
class DisassembleResponse extends basemodel_1.default {
    /**
     * Creates a new `DisassembleResponse` object.
     * @param result - disassembled Teal code
     */
    constructor({ result }) {
        super();
        this.result = result;
        this.attribute_map = {
            result: 'result',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['result'] === 'undefined')
            throw new Error(`Response is missing required field 'result': ${data}`);
        return new DisassembleResponse({
            result: data['result'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.DisassembleResponse = DisassembleResponse;
/**
 * Request data type for dryrun endpoint. Given the Transactions and simulated
 * ledger state upload, run TEAL scripts and return debugging information.
 */
class DryrunRequest extends basemodel_1.default {
    /**
     * Creates a new `DryrunRequest` object.
     * @param accounts -
     * @param apps -
     * @param latestTimestamp - LatestTimestamp is available to some TEAL scripts. Defaults to the latest
     * confirmed timestamp this algod is attached to.
     * @param protocolVersion - ProtocolVersion specifies a specific version string to operate under, otherwise
     * whatever the current protocol of the network this algod is running in.
     * @param round - Round is available to some TEAL scripts. Defaults to the current round on the
     * network this algod is attached to.
     * @param sources -
     * @param txns -
     */
    constructor({ accounts, apps, latestTimestamp, protocolVersion, round, sources, txns, }) {
        super();
        this.accounts = accounts;
        this.apps = apps;
        this.latestTimestamp = latestTimestamp;
        this.protocolVersion = protocolVersion;
        this.round = round;
        this.sources = sources;
        this.txns = txns;
        this.attribute_map = {
            accounts: 'accounts',
            apps: 'apps',
            latestTimestamp: 'latest-timestamp',
            protocolVersion: 'protocol-version',
            round: 'round',
            sources: 'sources',
            txns: 'txns',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['accounts']))
            throw new Error(`Response is missing required array field 'accounts': ${data}`);
        if (!Array.isArray(data['apps']))
            throw new Error(`Response is missing required array field 'apps': ${data}`);
        if (typeof data['latest-timestamp'] === 'undefined')
            throw new Error(`Response is missing required field 'latest-timestamp': ${data}`);
        if (typeof data['protocol-version'] === 'undefined')
            throw new Error(`Response is missing required field 'protocol-version': ${data}`);
        if (typeof data['round'] === 'undefined')
            throw new Error(`Response is missing required field 'round': ${data}`);
        if (!Array.isArray(data['sources']))
            throw new Error(`Response is missing required array field 'sources': ${data}`);
        if (!Array.isArray(data['txns']))
            throw new Error(`Response is missing required array field 'txns': ${data}`);
        return new DryrunRequest({
            accounts: data['accounts'].map(Account.from_obj_for_encoding),
            apps: data['apps'].map(Application.from_obj_for_encoding),
            latestTimestamp: data['latest-timestamp'],
            protocolVersion: data['protocol-version'],
            round: data['round'],
            sources: data['sources'].map(DryrunSource.from_obj_for_encoding),
            txns: data['txns'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.DryrunRequest = DryrunRequest;
/**
 * DryrunResponse contains per-txn debug information from a dryrun.
 */
class DryrunResponse extends basemodel_1.default {
    /**
     * Creates a new `DryrunResponse` object.
     * @param error -
     * @param protocolVersion - Protocol version is the protocol version Dryrun was operated under.
     * @param txns -
     */
    constructor({ error, protocolVersion, txns, }) {
        super();
        this.error = error;
        this.protocolVersion = protocolVersion;
        this.txns = txns;
        this.attribute_map = {
            error: 'error',
            protocolVersion: 'protocol-version',
            txns: 'txns',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['error'] === 'undefined')
            throw new Error(`Response is missing required field 'error': ${data}`);
        if (typeof data['protocol-version'] === 'undefined')
            throw new Error(`Response is missing required field 'protocol-version': ${data}`);
        if (!Array.isArray(data['txns']))
            throw new Error(`Response is missing required array field 'txns': ${data}`);
        return new DryrunResponse({
            error: data['error'],
            protocolVersion: data['protocol-version'],
            txns: data['txns'].map(DryrunTxnResult.from_obj_for_encoding),
        });
        /* eslint-enable dot-notation */
    }
}
exports.DryrunResponse = DryrunResponse;
/**
 * DryrunSource is TEAL source text that gets uploaded, compiled, and inserted into
 * transactions or application state.
 */
class DryrunSource extends basemodel_1.default {
    /**
     * Creates a new `DryrunSource` object.
     * @param fieldName - FieldName is what kind of sources this is. If lsig then it goes into the
     * transactions[this.TxnIndex].LogicSig. If approv or clearp it goes into the
     * Approval Program or Clear State Program of application[this.AppIndex].
     * @param source -
     * @param txnIndex -
     * @param appIndex -
     */
    constructor({ fieldName, source, txnIndex, appIndex, }) {
        super();
        this.fieldName = fieldName;
        this.source = source;
        this.txnIndex = txnIndex;
        this.appIndex = appIndex;
        this.attribute_map = {
            fieldName: 'field-name',
            source: 'source',
            txnIndex: 'txn-index',
            appIndex: 'app-index',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['field-name'] === 'undefined')
            throw new Error(`Response is missing required field 'field-name': ${data}`);
        if (typeof data['source'] === 'undefined')
            throw new Error(`Response is missing required field 'source': ${data}`);
        if (typeof data['txn-index'] === 'undefined')
            throw new Error(`Response is missing required field 'txn-index': ${data}`);
        if (typeof data['app-index'] === 'undefined')
            throw new Error(`Response is missing required field 'app-index': ${data}`);
        return new DryrunSource({
            fieldName: data['field-name'],
            source: data['source'],
            txnIndex: data['txn-index'],
            appIndex: data['app-index'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.DryrunSource = DryrunSource;
/**
 * Stores the TEAL eval step data
 */
class DryrunState extends basemodel_1.default {
    /**
     * Creates a new `DryrunState` object.
     * @param line - Line number
     * @param pc - Program counter
     * @param stack -
     * @param error - Evaluation error if any
     * @param scratch -
     */
    constructor({ line, pc, stack, error, scratch, }) {
        super();
        this.line = line;
        this.pc = pc;
        this.stack = stack;
        this.error = error;
        this.scratch = scratch;
        this.attribute_map = {
            line: 'line',
            pc: 'pc',
            stack: 'stack',
            error: 'error',
            scratch: 'scratch',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['line'] === 'undefined')
            throw new Error(`Response is missing required field 'line': ${data}`);
        if (typeof data['pc'] === 'undefined')
            throw new Error(`Response is missing required field 'pc': ${data}`);
        if (!Array.isArray(data['stack']))
            throw new Error(`Response is missing required array field 'stack': ${data}`);
        return new DryrunState({
            line: data['line'],
            pc: data['pc'],
            stack: data['stack'].map(TealValue.from_obj_for_encoding),
            error: data['error'],
            scratch: typeof data['scratch'] !== 'undefined'
                ? data['scratch'].map(TealValue.from_obj_for_encoding)
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.DryrunState = DryrunState;
/**
 * DryrunTxnResult contains any LogicSig or ApplicationCall program debug
 * information and state updates from a dryrun.
 */
class DryrunTxnResult extends basemodel_1.default {
    /**
     * Creates a new `DryrunTxnResult` object.
     * @param disassembly - Disassembled program line by line.
     * @param appCallMessages -
     * @param appCallTrace -
     * @param budgetAdded - Budget added during execution of app call transaction.
     * @param budgetConsumed - Budget consumed during execution of app call transaction.
     * @param globalDelta - Application state delta.
     * @param localDeltas -
     * @param logicSigDisassembly - Disassembled lsig program line by line.
     * @param logicSigMessages -
     * @param logicSigTrace -
     * @param logs -
     */
    constructor({ disassembly, appCallMessages, appCallTrace, budgetAdded, budgetConsumed, globalDelta, localDeltas, logicSigDisassembly, logicSigMessages, logicSigTrace, logs, }) {
        super();
        this.disassembly = disassembly;
        this.appCallMessages = appCallMessages;
        this.appCallTrace = appCallTrace;
        this.budgetAdded = budgetAdded;
        this.budgetConsumed = budgetConsumed;
        this.globalDelta = globalDelta;
        this.localDeltas = localDeltas;
        this.logicSigDisassembly = logicSigDisassembly;
        this.logicSigMessages = logicSigMessages;
        this.logicSigTrace = logicSigTrace;
        this.logs = logs;
        this.attribute_map = {
            disassembly: 'disassembly',
            appCallMessages: 'app-call-messages',
            appCallTrace: 'app-call-trace',
            budgetAdded: 'budget-added',
            budgetConsumed: 'budget-consumed',
            globalDelta: 'global-delta',
            localDeltas: 'local-deltas',
            logicSigDisassembly: 'logic-sig-disassembly',
            logicSigMessages: 'logic-sig-messages',
            logicSigTrace: 'logic-sig-trace',
            logs: 'logs',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['disassembly']))
            throw new Error(`Response is missing required array field 'disassembly': ${data}`);
        return new DryrunTxnResult({
            disassembly: data['disassembly'],
            appCallMessages: data['app-call-messages'],
            appCallTrace: typeof data['app-call-trace'] !== 'undefined'
                ? data['app-call-trace'].map(DryrunState.from_obj_for_encoding)
                : undefined,
            budgetAdded: data['budget-added'],
            budgetConsumed: data['budget-consumed'],
            globalDelta: typeof data['global-delta'] !== 'undefined'
                ? data['global-delta'].map(EvalDeltaKeyValue.from_obj_for_encoding)
                : undefined,
            localDeltas: typeof data['local-deltas'] !== 'undefined'
                ? data['local-deltas'].map(AccountStateDelta.from_obj_for_encoding)
                : undefined,
            logicSigDisassembly: data['logic-sig-disassembly'],
            logicSigMessages: data['logic-sig-messages'],
            logicSigTrace: typeof data['logic-sig-trace'] !== 'undefined'
                ? data['logic-sig-trace'].map(DryrunState.from_obj_for_encoding)
                : undefined,
            logs: data['logs'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.DryrunTxnResult = DryrunTxnResult;
/**
 * An error response with optional data field.
 */
class ErrorResponse extends basemodel_1.default {
    /**
     * Creates a new `ErrorResponse` object.
     * @param message -
     * @param data -
     */
    constructor({ message, data, }) {
        super();
        this.message = message;
        this.data = data;
        this.attribute_map = {
            message: 'message',
            data: 'data',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['message'] === 'undefined')
            throw new Error(`Response is missing required field 'message': ${data}`);
        return new ErrorResponse({
            message: data['message'],
            data: data['data'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.ErrorResponse = ErrorResponse;
/**
 * Represents a TEAL value delta.
 */
class EvalDelta extends basemodel_1.default {
    /**
     * Creates a new `EvalDelta` object.
     * @param action - (at) delta action.
     * @param bytes - (bs) bytes value.
     * @param uint - (ui) uint value.
     */
    constructor({ action, bytes, uint, }) {
        super();
        this.action = action;
        this.bytes = bytes;
        this.uint = uint;
        this.attribute_map = {
            action: 'action',
            bytes: 'bytes',
            uint: 'uint',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['action'] === 'undefined')
            throw new Error(`Response is missing required field 'action': ${data}`);
        return new EvalDelta({
            action: data['action'],
            bytes: data['bytes'],
            uint: data['uint'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.EvalDelta = EvalDelta;
/**
 * Key-value pairs for StateDelta.
 */
class EvalDeltaKeyValue extends basemodel_1.default {
    /**
     * Creates a new `EvalDeltaKeyValue` object.
     * @param key -
     * @param value - Represents a TEAL value delta.
     */
    constructor({ key, value }) {
        super();
        this.key = key;
        this.value = value;
        this.attribute_map = {
            key: 'key',
            value: 'value',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['key'] === 'undefined')
            throw new Error(`Response is missing required field 'key': ${data}`);
        if (typeof data['value'] === 'undefined')
            throw new Error(`Response is missing required field 'value': ${data}`);
        return new EvalDeltaKeyValue({
            key: data['key'],
            value: EvalDelta.from_obj_for_encoding(data['value']),
        });
        /* eslint-enable dot-notation */
    }
}
exports.EvalDeltaKeyValue = EvalDeltaKeyValue;
/**
 * Response containing the timestamp offset in seconds
 */
class GetBlockTimeStampOffsetResponse extends basemodel_1.default {
    /**
     * Creates a new `GetBlockTimeStampOffsetResponse` object.
     * @param offset - Timestamp offset in seconds.
     */
    constructor({ offset }) {
        super();
        this.offset = offset;
        this.attribute_map = {
            offset: 'offset',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['offset'] === 'undefined')
            throw new Error(`Response is missing required field 'offset': ${data}`);
        return new GetBlockTimeStampOffsetResponse({
            offset: data['offset'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.GetBlockTimeStampOffsetResponse = GetBlockTimeStampOffsetResponse;
/**
 * Response containing the ledger's minimum sync round
 */
class GetSyncRoundResponse extends basemodel_1.default {
    /**
     * Creates a new `GetSyncRoundResponse` object.
     * @param round - The minimum sync round for the ledger.
     */
    constructor({ round }) {
        super();
        this.round = round;
        this.attribute_map = {
            round: 'round',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['round'] === 'undefined')
            throw new Error(`Response is missing required field 'round': ${data}`);
        return new GetSyncRoundResponse({
            round: data['round'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.GetSyncRoundResponse = GetSyncRoundResponse;
/**
 * A single Delta containing the key, the previous value and the current value for
 * a single round.
 */
class KvDelta extends basemodel_1.default {
    /**
     * Creates a new `KvDelta` object.
     * @param key - The key, base64 encoded.
     * @param value - The new value of the KV store entry, base64 encoded.
     */
    constructor({ key, value, }) {
        super();
        this.key = typeof key === 'string' ? (0, binarydata_1.base64ToBytes)(key) : key;
        this.value = typeof value === 'string' ? (0, binarydata_1.base64ToBytes)(value) : value;
        this.attribute_map = {
            key: 'key',
            value: 'value',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        return new KvDelta({
            key: data['key'],
            value: data['value'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.KvDelta = KvDelta;
/**
 * Contains a ledger delta for a single transaction group
 */
class LedgerStateDeltaForTransactionGroup extends basemodel_1.default {
    /**
     * Creates a new `LedgerStateDeltaForTransactionGroup` object.
     * @param delta - Ledger StateDelta object
     * @param ids -
     */
    constructor({ delta, ids }) {
        super();
        this.delta = delta;
        this.ids = ids;
        this.attribute_map = {
            delta: 'Delta',
            ids: 'Ids',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['Delta'] === 'undefined')
            throw new Error(`Response is missing required field 'Delta': ${data}`);
        if (!Array.isArray(data['Ids']))
            throw new Error(`Response is missing required array field 'Ids': ${data}`);
        return new LedgerStateDeltaForTransactionGroup({
            delta: data['Delta'],
            ids: data['Ids'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.LedgerStateDeltaForTransactionGroup = LedgerStateDeltaForTransactionGroup;
/**
 * Proof of membership and position of a light block header.
 */
class LightBlockHeaderProof extends basemodel_1.default {
    /**
     * Creates a new `LightBlockHeaderProof` object.
     * @param index - The index of the light block header in the vector commitment tree
     * @param proof - The encoded proof.
     * @param treedepth - Represents the depth of the tree that is being proven, i.e. the number of edges
     * from a leaf to the root.
     */
    constructor({ index, proof, treedepth, }) {
        super();
        this.index = index;
        this.proof = typeof proof === 'string' ? (0, binarydata_1.base64ToBytes)(proof) : proof;
        this.treedepth = treedepth;
        this.attribute_map = {
            index: 'index',
            proof: 'proof',
            treedepth: 'treedepth',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['index'] === 'undefined')
            throw new Error(`Response is missing required field 'index': ${data}`);
        if (typeof data['proof'] === 'undefined')
            throw new Error(`Response is missing required field 'proof': ${data}`);
        if (typeof data['treedepth'] === 'undefined')
            throw new Error(`Response is missing required field 'treedepth': ${data}`);
        return new LightBlockHeaderProof({
            index: data['index'],
            proof: data['proof'],
            treedepth: data['treedepth'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.LightBlockHeaderProof = LightBlockHeaderProof;
/**
 *
 */
class NodeStatusResponse extends basemodel_1.default {
    /**
     * Creates a new `NodeStatusResponse` object.
     * @param catchupTime - CatchupTime in nanoseconds
     * @param lastRound - LastRound indicates the last round seen
     * @param lastVersion - LastVersion indicates the last consensus version supported
     * @param nextVersion - NextVersion of consensus protocol to use
     * @param nextVersionRound - NextVersionRound is the round at which the next consensus version will apply
     * @param nextVersionSupported - NextVersionSupported indicates whether the next consensus version is supported
     * by this node
     * @param stoppedAtUnsupportedRound - StoppedAtUnsupportedRound indicates that the node does not support the new
     * rounds and has stopped making progress
     * @param timeSinceLastRound - TimeSinceLastRound in nanoseconds
     * @param catchpoint - The current catchpoint that is being caught up to
     * @param catchpointAcquiredBlocks - The number of blocks that have already been obtained by the node as part of the
     * catchup
     * @param catchpointProcessedAccounts - The number of accounts from the current catchpoint that have been processed so
     * far as part of the catchup
     * @param catchpointProcessedKvs - The number of key-values (KVs) from the current catchpoint that have been
     * processed so far as part of the catchup
     * @param catchpointTotalAccounts - The total number of accounts included in the current catchpoint
     * @param catchpointTotalBlocks - The total number of blocks that are required to complete the current catchpoint
     * catchup
     * @param catchpointTotalKvs - The total number of key-values (KVs) included in the current catchpoint
     * @param catchpointVerifiedAccounts - The number of accounts from the current catchpoint that have been verified so
     * far as part of the catchup
     * @param catchpointVerifiedKvs - The number of key-values (KVs) from the current catchpoint that have been
     * verified so far as part of the catchup
     * @param lastCatchpoint - The last catchpoint seen by the node
     * @param upgradeDelay - Upgrade delay
     * @param upgradeNextProtocolVoteBefore - Next protocol round
     * @param upgradeNoVotes - No votes cast for consensus upgrade
     * @param upgradeNodeVote - This node's upgrade vote
     * @param upgradeVoteRounds - Total voting rounds for current upgrade
     * @param upgradeVotes - Total votes cast for consensus upgrade
     * @param upgradeVotesRequired - Yes votes required for consensus upgrade
     * @param upgradeYesVotes - Yes votes cast for consensus upgrade
     */
    constructor({ catchupTime, lastRound, lastVersion, nextVersion, nextVersionRound, nextVersionSupported, stoppedAtUnsupportedRound, timeSinceLastRound, catchpoint, catchpointAcquiredBlocks, catchpointProcessedAccounts, catchpointProcessedKvs, catchpointTotalAccounts, catchpointTotalBlocks, catchpointTotalKvs, catchpointVerifiedAccounts, catchpointVerifiedKvs, lastCatchpoint, upgradeDelay, upgradeNextProtocolVoteBefore, upgradeNoVotes, upgradeNodeVote, upgradeVoteRounds, upgradeVotes, upgradeVotesRequired, upgradeYesVotes, }) {
        super();
        this.catchupTime = catchupTime;
        this.lastRound = lastRound;
        this.lastVersion = lastVersion;
        this.nextVersion = nextVersion;
        this.nextVersionRound = nextVersionRound;
        this.nextVersionSupported = nextVersionSupported;
        this.stoppedAtUnsupportedRound = stoppedAtUnsupportedRound;
        this.timeSinceLastRound = timeSinceLastRound;
        this.catchpoint = catchpoint;
        this.catchpointAcquiredBlocks = catchpointAcquiredBlocks;
        this.catchpointProcessedAccounts = catchpointProcessedAccounts;
        this.catchpointProcessedKvs = catchpointProcessedKvs;
        this.catchpointTotalAccounts = catchpointTotalAccounts;
        this.catchpointTotalBlocks = catchpointTotalBlocks;
        this.catchpointTotalKvs = catchpointTotalKvs;
        this.catchpointVerifiedAccounts = catchpointVerifiedAccounts;
        this.catchpointVerifiedKvs = catchpointVerifiedKvs;
        this.lastCatchpoint = lastCatchpoint;
        this.upgradeDelay = upgradeDelay;
        this.upgradeNextProtocolVoteBefore = upgradeNextProtocolVoteBefore;
        this.upgradeNoVotes = upgradeNoVotes;
        this.upgradeNodeVote = upgradeNodeVote;
        this.upgradeVoteRounds = upgradeVoteRounds;
        this.upgradeVotes = upgradeVotes;
        this.upgradeVotesRequired = upgradeVotesRequired;
        this.upgradeYesVotes = upgradeYesVotes;
        this.attribute_map = {
            catchupTime: 'catchup-time',
            lastRound: 'last-round',
            lastVersion: 'last-version',
            nextVersion: 'next-version',
            nextVersionRound: 'next-version-round',
            nextVersionSupported: 'next-version-supported',
            stoppedAtUnsupportedRound: 'stopped-at-unsupported-round',
            timeSinceLastRound: 'time-since-last-round',
            catchpoint: 'catchpoint',
            catchpointAcquiredBlocks: 'catchpoint-acquired-blocks',
            catchpointProcessedAccounts: 'catchpoint-processed-accounts',
            catchpointProcessedKvs: 'catchpoint-processed-kvs',
            catchpointTotalAccounts: 'catchpoint-total-accounts',
            catchpointTotalBlocks: 'catchpoint-total-blocks',
            catchpointTotalKvs: 'catchpoint-total-kvs',
            catchpointVerifiedAccounts: 'catchpoint-verified-accounts',
            catchpointVerifiedKvs: 'catchpoint-verified-kvs',
            lastCatchpoint: 'last-catchpoint',
            upgradeDelay: 'upgrade-delay',
            upgradeNextProtocolVoteBefore: 'upgrade-next-protocol-vote-before',
            upgradeNoVotes: 'upgrade-no-votes',
            upgradeNodeVote: 'upgrade-node-vote',
            upgradeVoteRounds: 'upgrade-vote-rounds',
            upgradeVotes: 'upgrade-votes',
            upgradeVotesRequired: 'upgrade-votes-required',
            upgradeYesVotes: 'upgrade-yes-votes',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['catchup-time'] === 'undefined')
            throw new Error(`Response is missing required field 'catchup-time': ${data}`);
        if (typeof data['last-round'] === 'undefined')
            throw new Error(`Response is missing required field 'last-round': ${data}`);
        if (typeof data['last-version'] === 'undefined')
            throw new Error(`Response is missing required field 'last-version': ${data}`);
        if (typeof data['next-version'] === 'undefined')
            throw new Error(`Response is missing required field 'next-version': ${data}`);
        if (typeof data['next-version-round'] === 'undefined')
            throw new Error(`Response is missing required field 'next-version-round': ${data}`);
        if (typeof data['next-version-supported'] === 'undefined')
            throw new Error(`Response is missing required field 'next-version-supported': ${data}`);
        if (typeof data['stopped-at-unsupported-round'] === 'undefined')
            throw new Error(`Response is missing required field 'stopped-at-unsupported-round': ${data}`);
        if (typeof data['time-since-last-round'] === 'undefined')
            throw new Error(`Response is missing required field 'time-since-last-round': ${data}`);
        return new NodeStatusResponse({
            catchupTime: data['catchup-time'],
            lastRound: data['last-round'],
            lastVersion: data['last-version'],
            nextVersion: data['next-version'],
            nextVersionRound: data['next-version-round'],
            nextVersionSupported: data['next-version-supported'],
            stoppedAtUnsupportedRound: data['stopped-at-unsupported-round'],
            timeSinceLastRound: data['time-since-last-round'],
            catchpoint: data['catchpoint'],
            catchpointAcquiredBlocks: data['catchpoint-acquired-blocks'],
            catchpointProcessedAccounts: data['catchpoint-processed-accounts'],
            catchpointProcessedKvs: data['catchpoint-processed-kvs'],
            catchpointTotalAccounts: data['catchpoint-total-accounts'],
            catchpointTotalBlocks: data['catchpoint-total-blocks'],
            catchpointTotalKvs: data['catchpoint-total-kvs'],
            catchpointVerifiedAccounts: data['catchpoint-verified-accounts'],
            catchpointVerifiedKvs: data['catchpoint-verified-kvs'],
            lastCatchpoint: data['last-catchpoint'],
            upgradeDelay: data['upgrade-delay'],
            upgradeNextProtocolVoteBefore: data['upgrade-next-protocol-vote-before'],
            upgradeNoVotes: data['upgrade-no-votes'],
            upgradeNodeVote: data['upgrade-node-vote'],
            upgradeVoteRounds: data['upgrade-vote-rounds'],
            upgradeVotes: data['upgrade-votes'],
            upgradeVotesRequired: data['upgrade-votes-required'],
            upgradeYesVotes: data['upgrade-yes-votes'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.NodeStatusResponse = NodeStatusResponse;
/**
 * Details about a pending transaction. If the transaction was recently confirmed,
 * includes confirmation details like the round and reward details.
 */
class PendingTransactionResponse extends basemodel_1.default {
    /**
     * Creates a new `PendingTransactionResponse` object.
     * @param poolError - Indicates that the transaction was kicked out of this node's transaction pool
     * (and specifies why that happened). An empty string indicates the transaction
     * wasn't kicked out of this node's txpool due to an error.
     * @param txn - The raw signed transaction.
     * @param applicationIndex - The application index if the transaction was found and it created an
     * application.
     * @param assetClosingAmount - The number of the asset's unit that were transferred to the close-to address.
     * @param assetIndex - The asset index if the transaction was found and it created an asset.
     * @param closeRewards - Rewards in microalgos applied to the close remainder to account.
     * @param closingAmount - Closing amount for the transaction.
     * @param confirmedRound - The round where this transaction was confirmed, if present.
     * @param globalStateDelta - Global state key/value changes for the application being executed by this
     * transaction.
     * @param innerTxns - Inner transactions produced by application execution.
     * @param localStateDelta - Local state key/value changes for the application being executed by this
     * transaction.
     * @param logs - Logs for the application being executed by this transaction.
     * @param receiverRewards - Rewards in microalgos applied to the receiver account.
     * @param senderRewards - Rewards in microalgos applied to the sender account.
     */
    constructor({ poolError, txn, applicationIndex, assetClosingAmount, assetIndex, closeRewards, closingAmount, confirmedRound, globalStateDelta, innerTxns, localStateDelta, logs, receiverRewards, senderRewards, }) {
        super();
        this.poolError = poolError;
        this.txn = txn;
        this.applicationIndex = applicationIndex;
        this.assetClosingAmount = assetClosingAmount;
        this.assetIndex = assetIndex;
        this.closeRewards = closeRewards;
        this.closingAmount = closingAmount;
        this.confirmedRound = confirmedRound;
        this.globalStateDelta = globalStateDelta;
        this.innerTxns = innerTxns;
        this.localStateDelta = localStateDelta;
        this.logs = logs;
        this.receiverRewards = receiverRewards;
        this.senderRewards = senderRewards;
        this.attribute_map = {
            poolError: 'pool-error',
            txn: 'txn',
            applicationIndex: 'application-index',
            assetClosingAmount: 'asset-closing-amount',
            assetIndex: 'asset-index',
            closeRewards: 'close-rewards',
            closingAmount: 'closing-amount',
            confirmedRound: 'confirmed-round',
            globalStateDelta: 'global-state-delta',
            innerTxns: 'inner-txns',
            localStateDelta: 'local-state-delta',
            logs: 'logs',
            receiverRewards: 'receiver-rewards',
            senderRewards: 'sender-rewards',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['pool-error'] === 'undefined')
            throw new Error(`Response is missing required field 'pool-error': ${data}`);
        if (typeof data['txn'] === 'undefined')
            throw new Error(`Response is missing required field 'txn': ${data}`);
        return new PendingTransactionResponse({
            poolError: data['pool-error'],
            txn: data['txn'],
            applicationIndex: data['application-index'],
            assetClosingAmount: data['asset-closing-amount'],
            assetIndex: data['asset-index'],
            closeRewards: data['close-rewards'],
            closingAmount: data['closing-amount'],
            confirmedRound: data['confirmed-round'],
            globalStateDelta: typeof data['global-state-delta'] !== 'undefined'
                ? data['global-state-delta'].map(EvalDeltaKeyValue.from_obj_for_encoding)
                : undefined,
            innerTxns: typeof data['inner-txns'] !== 'undefined'
                ? data['inner-txns'].map(PendingTransactionResponse.from_obj_for_encoding)
                : undefined,
            localStateDelta: typeof data['local-state-delta'] !== 'undefined'
                ? data['local-state-delta'].map(AccountStateDelta.from_obj_for_encoding)
                : undefined,
            logs: data['logs'],
            receiverRewards: data['receiver-rewards'],
            senderRewards: data['sender-rewards'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.PendingTransactionResponse = PendingTransactionResponse;
/**
 * A potentially truncated list of transactions currently in the node's transaction
 * pool. You can compute whether or not the list is truncated if the number of
 * elements in the **top-transactions** array is fewer than **total-transactions**.
 */
class PendingTransactionsResponse extends basemodel_1.default {
    /**
     * Creates a new `PendingTransactionsResponse` object.
     * @param topTransactions - An array of signed transaction objects.
     * @param totalTransactions - Total number of transactions in the pool.
     */
    constructor({ topTransactions, totalTransactions, }) {
        super();
        this.topTransactions = topTransactions;
        this.totalTransactions = totalTransactions;
        this.attribute_map = {
            topTransactions: 'top-transactions',
            totalTransactions: 'total-transactions',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['top-transactions']))
            throw new Error(`Response is missing required array field 'top-transactions': ${data}`);
        if (typeof data['total-transactions'] === 'undefined')
            throw new Error(`Response is missing required field 'total-transactions': ${data}`);
        return new PendingTransactionsResponse({
            topTransactions: data['top-transactions'],
            totalTransactions: data['total-transactions'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.PendingTransactionsResponse = PendingTransactionsResponse;
/**
 * Transaction ID of the submission.
 */
class PostTransactionsResponse extends basemodel_1.default {
    /**
     * Creates a new `PostTransactionsResponse` object.
     * @param txid - encoding of the transaction hash.
     */
    constructor({ txid }) {
        super();
        this.txid = txid;
        this.attribute_map = {
            txid: 'txId',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['txId'] === 'undefined')
            throw new Error(`Response is missing required field 'txId': ${data}`);
        return new PostTransactionsResponse({
            txid: data['txId'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.PostTransactionsResponse = PostTransactionsResponse;
/**
 * A write operation into a scratch slot.
 */
class ScratchChange extends basemodel_1.default {
    /**
     * Creates a new `ScratchChange` object.
     * @param newValue - Represents an AVM value.
     * @param slot - The scratch slot written.
     */
    constructor({ newValue, slot, }) {
        super();
        this.newValue = newValue;
        this.slot = slot;
        this.attribute_map = {
            newValue: 'new-value',
            slot: 'slot',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['new-value'] === 'undefined')
            throw new Error(`Response is missing required field 'new-value': ${data}`);
        if (typeof data['slot'] === 'undefined')
            throw new Error(`Response is missing required field 'slot': ${data}`);
        return new ScratchChange({
            newValue: AvmValue.from_obj_for_encoding(data['new-value']),
            slot: data['slot'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.ScratchChange = ScratchChange;
/**
 * Initial states of resources that were accessed during simulation.
 */
class SimulateInitialStates extends basemodel_1.default {
    /**
     * Creates a new `SimulateInitialStates` object.
     * @param appInitialStates - The initial states of accessed application before simulation. The order of this
     * array is arbitrary.
     */
    constructor({ appInitialStates, }) {
        super();
        this.appInitialStates = appInitialStates;
        this.attribute_map = {
            appInitialStates: 'app-initial-states',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        return new SimulateInitialStates({
            appInitialStates: typeof data['app-initial-states'] !== 'undefined'
                ? data['app-initial-states'].map(ApplicationInitialStates.from_obj_for_encoding)
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateInitialStates = SimulateInitialStates;
/**
 * Request type for simulation endpoint.
 */
class SimulateRequest extends basemodel_1.default {
    /**
     * Creates a new `SimulateRequest` object.
     * @param txnGroups - The transaction groups to simulate.
     * @param allowEmptySignatures - Allows transactions without signatures to be simulated as if they had correct
     * signatures.
     * @param allowMoreLogging - Lifts limits on log opcode usage during simulation.
     * @param allowUnnamedResources - Allows access to unnamed resources during simulation.
     * @param execTraceConfig - An object that configures simulation execution trace.
     * @param extraOpcodeBudget - Applies extra opcode budget during simulation for each transaction group.
     * @param round - If provided, specifies the round preceding the simulation. State changes through
     * this round will be used to run this simulation. Usually only the 4 most recent
     * rounds will be available (controlled by the node config value MaxAcctLookback).
     * If not specified, defaults to the latest available round.
     */
    constructor({ txnGroups, allowEmptySignatures, allowMoreLogging, allowUnnamedResources, execTraceConfig, extraOpcodeBudget, round, }) {
        super();
        this.txnGroups = txnGroups;
        this.allowEmptySignatures = allowEmptySignatures;
        this.allowMoreLogging = allowMoreLogging;
        this.allowUnnamedResources = allowUnnamedResources;
        this.execTraceConfig = execTraceConfig;
        this.extraOpcodeBudget = extraOpcodeBudget;
        this.round = round;
        this.attribute_map = {
            txnGroups: 'txn-groups',
            allowEmptySignatures: 'allow-empty-signatures',
            allowMoreLogging: 'allow-more-logging',
            allowUnnamedResources: 'allow-unnamed-resources',
            execTraceConfig: 'exec-trace-config',
            extraOpcodeBudget: 'extra-opcode-budget',
            round: 'round',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['txn-groups']))
            throw new Error(`Response is missing required array field 'txn-groups': ${data}`);
        return new SimulateRequest({
            txnGroups: data['txn-groups'].map(SimulateRequestTransactionGroup.from_obj_for_encoding),
            allowEmptySignatures: data['allow-empty-signatures'],
            allowMoreLogging: data['allow-more-logging'],
            allowUnnamedResources: data['allow-unnamed-resources'],
            execTraceConfig: typeof data['exec-trace-config'] !== 'undefined'
                ? SimulateTraceConfig.from_obj_for_encoding(data['exec-trace-config'])
                : undefined,
            extraOpcodeBudget: data['extra-opcode-budget'],
            round: data['round'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateRequest = SimulateRequest;
/**
 * A transaction group to simulate.
 */
class SimulateRequestTransactionGroup extends basemodel_1.default {
    /**
     * Creates a new `SimulateRequestTransactionGroup` object.
     * @param txns - An atomic transaction group.
     */
    constructor({ txns }) {
        super();
        this.txns = txns;
        this.attribute_map = {
            txns: 'txns',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['txns']))
            throw new Error(`Response is missing required array field 'txns': ${data}`);
        return new SimulateRequestTransactionGroup({
            txns: data['txns'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateRequestTransactionGroup = SimulateRequestTransactionGroup;
/**
 * Result of a transaction group simulation.
 */
class SimulateResponse extends basemodel_1.default {
    /**
     * Creates a new `SimulateResponse` object.
     * @param lastRound - The round immediately preceding this simulation. State changes through this
     * round were used to run this simulation.
     * @param txnGroups - A result object for each transaction group that was simulated.
     * @param version - The version of this response object.
     * @param evalOverrides - The set of parameters and limits override during simulation. If this set of
     * parameters is present, then evaluation parameters may differ from standard
     * evaluation in certain ways.
     * @param execTraceConfig - An object that configures simulation execution trace.
     * @param initialStates - Initial states of resources that were accessed during simulation.
     */
    constructor({ lastRound, txnGroups, version, evalOverrides, execTraceConfig, initialStates, }) {
        super();
        this.lastRound = lastRound;
        this.txnGroups = txnGroups;
        this.version = version;
        this.evalOverrides = evalOverrides;
        this.execTraceConfig = execTraceConfig;
        this.initialStates = initialStates;
        this.attribute_map = {
            lastRound: 'last-round',
            txnGroups: 'txn-groups',
            version: 'version',
            evalOverrides: 'eval-overrides',
            execTraceConfig: 'exec-trace-config',
            initialStates: 'initial-states',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['last-round'] === 'undefined')
            throw new Error(`Response is missing required field 'last-round': ${data}`);
        if (!Array.isArray(data['txn-groups']))
            throw new Error(`Response is missing required array field 'txn-groups': ${data}`);
        if (typeof data['version'] === 'undefined')
            throw new Error(`Response is missing required field 'version': ${data}`);
        return new SimulateResponse({
            lastRound: data['last-round'],
            txnGroups: data['txn-groups'].map(SimulateTransactionGroupResult.from_obj_for_encoding),
            version: data['version'],
            evalOverrides: typeof data['eval-overrides'] !== 'undefined'
                ? SimulationEvalOverrides.from_obj_for_encoding(data['eval-overrides'])
                : undefined,
            execTraceConfig: typeof data['exec-trace-config'] !== 'undefined'
                ? SimulateTraceConfig.from_obj_for_encoding(data['exec-trace-config'])
                : undefined,
            initialStates: typeof data['initial-states'] !== 'undefined'
                ? SimulateInitialStates.from_obj_for_encoding(data['initial-states'])
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateResponse = SimulateResponse;
/**
 * An object that configures simulation execution trace.
 */
class SimulateTraceConfig extends basemodel_1.default {
    /**
     * Creates a new `SimulateTraceConfig` object.
     * @param enable - A boolean option for opting in execution trace features simulation endpoint.
     * @param scratchChange - A boolean option enabling returning scratch slot changes together with execution
     * trace during simulation.
     * @param stackChange - A boolean option enabling returning stack changes together with execution trace
     * during simulation.
     * @param stateChange - A boolean option enabling returning application state changes (global, local,
     * and box changes) with the execution trace during simulation.
     */
    constructor({ enable, scratchChange, stackChange, stateChange, }) {
        super();
        this.enable = enable;
        this.scratchChange = scratchChange;
        this.stackChange = stackChange;
        this.stateChange = stateChange;
        this.attribute_map = {
            enable: 'enable',
            scratchChange: 'scratch-change',
            stackChange: 'stack-change',
            stateChange: 'state-change',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        return new SimulateTraceConfig({
            enable: data['enable'],
            scratchChange: data['scratch-change'],
            stackChange: data['stack-change'],
            stateChange: data['state-change'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateTraceConfig = SimulateTraceConfig;
/**
 * Simulation result for an atomic transaction group
 */
class SimulateTransactionGroupResult extends basemodel_1.default {
    /**
     * Creates a new `SimulateTransactionGroupResult` object.
     * @param txnResults - Simulation result for individual transactions
     * @param appBudgetAdded - Total budget added during execution of app calls in the transaction group.
     * @param appBudgetConsumed - Total budget consumed during execution of app calls in the transaction group.
     * @param failedAt - If present, indicates which transaction in this group caused the failure. This
     * array represents the path to the failing transaction. Indexes are zero based,
     * the first element indicates the top-level transaction, and successive elements
     * indicate deeper inner transactions.
     * @param failureMessage - If present, indicates that the transaction group failed and specifies why that
     * happened
     * @param unnamedResourcesAccessed - These are resources that were accessed by this group that would normally have
     * caused failure, but were allowed in simulation. Depending on where this object
     * is in the response, the unnamed resources it contains may or may not qualify for
     * group resource sharing. If this is a field in SimulateTransactionGroupResult,
     * the resources do qualify, but if this is a field in SimulateTransactionResult,
     * they do not qualify. In order to make this group valid for actual submission,
     * resources that qualify for group sharing can be made available by any
     * transaction of the group; otherwise, resources must be placed in the same
     * transaction which accessed them.
     */
    constructor({ txnResults, appBudgetAdded, appBudgetConsumed, failedAt, failureMessage, unnamedResourcesAccessed, }) {
        super();
        this.txnResults = txnResults;
        this.appBudgetAdded = appBudgetAdded;
        this.appBudgetConsumed = appBudgetConsumed;
        this.failedAt = failedAt;
        this.failureMessage = failureMessage;
        this.unnamedResourcesAccessed = unnamedResourcesAccessed;
        this.attribute_map = {
            txnResults: 'txn-results',
            appBudgetAdded: 'app-budget-added',
            appBudgetConsumed: 'app-budget-consumed',
            failedAt: 'failed-at',
            failureMessage: 'failure-message',
            unnamedResourcesAccessed: 'unnamed-resources-accessed',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['txn-results']))
            throw new Error(`Response is missing required array field 'txn-results': ${data}`);
        return new SimulateTransactionGroupResult({
            txnResults: data['txn-results'].map(SimulateTransactionResult.from_obj_for_encoding),
            appBudgetAdded: data['app-budget-added'],
            appBudgetConsumed: data['app-budget-consumed'],
            failedAt: data['failed-at'],
            failureMessage: data['failure-message'],
            unnamedResourcesAccessed: typeof data['unnamed-resources-accessed'] !== 'undefined'
                ? SimulateUnnamedResourcesAccessed.from_obj_for_encoding(data['unnamed-resources-accessed'])
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateTransactionGroupResult = SimulateTransactionGroupResult;
/**
 * Simulation result for an individual transaction
 */
class SimulateTransactionResult extends basemodel_1.default {
    /**
     * Creates a new `SimulateTransactionResult` object.
     * @param txnResult - Details about a pending transaction. If the transaction was recently confirmed,
     * includes confirmation details like the round and reward details.
     * @param appBudgetConsumed - Budget used during execution of an app call transaction. This value includes
     * budged used by inner app calls spawned by this transaction.
     * @param execTrace - The execution trace of calling an app or a logic sig, containing the inner app
     * call trace in a recursive way.
     * @param logicSigBudgetConsumed - Budget used during execution of a logic sig transaction.
     * @param unnamedResourcesAccessed - These are resources that were accessed by this group that would normally have
     * caused failure, but were allowed in simulation. Depending on where this object
     * is in the response, the unnamed resources it contains may or may not qualify for
     * group resource sharing. If this is a field in SimulateTransactionGroupResult,
     * the resources do qualify, but if this is a field in SimulateTransactionResult,
     * they do not qualify. In order to make this group valid for actual submission,
     * resources that qualify for group sharing can be made available by any
     * transaction of the group; otherwise, resources must be placed in the same
     * transaction which accessed them.
     */
    constructor({ txnResult, appBudgetConsumed, execTrace, logicSigBudgetConsumed, unnamedResourcesAccessed, }) {
        super();
        this.txnResult = txnResult;
        this.appBudgetConsumed = appBudgetConsumed;
        this.execTrace = execTrace;
        this.logicSigBudgetConsumed = logicSigBudgetConsumed;
        this.unnamedResourcesAccessed = unnamedResourcesAccessed;
        this.attribute_map = {
            txnResult: 'txn-result',
            appBudgetConsumed: 'app-budget-consumed',
            execTrace: 'exec-trace',
            logicSigBudgetConsumed: 'logic-sig-budget-consumed',
            unnamedResourcesAccessed: 'unnamed-resources-accessed',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['txn-result'] === 'undefined')
            throw new Error(`Response is missing required field 'txn-result': ${data}`);
        return new SimulateTransactionResult({
            txnResult: PendingTransactionResponse.from_obj_for_encoding(data['txn-result']),
            appBudgetConsumed: data['app-budget-consumed'],
            execTrace: typeof data['exec-trace'] !== 'undefined'
                ? SimulationTransactionExecTrace.from_obj_for_encoding(data['exec-trace'])
                : undefined,
            logicSigBudgetConsumed: data['logic-sig-budget-consumed'],
            unnamedResourcesAccessed: typeof data['unnamed-resources-accessed'] !== 'undefined'
                ? SimulateUnnamedResourcesAccessed.from_obj_for_encoding(data['unnamed-resources-accessed'])
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateTransactionResult = SimulateTransactionResult;
/**
 * These are resources that were accessed by this group that would normally have
 * caused failure, but were allowed in simulation. Depending on where this object
 * is in the response, the unnamed resources it contains may or may not qualify for
 * group resource sharing. If this is a field in SimulateTransactionGroupResult,
 * the resources do qualify, but if this is a field in SimulateTransactionResult,
 * they do not qualify. In order to make this group valid for actual submission,
 * resources that qualify for group sharing can be made available by any
 * transaction of the group; otherwise, resources must be placed in the same
 * transaction which accessed them.
 */
class SimulateUnnamedResourcesAccessed extends basemodel_1.default {
    /**
     * Creates a new `SimulateUnnamedResourcesAccessed` object.
     * @param accounts - The unnamed accounts that were referenced. The order of this array is arbitrary.
     * @param appLocals - The unnamed application local states that were referenced. The order of this
     * array is arbitrary.
     * @param apps - The unnamed applications that were referenced. The order of this array is
     * arbitrary.
     * @param assetHoldings - The unnamed asset holdings that were referenced. The order of this array is
     * arbitrary.
     * @param assets - The unnamed assets that were referenced. The order of this array is arbitrary.
     * @param boxes - The unnamed boxes that were referenced. The order of this array is arbitrary.
     * @param extraBoxRefs - The number of extra box references used to increase the IO budget. This is in
     * addition to the references defined in the input transaction group and any
     * referenced to unnamed boxes.
     */
    constructor({ accounts, appLocals, apps, assetHoldings, assets, boxes, extraBoxRefs, }) {
        super();
        this.accounts = accounts;
        this.appLocals = appLocals;
        this.apps = apps;
        this.assetHoldings = assetHoldings;
        this.assets = assets;
        this.boxes = boxes;
        this.extraBoxRefs = extraBoxRefs;
        this.attribute_map = {
            accounts: 'accounts',
            appLocals: 'app-locals',
            apps: 'apps',
            assetHoldings: 'asset-holdings',
            assets: 'assets',
            boxes: 'boxes',
            extraBoxRefs: 'extra-box-refs',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        return new SimulateUnnamedResourcesAccessed({
            accounts: data['accounts'],
            appLocals: typeof data['app-locals'] !== 'undefined'
                ? data['app-locals'].map(ApplicationLocalReference.from_obj_for_encoding)
                : undefined,
            apps: data['apps'],
            assetHoldings: typeof data['asset-holdings'] !== 'undefined'
                ? data['asset-holdings'].map(AssetHoldingReference.from_obj_for_encoding)
                : undefined,
            assets: data['assets'],
            boxes: typeof data['boxes'] !== 'undefined'
                ? data['boxes'].map(BoxReference.from_obj_for_encoding)
                : undefined,
            extraBoxRefs: data['extra-box-refs'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulateUnnamedResourcesAccessed = SimulateUnnamedResourcesAccessed;
/**
 * The set of parameters and limits override during simulation. If this set of
 * parameters is present, then evaluation parameters may differ from standard
 * evaluation in certain ways.
 */
class SimulationEvalOverrides extends basemodel_1.default {
    /**
     * Creates a new `SimulationEvalOverrides` object.
     * @param allowEmptySignatures - If true, transactions without signatures are allowed and simulated as if they
     * were properly signed.
     * @param allowUnnamedResources - If true, allows access to unnamed resources during simulation.
     * @param extraOpcodeBudget - The extra opcode budget added to each transaction group during simulation
     * @param maxLogCalls - The maximum log calls one can make during simulation
     * @param maxLogSize - The maximum byte number to log during simulation
     */
    constructor({ allowEmptySignatures, allowUnnamedResources, extraOpcodeBudget, maxLogCalls, maxLogSize, }) {
        super();
        this.allowEmptySignatures = allowEmptySignatures;
        this.allowUnnamedResources = allowUnnamedResources;
        this.extraOpcodeBudget = extraOpcodeBudget;
        this.maxLogCalls = maxLogCalls;
        this.maxLogSize = maxLogSize;
        this.attribute_map = {
            allowEmptySignatures: 'allow-empty-signatures',
            allowUnnamedResources: 'allow-unnamed-resources',
            extraOpcodeBudget: 'extra-opcode-budget',
            maxLogCalls: 'max-log-calls',
            maxLogSize: 'max-log-size',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        return new SimulationEvalOverrides({
            allowEmptySignatures: data['allow-empty-signatures'],
            allowUnnamedResources: data['allow-unnamed-resources'],
            extraOpcodeBudget: data['extra-opcode-budget'],
            maxLogCalls: data['max-log-calls'],
            maxLogSize: data['max-log-size'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulationEvalOverrides = SimulationEvalOverrides;
/**
 * The set of trace information and effect from evaluating a single opcode.
 */
class SimulationOpcodeTraceUnit extends basemodel_1.default {
    /**
     * Creates a new `SimulationOpcodeTraceUnit` object.
     * @param pc - The program counter of the current opcode being evaluated.
     * @param scratchChanges - The writes into scratch slots.
     * @param spawnedInners - The indexes of the traces for inner transactions spawned by this opcode, if any.
     * @param stackAdditions - The values added by this opcode to the stack.
     * @param stackPopCount - The number of deleted stack values by this opcode.
     * @param stateChanges - The operations against the current application's states.
     */
    constructor({ pc, scratchChanges, spawnedInners, stackAdditions, stackPopCount, stateChanges, }) {
        super();
        this.pc = pc;
        this.scratchChanges = scratchChanges;
        this.spawnedInners = spawnedInners;
        this.stackAdditions = stackAdditions;
        this.stackPopCount = stackPopCount;
        this.stateChanges = stateChanges;
        this.attribute_map = {
            pc: 'pc',
            scratchChanges: 'scratch-changes',
            spawnedInners: 'spawned-inners',
            stackAdditions: 'stack-additions',
            stackPopCount: 'stack-pop-count',
            stateChanges: 'state-changes',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['pc'] === 'undefined')
            throw new Error(`Response is missing required field 'pc': ${data}`);
        return new SimulationOpcodeTraceUnit({
            pc: data['pc'],
            scratchChanges: typeof data['scratch-changes'] !== 'undefined'
                ? data['scratch-changes'].map(ScratchChange.from_obj_for_encoding)
                : undefined,
            spawnedInners: data['spawned-inners'],
            stackAdditions: typeof data['stack-additions'] !== 'undefined'
                ? data['stack-additions'].map(AvmValue.from_obj_for_encoding)
                : undefined,
            stackPopCount: data['stack-pop-count'],
            stateChanges: typeof data['state-changes'] !== 'undefined'
                ? data['state-changes'].map(ApplicationStateOperation.from_obj_for_encoding)
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulationOpcodeTraceUnit = SimulationOpcodeTraceUnit;
/**
 * The execution trace of calling an app or a logic sig, containing the inner app
 * call trace in a recursive way.
 */
class SimulationTransactionExecTrace extends basemodel_1.default {
    /**
     * Creates a new `SimulationTransactionExecTrace` object.
     * @param approvalProgramHash - SHA512_256 hash digest of the approval program executed in transaction.
     * @param approvalProgramTrace - Program trace that contains a trace of opcode effects in an approval program.
     * @param clearStateProgramHash - SHA512_256 hash digest of the clear state program executed in transaction.
     * @param clearStateProgramTrace - Program trace that contains a trace of opcode effects in a clear state program.
     * @param clearStateRollback - If true, indicates that the clear state program failed and any persistent state
     * changes it produced should be reverted once the program exits.
     * @param clearStateRollbackError - The error message explaining why the clear state program failed. This field will
     * only be populated if clear-state-rollback is true and the failure was due to an
     * execution error.
     * @param innerTrace - An array of SimulationTransactionExecTrace representing the execution trace of
     * any inner transactions executed.
     * @param logicSigHash - SHA512_256 hash digest of the logic sig executed in transaction.
     * @param logicSigTrace - Program trace that contains a trace of opcode effects in a logic sig.
     */
    constructor({ approvalProgramHash, approvalProgramTrace, clearStateProgramHash, clearStateProgramTrace, clearStateRollback, clearStateRollbackError, innerTrace, logicSigHash, logicSigTrace, }) {
        super();
        this.approvalProgramHash =
            typeof approvalProgramHash === 'string'
                ? (0, binarydata_1.base64ToBytes)(approvalProgramHash)
                : approvalProgramHash;
        this.approvalProgramTrace = approvalProgramTrace;
        this.clearStateProgramHash =
            typeof clearStateProgramHash === 'string'
                ? (0, binarydata_1.base64ToBytes)(clearStateProgramHash)
                : clearStateProgramHash;
        this.clearStateProgramTrace = clearStateProgramTrace;
        this.clearStateRollback = clearStateRollback;
        this.clearStateRollbackError = clearStateRollbackError;
        this.innerTrace = innerTrace;
        this.logicSigHash =
            typeof logicSigHash === 'string'
                ? (0, binarydata_1.base64ToBytes)(logicSigHash)
                : logicSigHash;
        this.logicSigTrace = logicSigTrace;
        this.attribute_map = {
            approvalProgramHash: 'approval-program-hash',
            approvalProgramTrace: 'approval-program-trace',
            clearStateProgramHash: 'clear-state-program-hash',
            clearStateProgramTrace: 'clear-state-program-trace',
            clearStateRollback: 'clear-state-rollback',
            clearStateRollbackError: 'clear-state-rollback-error',
            innerTrace: 'inner-trace',
            logicSigHash: 'logic-sig-hash',
            logicSigTrace: 'logic-sig-trace',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        return new SimulationTransactionExecTrace({
            approvalProgramHash: data['approval-program-hash'],
            approvalProgramTrace: typeof data['approval-program-trace'] !== 'undefined'
                ? data['approval-program-trace'].map(SimulationOpcodeTraceUnit.from_obj_for_encoding)
                : undefined,
            clearStateProgramHash: data['clear-state-program-hash'],
            clearStateProgramTrace: typeof data['clear-state-program-trace'] !== 'undefined'
                ? data['clear-state-program-trace'].map(SimulationOpcodeTraceUnit.from_obj_for_encoding)
                : undefined,
            clearStateRollback: data['clear-state-rollback'],
            clearStateRollbackError: data['clear-state-rollback-error'],
            innerTrace: typeof data['inner-trace'] !== 'undefined'
                ? data['inner-trace'].map(SimulationTransactionExecTrace.from_obj_for_encoding)
                : undefined,
            logicSigHash: data['logic-sig-hash'],
            logicSigTrace: typeof data['logic-sig-trace'] !== 'undefined'
                ? data['logic-sig-trace'].map(SimulationOpcodeTraceUnit.from_obj_for_encoding)
                : undefined,
        });
        /* eslint-enable dot-notation */
    }
}
exports.SimulationTransactionExecTrace = SimulationTransactionExecTrace;
/**
 * Represents a state proof and its corresponding message
 */
class StateProof extends basemodel_1.default {
    /**
     * Creates a new `StateProof` object.
     * @param message - Represents the message that the state proofs are attesting to.
     * @param stateproof - The encoded StateProof for the message.
     */
    constructor({ message, stateproof, }) {
        super();
        this.message = message;
        this.stateproof =
            typeof stateproof === 'string' ? (0, binarydata_1.base64ToBytes)(stateproof) : stateproof;
        this.attribute_map = {
            message: 'Message',
            stateproof: 'StateProof',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['Message'] === 'undefined')
            throw new Error(`Response is missing required field 'Message': ${data}`);
        if (typeof data['StateProof'] === 'undefined')
            throw new Error(`Response is missing required field 'StateProof': ${data}`);
        return new StateProof({
            message: StateProofMessage.from_obj_for_encoding(data['Message']),
            stateproof: data['StateProof'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.StateProof = StateProof;
/**
 * Represents the message that the state proofs are attesting to.
 */
class StateProofMessage extends basemodel_1.default {
    /**
     * Creates a new `StateProofMessage` object.
     * @param blockheaderscommitment - The vector commitment root on all light block headers within a state proof
     * interval.
     * @param firstattestedround - The first round the message attests to.
     * @param lastattestedround - The last round the message attests to.
     * @param lnprovenweight - An integer value representing the natural log of the proven weight with 16 bits
     * of precision. This value would be used to verify the next state proof.
     * @param voterscommitment - The vector commitment root of the top N accounts to sign the next StateProof.
     */
    constructor({ blockheaderscommitment, firstattestedround, lastattestedround, lnprovenweight, voterscommitment, }) {
        super();
        this.blockheaderscommitment =
            typeof blockheaderscommitment === 'string'
                ? (0, binarydata_1.base64ToBytes)(blockheaderscommitment)
                : blockheaderscommitment;
        this.firstattestedround = firstattestedround;
        this.lastattestedround = lastattestedround;
        this.lnprovenweight = lnprovenweight;
        this.voterscommitment =
            typeof voterscommitment === 'string'
                ? (0, binarydata_1.base64ToBytes)(voterscommitment)
                : voterscommitment;
        this.attribute_map = {
            blockheaderscommitment: 'BlockHeadersCommitment',
            firstattestedround: 'FirstAttestedRound',
            lastattestedround: 'LastAttestedRound',
            lnprovenweight: 'LnProvenWeight',
            voterscommitment: 'VotersCommitment',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['BlockHeadersCommitment'] === 'undefined')
            throw new Error(`Response is missing required field 'BlockHeadersCommitment': ${data}`);
        if (typeof data['FirstAttestedRound'] === 'undefined')
            throw new Error(`Response is missing required field 'FirstAttestedRound': ${data}`);
        if (typeof data['LastAttestedRound'] === 'undefined')
            throw new Error(`Response is missing required field 'LastAttestedRound': ${data}`);
        if (typeof data['LnProvenWeight'] === 'undefined')
            throw new Error(`Response is missing required field 'LnProvenWeight': ${data}`);
        if (typeof data['VotersCommitment'] === 'undefined')
            throw new Error(`Response is missing required field 'VotersCommitment': ${data}`);
        return new StateProofMessage({
            blockheaderscommitment: data['BlockHeadersCommitment'],
            firstattestedround: data['FirstAttestedRound'],
            lastattestedround: data['LastAttestedRound'],
            lnprovenweight: data['LnProvenWeight'],
            voterscommitment: data['VotersCommitment'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.StateProofMessage = StateProofMessage;
/**
 * Supply represents the current supply of MicroAlgos in the system.
 */
class SupplyResponse extends basemodel_1.default {
    /**
     * Creates a new `SupplyResponse` object.
     * @param currentRound - Round
     * @param onlineMoney - OnlineMoney
     * @param totalMoney - TotalMoney
     */
    constructor({ currentRound, onlineMoney, totalMoney, }) {
        super();
        this.currentRound = currentRound;
        this.onlineMoney = onlineMoney;
        this.totalMoney = totalMoney;
        this.attribute_map = {
            currentRound: 'current_round',
            onlineMoney: 'online-money',
            totalMoney: 'total-money',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['current_round'] === 'undefined')
            throw new Error(`Response is missing required field 'current_round': ${data}`);
        if (typeof data['online-money'] === 'undefined')
            throw new Error(`Response is missing required field 'online-money': ${data}`);
        if (typeof data['total-money'] === 'undefined')
            throw new Error(`Response is missing required field 'total-money': ${data}`);
        return new SupplyResponse({
            currentRound: data['current_round'],
            onlineMoney: data['online-money'],
            totalMoney: data['total-money'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.SupplyResponse = SupplyResponse;
/**
 * Represents a key-value pair in an application store.
 */
class TealKeyValue extends basemodel_1.default {
    /**
     * Creates a new `TealKeyValue` object.
     * @param key -
     * @param value - Represents a TEAL value.
     */
    constructor({ key, value }) {
        super();
        this.key = key;
        this.value = value;
        this.attribute_map = {
            key: 'key',
            value: 'value',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['key'] === 'undefined')
            throw new Error(`Response is missing required field 'key': ${data}`);
        if (typeof data['value'] === 'undefined')
            throw new Error(`Response is missing required field 'value': ${data}`);
        return new TealKeyValue({
            key: data['key'],
            value: TealValue.from_obj_for_encoding(data['value']),
        });
        /* eslint-enable dot-notation */
    }
}
exports.TealKeyValue = TealKeyValue;
/**
 * Represents a TEAL value.
 */
class TealValue extends basemodel_1.default {
    /**
     * Creates a new `TealValue` object.
     * @param type - (tt) value type. Value `1` refers to **bytes**, value `2` refers to **uint**
     * @param bytes - (tb) bytes value.
     * @param uint - (ui) uint value.
     */
    constructor({ type, bytes, uint, }) {
        super();
        this.type = type;
        this.bytes = bytes;
        this.uint = uint;
        this.attribute_map = {
            type: 'type',
            bytes: 'bytes',
            uint: 'uint',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['type'] === 'undefined')
            throw new Error(`Response is missing required field 'type': ${data}`);
        if (typeof data['bytes'] === 'undefined')
            throw new Error(`Response is missing required field 'bytes': ${data}`);
        if (typeof data['uint'] === 'undefined')
            throw new Error(`Response is missing required field 'uint': ${data}`);
        return new TealValue({
            type: data['type'],
            bytes: data['bytes'],
            uint: data['uint'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.TealValue = TealValue;
/**
 * Response containing all ledger state deltas for transaction groups, with their
 * associated Ids, in a single round.
 */
class TransactionGroupLedgerStateDeltasForRoundResponse extends basemodel_1.default {
    /**
     * Creates a new `TransactionGroupLedgerStateDeltasForRoundResponse` object.
     * @param deltas -
     */
    constructor({ deltas }) {
        super();
        this.deltas = deltas;
        this.attribute_map = {
            deltas: 'Deltas',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (!Array.isArray(data['Deltas']))
            throw new Error(`Response is missing required array field 'Deltas': ${data}`);
        return new TransactionGroupLedgerStateDeltasForRoundResponse({
            deltas: data['Deltas'].map(LedgerStateDeltaForTransactionGroup.from_obj_for_encoding),
        });
        /* eslint-enable dot-notation */
    }
}
exports.TransactionGroupLedgerStateDeltasForRoundResponse = TransactionGroupLedgerStateDeltasForRoundResponse;
/**
 * TransactionParams contains the parameters that help a client construct a new
 * transaction.
 */
class TransactionParametersResponse extends basemodel_1.default {
    /**
     * Creates a new `TransactionParametersResponse` object.
     * @param consensusVersion - ConsensusVersion indicates the consensus protocol version
     * as of LastRound.
     * @param fee - Fee is the suggested transaction fee
     * Fee is in units of micro-Algos per byte.
     * Fee may fall to zero but transactions must still have a fee of
     * at least MinTxnFee for the current network protocol.
     * @param genesisHash - GenesisHash is the hash of the genesis block.
     * @param genesisId - GenesisID is an ID listed in the genesis block.
     * @param lastRound - LastRound indicates the last round seen
     * @param minFee - The minimum transaction fee (not per byte) required for the
     * txn to validate for the current network protocol.
     */
    constructor({ consensusVersion, fee, genesisHash, genesisId, lastRound, minFee, }) {
        super();
        this.consensusVersion = consensusVersion;
        this.fee = fee;
        this.genesisHash =
            typeof genesisHash === 'string'
                ? (0, binarydata_1.base64ToBytes)(genesisHash)
                : genesisHash;
        this.genesisId = genesisId;
        this.lastRound = lastRound;
        this.minFee = minFee;
        this.attribute_map = {
            consensusVersion: 'consensus-version',
            fee: 'fee',
            genesisHash: 'genesis-hash',
            genesisId: 'genesis-id',
            lastRound: 'last-round',
            minFee: 'min-fee',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['consensus-version'] === 'undefined')
            throw new Error(`Response is missing required field 'consensus-version': ${data}`);
        if (typeof data['fee'] === 'undefined')
            throw new Error(`Response is missing required field 'fee': ${data}`);
        if (typeof data['genesis-hash'] === 'undefined')
            throw new Error(`Response is missing required field 'genesis-hash': ${data}`);
        if (typeof data['genesis-id'] === 'undefined')
            throw new Error(`Response is missing required field 'genesis-id': ${data}`);
        if (typeof data['last-round'] === 'undefined')
            throw new Error(`Response is missing required field 'last-round': ${data}`);
        if (typeof data['min-fee'] === 'undefined')
            throw new Error(`Response is missing required field 'min-fee': ${data}`);
        return new TransactionParametersResponse({
            consensusVersion: data['consensus-version'],
            fee: data['fee'],
            genesisHash: data['genesis-hash'],
            genesisId: data['genesis-id'],
            lastRound: data['last-round'],
            minFee: data['min-fee'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.TransactionParametersResponse = TransactionParametersResponse;
/**
 * Proof of transaction in a block.
 */
class TransactionProofResponse extends basemodel_1.default {
    /**
     * Creates a new `TransactionProofResponse` object.
     * @param idx - Index of the transaction in the block's payset.
     * @param proof - Proof of transaction membership.
     * @param stibhash - Hash of SignedTxnInBlock for verifying proof.
     * @param treedepth - Represents the depth of the tree that is being proven, i.e. the number of edges
     * from a leaf to the root.
     * @param hashtype - The type of hash function used to create the proof, must be one of:
     * * sha512_256
     * * sha256
     */
    constructor({ idx, proof, stibhash, treedepth, hashtype, }) {
        super();
        this.idx = idx;
        this.proof = typeof proof === 'string' ? (0, binarydata_1.base64ToBytes)(proof) : proof;
        this.stibhash =
            typeof stibhash === 'string' ? (0, binarydata_1.base64ToBytes)(stibhash) : stibhash;
        this.treedepth = treedepth;
        this.hashtype = hashtype;
        this.attribute_map = {
            idx: 'idx',
            proof: 'proof',
            stibhash: 'stibhash',
            treedepth: 'treedepth',
            hashtype: 'hashtype',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['idx'] === 'undefined')
            throw new Error(`Response is missing required field 'idx': ${data}`);
        if (typeof data['proof'] === 'undefined')
            throw new Error(`Response is missing required field 'proof': ${data}`);
        if (typeof data['stibhash'] === 'undefined')
            throw new Error(`Response is missing required field 'stibhash': ${data}`);
        if (typeof data['treedepth'] === 'undefined')
            throw new Error(`Response is missing required field 'treedepth': ${data}`);
        return new TransactionProofResponse({
            idx: data['idx'],
            proof: data['proof'],
            stibhash: data['stibhash'],
            treedepth: data['treedepth'],
            hashtype: data['hashtype'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.TransactionProofResponse = TransactionProofResponse;
/**
 * algod version information.
 */
class Version extends basemodel_1.default {
    /**
     * Creates a new `Version` object.
     * @param build -
     * @param genesisHashB64 -
     * @param genesisId -
     * @param versions -
     */
    constructor({ build, genesisHashB64, genesisId, versions, }) {
        super();
        this.build = build;
        this.genesisHashB64 =
            typeof genesisHashB64 === 'string'
                ? (0, binarydata_1.base64ToBytes)(genesisHashB64)
                : genesisHashB64;
        this.genesisId = genesisId;
        this.versions = versions;
        this.attribute_map = {
            build: 'build',
            genesisHashB64: 'genesis_hash_b64',
            genesisId: 'genesis_id',
            versions: 'versions',
        };
    }
    // eslint-disable-next-line camelcase
    static from_obj_for_encoding(data) {
        /* eslint-disable dot-notation */
        if (typeof data['build'] === 'undefined')
            throw new Error(`Response is missing required field 'build': ${data}`);
        if (typeof data['genesis_hash_b64'] === 'undefined')
            throw new Error(`Response is missing required field 'genesis_hash_b64': ${data}`);
        if (typeof data['genesis_id'] === 'undefined')
            throw new Error(`Response is missing required field 'genesis_id': ${data}`);
        if (!Array.isArray(data['versions']))
            throw new Error(`Response is missing required array field 'versions': ${data}`);
        return new Version({
            build: BuildVersion.from_obj_for_encoding(data['build']),
            genesisHashB64: data['genesis_hash_b64'],
            genesisId: data['genesis_id'],
            versions: data['versions'],
        });
        /* eslint-enable dot-notation */
    }
}
exports.Version = Version;
