"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexToBytes = exports.bytesToHex = exports.coerceToBytes = exports.bytesToBase64 = exports.base64ToString = exports.base64ToBytes = void 0;
const utils_1 = require("../utils/utils");
/**
 * Convert a base64 string to a Uint8Array for Node.js and browser environments.
 * @returns A Uint8Array
 */
function base64ToBytes(base64String) {
    if ((0, utils_1.isNode)()) {
        return new Uint8Array(Buffer.from(base64String, 'base64'));
    }
    /* eslint-env browser */
    const binString = atob(base64String);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
}
exports.base64ToBytes = base64ToBytes;
/**
 * Decode a base64 string for Node.js and browser environments.
 * @returns A decoded string
 */
function base64ToString(base64String) {
    if ((0, utils_1.isNode)()) {
        return Buffer.from(base64String, 'base64').toString();
    }
    const binString = base64ToBytes(base64String);
    return new TextDecoder().decode(binString);
}
exports.base64ToString = base64ToString;
/**
 * Convert a Uint8Array to a base64 string for Node.js and browser environments.
 * @returns A base64 string
 */
function bytesToBase64(byteArray) {
    if ((0, utils_1.isNode)()) {
        return Buffer.from(byteArray).toString('base64');
    }
    /* eslint-env browser */
    const binString = Array.from(byteArray, (x) => String.fromCodePoint(x)).join('');
    return btoa(binString);
}
exports.bytesToBase64 = bytesToBase64;
/**
 * Returns a Uint8Array given an input string or Uint8Array.
 * @returns A base64 string
 */
function coerceToBytes(input) {
    if (typeof input === 'string') {
        return new TextEncoder().encode(input);
    }
    return input;
}
exports.coerceToBytes = coerceToBytes;
/**
 * Convert a Uint8Array to a hex string for Node.js and browser environments.
 * @returns A hex string
 */
function bytesToHex(byteArray) {
    if ((0, utils_1.isNode)()) {
        return Buffer.from(byteArray).toString('hex');
    }
    return Array.from(byteArray)
        .map((i) => i.toString(16).padStart(2, '0'))
        .join('');
}
exports.bytesToHex = bytesToHex;
/**
 * Convert a hex string to Uint8Array for Node.js and browser environments.
 * @returns A Uint8Array
 */
function hexToBytes(hexString) {
    if ((0, utils_1.isNode)()) {
        return Buffer.from(hexString, 'hex');
    }
    let hex = hexString;
    if (hexString.length % 2 !== 0) {
        hex = hexString.padStart(1, '0');
    }
    const byteArray = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length / 2; i++) {
        byteArray[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
    }
    return byteArray;
}
exports.hexToBytes = hexToBytes;
//# sourceMappingURL=binarydata.js.map