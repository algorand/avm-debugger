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
  filePathRelativeTo(base: string, filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    if (!base.endsWith(path.sep)) {
      // If the base path is not a directory, get its parent directory
      base = path.dirname(base);
    }
    return path.join(base, filePath);
  },
};
