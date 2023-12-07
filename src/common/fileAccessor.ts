export interface FileAccessor {
  isWindows: boolean;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, contents: Uint8Array): Promise<void>;
  filePathRelativeTo(base: string, filePath: string): string;
  basename(path: string): string;
}
