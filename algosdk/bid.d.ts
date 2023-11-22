import { Address } from './types/address';
interface BidStorageStructure {
    bidderKey: Address;
    bidAmount: number;
    bidID: number;
    auctionKey: Address;
    auctionID: number;
    maxPrice: number;
}
export declare type BidOptions = Omit<BidStorageStructure, 'bidderKey' | 'auctionKey'> & {
    bidderKey: string;
    auctionKey: string;
};
/**
 * Bid enables construction of Algorand Auctions Bids
 * */
export default class Bid implements BidStorageStructure {
    name: string;
    tag: Uint8Array;
    bidderKey: Address;
    bidAmount: number;
    bidID: number;
    auctionKey: Address;
    auctionID: number;
    maxPrice: number;
    constructor({ bidderKey, bidAmount, bidID, auctionKey, auctionID, maxPrice, }: BidOptions);
    get_obj_for_encoding(): {
        bidder: Uint8Array;
        cur: number;
        price: number;
        id: number;
        auc: Uint8Array;
        aid: number;
    };
    signBid(sk: Uint8Array): Uint8Array;
}
export {};
