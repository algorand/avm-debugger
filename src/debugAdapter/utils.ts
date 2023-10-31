import * as path from 'path';
import * as JSONbigWithoutConfig from 'json-bigint';
import * as algosdk from 'algosdk';

export interface FileAccessor {
  isWindows: boolean;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, contents: Uint8Array): Promise<void>;
}

export function isAsciiPrintable(data: Uint8Array): boolean {
  for (let i = 0; i < data.length; i++) {
    if (data[i] < 32 || data[i] > 126) {
      return false;
    }
  }
  return true;
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

// TODO: replace with algosdk.parseJson once it is available in v3
export function parseJsonWithBigints(json: string): any {
  // Our tests wants this lib to be imported as `import * as JSONbig from 'json-bigint';`,
  // but running this in vscode wants it to be imported as `import JSONbig from 'json-bigint';`.
  // This is a hack to allow both.
  let target = JSONbigWithoutConfig;
  if (target.default) {
    target = target.default;
  }
  const JSON_BIG = target({ useNativeBigInt: true, strict: true });
  return JSON_BIG.parse(json);
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
    this.map.set(Buffer.from(key).toString('hex'), value);
  }

  public setHex(key: string, value: T): void {
    this.map.set(key, value);
  }

  public get(key: Uint8Array): T | undefined {
    return this.map.get(Buffer.from(key).toString('hex'));
  }

  public getHex(key: string): T | undefined {
    return this.map.get(key);
  }

  public hasHex(key: string): boolean {
    return this.map.has(key);
  }

  public has(key: Uint8Array): boolean {
    return this.map.has(Buffer.from(key).toString('hex'));
  }

  public delete(key: Uint8Array): boolean {
    return this.map.delete(Buffer.from(key).toString('hex'));
  }

  public deleteHex(key: string): boolean {
    return this.map.delete(key);
  }

  public clear(): void {
    this.map.clear();
  }

  public *entries(): IterableIterator<[Uint8Array, T]> {
    for (const [key, value] of this.map.entries()) {
      yield [Buffer.from(key, 'hex'), value];
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

function filePathRelativeTo(base: string, filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.join(path.dirname(base), filePath);
}

export class TxnGroupSourceDescriptor {
  public readonly sourcemapFileLocation: string;
  public readonly sourcemap: algosdk.SourceMap;
  public readonly hash: string;

  constructor({
    sourcemapFileLocation,
    sourcemap,
    hash,
  }: {
    sourcemapFileLocation: string;
    sourcemap: algosdk.SourceMap;
    hash: string;
  }) {
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
    return filePathRelativeTo(
      this.sourcemapFileLocation,
      this.sourcemap.sources[index],
    );
  }

  static async fromJSONObj(
    fileAccessor: FileAccessor,
    originFile: string,
    data: Record<string, any>,
  ): Promise<TxnGroupSourceDescriptor> {
    const sourcemapFileLocation = filePathRelativeTo(
      originFile,
      data['sourcemap-location'],
    );
    const rawSourcemap = Buffer.from(
      await fileAccessor.readFile(sourcemapFileLocation),
    );
    const sourcemap = new algosdk.SourceMap(
      JSON.parse(rawSourcemap.toString('utf-8')),
    );

    return new TxnGroupSourceDescriptor({
      sourcemapFileLocation,
      sourcemap,
      hash: data['hash'],
    });
  }
}

export class TxnGroupSourceDescriptorList {
  private _txnGroupSources: Array<TxnGroupSourceDescriptor>;

  constructor({
    txnGroupSources,
  }: {
    txnGroupSources: Array<TxnGroupSourceDescriptor>;
  }) {
    this._txnGroupSources = txnGroupSources;
  }

  public get txnGroupSources(): Array<TxnGroupSourceDescriptor> {
    return this._txnGroupSources;
  }

  public findByHash(
    hash: string | Uint8Array,
  ): TxnGroupSourceDescriptor | undefined {
    if (typeof hash !== 'string') {
      hash = Buffer.from(hash).toString('base64');
    }
    for (let i = 0; i < this._txnGroupSources.length; i++) {
      if (
        this._txnGroupSources[i].hash &&
        this._txnGroupSources[i].hash === hash
      ) {
        return this._txnGroupSources[i];
      }
    }
    return undefined;
  }

  static async loadFromFile(
    fileAccessor: FileAccessor,
    txnGroupSourcesDescriptionPath: string,
  ): Promise<TxnGroupSourceDescriptorList> {
    const rawGroupSourcesDescription = Buffer.from(
      await fileAccessor.readFile(txnGroupSourcesDescriptionPath),
    );
    const jsonGroupSourcesDescription = JSON.parse(
      rawGroupSourcesDescription.toString('utf-8'),
    ) as Record<string, any>;
    const txnGroupSources = (
      jsonGroupSourcesDescription['txn-group-sources'] as any[]
    ).map((source) =>
      TxnGroupSourceDescriptor.fromJSONObj(
        fileAccessor,
        txnGroupSourcesDescriptionPath,
        source,
      ),
    );
    return new TxnGroupSourceDescriptorList({
      txnGroupSources: await Promise.all(txnGroupSources),
    });
  }
}

export class TEALDebuggingAssets {
  private _simulateResponse: algosdk.modelsv2.SimulateResponse;
  private _txnGroupDescriptorList: TxnGroupSourceDescriptorList;

  constructor(
    simulateResponse: algosdk.modelsv2.SimulateResponse,
    txnGroupDescriptorList: TxnGroupSourceDescriptorList,
  ) {
    this._simulateResponse = simulateResponse;
    this._txnGroupDescriptorList = txnGroupDescriptorList;
  }

  public get simulateResponse(): algosdk.modelsv2.SimulateResponse {
    return this._simulateResponse;
  }

  public get txnGroupDescriptorList(): TxnGroupSourceDescriptorList {
    return this._txnGroupDescriptorList;
  }

  static async loadFromFiles(
    fileAccessor: FileAccessor,
    simulateResponsePath: string,
    txnGroupSourcesDescriptionPath: string,
  ): Promise<TEALDebuggingAssets> {
    const rawSimulateResponse = Buffer.from(
      await fileAccessor.readFile(simulateResponsePath),
    );
    const simulateResponse =
      algosdk.modelsv2.SimulateResponse.from_obj_for_encoding(
        parseJsonWithBigints(rawSimulateResponse.toString('utf-8')),
      );

    const txnGroupDescriptorList =
      await TxnGroupSourceDescriptorList.loadFromFile(
        fileAccessor,
        txnGroupSourcesDescriptionPath,
      );

    return new TEALDebuggingAssets(simulateResponse, txnGroupDescriptorList);
  }
}
