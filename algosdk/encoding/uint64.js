"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeUint64 = exports.encodeUint64 = void 0;
const utils_1 = require("../utils/utils");
// NOTE: at the moment we specifically do not use Buffer.writeBigUInt64BE and
// Buffer.readBigUInt64BE. This is because projects using webpack v4
// automatically include an old version of the npm `buffer` package (v4.9.2 at
// the time of writing), and this old version does not have these methods.
/**
 * encodeUint64 converts an integer to its binary representation.
 * @param num - The number to convert. This must be an unsigned integer less than
 *   2^64.
 * @returns An 8-byte typed array containing the big-endian encoding of the input
 *   integer.
 */
function encodeUint64(num) {
    const isInteger = typeof num === 'bigint' || Number.isInteger(num);
    if (!isInteger || num < 0 || num > BigInt('0xffffffffffffffff')) {
        throw new Error('Input is not a 64-bit unsigned integer');
    }
    const encoding = new Uint8Array(8);
    const view = new DataView(encoding.buffer);
    view.setBigUint64(0, BigInt(num));
    return encoding;
}
exports.encodeUint64 = encodeUint64;
function decodeUint64(data, decodingMode = 'safe') {
    if (decodingMode !== 'safe' &&
        decodingMode !== 'mixed' &&
        decodingMode !== 'bigint') {
        throw new Error(`Unknown decodingMode option: ${decodingMode}`);
    }
    if (data.byteLength === 0 || data.byteLength > 8) {
        throw new Error(`Data has unacceptable length. Expected length is between 1 and 8, got ${data.byteLength}`);
    }
    // insert 0s at the beginning if data is smaller than 8 bytes
    const padding = new Uint8Array(8 - data.byteLength);
    const encoding = (0, utils_1.concatArrays)(padding, data);
    const view = new DataView(encoding.buffer);
    const num = view.getBigUint64(0);
    const isBig = num > BigInt(Number.MAX_SAFE_INTEGER);
    if (decodingMode === 'safe') {
        if (isBig) {
            throw new Error(`Integer exceeds maximum safe integer: ${num.toString()}. Try decoding with "mixed" or "safe" decodingMode.`);
        }
        return Number(num);
    }
    if (decodingMode === 'mixed' && !isBig) {
        return Number(num);
    }
    return num;
}
exports.decodeUint64 = decodeUint64;
//# sourceMappingURL=uint64.js.map