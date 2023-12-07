import { readFile, writeFile } from 'fs/promises';
import { basename } from 'path';
import { FileAccessor } from '../common';
import * as path from 'path';

export const nodeFileAccessor: FileAccessor = {
  isWindows: process.platform === 'win32',
  readFile(path: string): Promise<Uint8Array> {
    return readFile(path);
  },
  writeFile(path: string, contents: Uint8Array): Promise<void> {
    return writeFile(path, contents);
  },
  basename(path: string): string {
    return basename(path);
  },
  filePathRelativeTo: function (base: string, filePath: string): string {
    // Create a URL object with the file protocol and the base path
    const baseURL = new URL(base, 'file:///');

    // Resolve the file path against the base URL
    const fullURL = new URL(filePath, baseURL);

    // Convert the URL back to a local file path
    // On Windows, this will correctly handle the drive letter and convert to backslashes
    const resolvedPath = path.resolve(fullURL.pathname);

    // Normalize the resolved path to ensure it's in the correct format for the current OS
    if (this.isWindows) {
      return resolvedPath.replace(/\//g, '\\');
    } else {
      return resolvedPath.replace(/\\/g, '/');
    }
  },
};
