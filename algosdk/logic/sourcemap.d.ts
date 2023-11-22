/**
 * Represents a location in a source file.
 */
export interface SourceLocation {
    line: number;
    column: number;
    sourceIndex: number;
    nameIndex?: number;
}
/**
 * Represents the location of a specific PC in a source line.
 */
export interface PcLineLocation {
    pc: number;
    column: number;
    nameIndex?: number;
}
/**
 * Contains a mapping from TEAL program PC to source file location.
 */
export declare class ProgramSourceMap {
    readonly version: number;
    /**
     * A list of original sources used by the "mappings" entry.
     */
    readonly sources: string[];
    /**
     * A list of symbol names used by the "mappings" entry.
     */
    readonly names: string[];
    /**
     * A string with the encoded mapping data.
     */
    readonly mappings: string;
    private pcToLocation;
    private sourceAndLineToPc;
    constructor({ version, sources, names, mappings, }: {
        version: number;
        sources: string[];
        names: string[];
        mappings: string;
    });
    getPcs(): number[];
    getLocationForPc(pc: number): SourceLocation | undefined;
    getPcsOnSourceLine(sourceIndex: number, line: number): PcLineLocation[];
}
