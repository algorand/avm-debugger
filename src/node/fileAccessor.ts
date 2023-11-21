import { readFile, writeFile } from 'fs/promises';
import { basename } from 'path';
import { FileAccessor } from '../common';

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
};
