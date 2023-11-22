/**
 * Convert a base64 string to a Uint8Array for Node.js and browser environments.
 * @returns A Uint8Array
 */
export declare function base64ToBytes(base64String: string): Uint8Array;
/**
 * Decode a base64 string for Node.js and browser environments.
 * @returns A decoded string
 */
export declare function base64ToString(base64String: string): string;
/**
 * Convert a Uint8Array to a base64 string for Node.js and browser environments.
 * @returns A base64 string
 */
export declare function bytesToBase64(byteArray: Uint8Array): string;
/**
 * Returns a Uint8Array given an input string or Uint8Array.
 * @returns A base64 string
 */
export declare function coerceToBytes(input: Uint8Array | string): Uint8Array;
/**
 * Convert a Uint8Array to a hex string for Node.js and browser environments.
 * @returns A hex string
 */
export declare function bytesToHex(byteArray: Uint8Array): string;
/**
 * Convert a hex string to Uint8Array for Node.js and browser environments.
 * @returns A Uint8Array
 */
export declare function hexToBytes(hexString: string): Uint8Array;
