import * as algosdk from 'algosdk';
import { FileAccessor } from './fileAccessor';

/**
 * Attempt to decode the given data as UTF-8 and return the result if it is
 * valid UTF-8. Otherwise, return undefined.
 */
export function utf8Decode(data: Uint8Array): string | undefined {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    return decoder.decode(data);
  } catch {
    return undefined;
  }
}

/**
 * Normalize the given file path.
 *
 * On Windows, this will replace all forward slashes with backslashes and convert
 * the path to lowercase, since Windows paths are case-insensitive.
 */
export function normalizePathAndCasing(
  fileAccessor: FileAccessor,
  filePath: string,
) {
  if (fileAccessor.isWindows) {
    // Normalize path to lowercase on Windows, since it is case-insensitive
    return filePath.replace(/\//g, '\\').toLowerCase();
  } else {
    return filePath.replace(/\\/g, '/');
  }
}

export function limitArray<T>(
  array: Array<T>,
  start?: number,
  count?: number,
): Array<T> {
  if (start === undefined) {
    start = 0;
  }
  if (count === undefined) {
    count = array.length;
  }
  if (start < 0) {
    start = 0;
  }
  if (count < 0) {
    count = 0;
  }
  if (start >= array.length) {
    return [];
  }
  if (start + count > array.length) {
    count = array.length - start;
  }
  return array.slice(start, start + count);
}

export class ByteArrayMap<T> {
  private map: Map<string, T>;

  constructor(entries?: Iterable<[Uint8Array, T]> | null) {
    this.map = new Map<string, T>();
    for (const [key, value] of entries || []) {
      this.set(key, value);
    }
  }

  public get size(): number {
    return this.map.size;
  }

  public set(key: Uint8Array, value: T): void {
    this.map.set(algosdk.bytesToHex(key), value);
  }

  public setHex(key: string, value: T): void {
    this.map.set(key, value);
  }

  public get(key: Uint8Array): T | undefined {
    return this.map.get(algosdk.bytesToHex(key));
  }

  public getHex(key: string): T | undefined {
    return this.map.get(key);
  }

  public hasHex(key: string): boolean {
    return this.map.has(key);
  }

  public has(key: Uint8Array): boolean {
    return this.map.has(algosdk.bytesToHex(key));
  }

  public delete(key: Uint8Array): boolean {
    return this.map.delete(algosdk.bytesToHex(key));
  }

  public deleteHex(key: string): boolean {
    return this.map.delete(key);
  }

  public clear(): void {
    this.map.clear();
  }

  public *entries(): IterableIterator<[Uint8Array, T]> {
    for (const [key, value] of this.map.entries()) {
      yield [algosdk.hexToBytes(key), value];
    }
  }

  public entriesHex(): IterableIterator<[string, T]> {
    return this.map.entries();
  }

  public clone(): ByteArrayMap<T> {
    const clone = new ByteArrayMap<T>();
    clone.map = new Map(this.map.entries());
    return clone;
  }
}

interface ProgramSourceEntryFile {
  'txn-group-sources': ProgramSourceEntry[];
}

interface ProgramSourceEntry {
  hash: string;
  'sourcemap-location': string;
}

export class ProgramSourceDescriptor {
  public readonly fileAccessor: FileAccessor;
  public readonly sourcemapFileLocation: string;
  public readonly sourcemap: algosdk.ProgramSourceMap;
  public readonly hash: Uint8Array;

  constructor({
    fileAccessor,
    sourcemapFileLocation,
    sourcemap,
    hash,
  }: {
    fileAccessor: FileAccessor;
    sourcemapFileLocation: string;
    sourcemap: algosdk.ProgramSourceMap;
    hash: Uint8Array;
  }) {
    this.fileAccessor = fileAccessor;
    this.sourcemapFileLocation = sourcemapFileLocation;
    this.sourcemap = sourcemap;
    this.hash = hash;
  }

  public sourcePaths(): string[] {
    return this.sourcemap.sources.map((_, index) =>
      this.getFullSourcePath(index),
    );
  }

  public getFullSourcePath(index: number): string {
    return normalizePathAndCasing(
      this.fileAccessor,
      this.fileAccessor.filePathRelativeTo(
        this.sourcemapFileLocation,
        this.sourcemap.sources[index],
      ),
    );
  }

  static async fromJSONObj(
    fileAccessor: FileAccessor,
    originFile: string,
    data: ProgramSourceEntry,
  ): Promise<ProgramSourceDescriptor> {
    const sourcemapFileLocation = normalizePathAndCasing(
      fileAccessor,
      fileAccessor.filePathRelativeTo(originFile, data['sourcemap-location']),
    );
    const rawSourcemap = await prefixPotentialError(
      fileAccessor.readFile(sourcemapFileLocation),
      'Could not read source map file',
    );
    const sourcemap = new algosdk.ProgramSourceMap(
      JSON.parse(new TextDecoder().decode(rawSourcemap)),
    );

    return new ProgramSourceDescriptor({
      fileAccessor,
      sourcemapFileLocation,
      sourcemap,
      hash: algosdk.base64ToBytes(data.hash),
    });
  }
}

export class ProgramSourceDescriptorRegistry {
  private registry: ByteArrayMap<ProgramSourceDescriptor>;

  constructor({
    txnGroupSources,
  }: {
    txnGroupSources: ProgramSourceDescriptor[];
  }) {
    this.registry = new ByteArrayMap(
      txnGroupSources.map((source) => [source.hash, source]),
    );
  }

  public findByHash(hash: Uint8Array): ProgramSourceDescriptor | undefined {
    return this.registry.get(hash);
  }

  static async loadFromFile(
    fileAccessor: FileAccessor,
    programSourcesDescriptionFilePath: string,
  ): Promise<ProgramSourceDescriptorRegistry> {
    const rawSourcesDescription = await prefixPotentialError(
      fileAccessor.readFile(programSourcesDescriptionFilePath),
      'Could not read program sources description file',
    );
    let jsonSourcesDescription: ProgramSourceEntryFile;
    try {
      jsonSourcesDescription = JSON.parse(
        new TextDecoder().decode(rawSourcesDescription),
      ) as ProgramSourceEntryFile;
      if (
        !Array.isArray(jsonSourcesDescription['txn-group-sources']) ||
        !jsonSourcesDescription['txn-group-sources'].every(
          (entry) =>
            typeof entry.hash === 'string' &&
            typeof entry['sourcemap-location'] === 'string',
        )
      ) {
        throw new Error('Invalid program sources description file');
      }
    } catch (e) {
      const err = e as Error;
      throw new Error(
        `Could not parse program sources description file from '${programSourcesDescriptionFilePath}': ${err.message}`,
      );
    }
    const programSources = jsonSourcesDescription['txn-group-sources'].map(
      (source) =>
        ProgramSourceDescriptor.fromJSONObj(
          fileAccessor,
          programSourcesDescriptionFilePath,
          source,
        ),
    );
    return new ProgramSourceDescriptorRegistry({
      txnGroupSources: await Promise.all(programSources),
    });
  }
}

export class AvmDebuggingAssets {
  constructor(
    public readonly simulateResponse: algosdk.modelsv2.SimulateResponse,
    public readonly programSourceDescriptorRegistry: ProgramSourceDescriptorRegistry,
  ) {}

  static async loadFromFiles(
    fileAccessor: FileAccessor,
    simulateTraceFilePath: string,
    programSourcesDescriptionFilePath: string,
  ): Promise<AvmDebuggingAssets> {
    const rawSimulateTrace = await prefixPotentialError(
      fileAccessor.readFile(simulateTraceFilePath),
      'Could not read simulate trace file',
    );
    let simulateResponse: algosdk.modelsv2.SimulateResponse;
    try {
      simulateResponse = algosdk.decodeJSON(
        algosdk.bytesToString(rawSimulateTrace),
        algosdk.modelsv2.SimulateResponse,
      );
      if (simulateResponse.version !== 2) {
        throw new Error(
          `Unsupported simulate response version: ${simulateResponse.version}`,
        );
      }
      if (!simulateResponse.execTraceConfig?.enable) {
        throw new Error(
          `Simulate response does not contain trace data. execTraceConfig=${
            simulateResponse.execTraceConfig
              ? algosdk.encodeJSON(simulateResponse.execTraceConfig)
              : simulateResponse.execTraceConfig
          }`,
        );
      }
    } catch (e) {
      const err = e as Error;
      throw new Error(
        `Could not parse simulate trace file from '${simulateTraceFilePath}': ${err.message}`,
      );
    }

    const txnGroupDescriptorList =
      await ProgramSourceDescriptorRegistry.loadFromFile(
        fileAccessor,
        programSourcesDescriptionFilePath,
      );

    return new AvmDebuggingAssets(simulateResponse, txnGroupDescriptorList);
  }
}

function prefixPotentialError<T>(task: Promise<T>, prefix: string): Promise<T> {
  return task.catch((error) => {
    throw new Error(`${prefix}: ${error.message}`);
  });
}
