import type { GeoPoint } from '@/domain/values/geo-point.ts';

/** A [lon, lat] pair, kept as a plain list so the shipped JSON needs no conversion to become one. */
export type Position = readonly number[];

/** A ring of positions, first point repeated at the end. */
export type Ring = readonly Position[];

/** One polygon: an outer ring followed by any holes. */
export type PolygonRings = readonly Ring[];

/** A realm's outline, which is often several disjoint pieces. */
export type MultiPolygonRings = readonly PolygonRings[];

export interface BoundingBox {
    west: number;
    south: number;
    east: number;
    north: number;
}

export interface TerritoryConfig {
    rings: MultiPolygonRings;
    /** The year the outline is drawn for. */
    year: number;
    /** Whether the outline came from the source dataset or was drawn by hand for this atlas. */
    origin: 'dataset' | 'drawn';
    /** Polity names dissolved into the outline; empty for a hand-drawn one. */
    sourceNames: readonly string[];
    areaKm2: number;
    bbox: BoundingBox;
    centroid: GeoPoint;
}

/**
 * The ground a civilization held, as the atlas draws it.
 *
 * The area is carried rather than computed on demand because it is measured at build time on
 * the sphere, against the very same simplified outline that ships — so the number under the map
 * always describes the shape on it.
 */
export class Territory {
    public readonly rings: MultiPolygonRings;
    public readonly year: number;
    public readonly origin: 'dataset' | 'drawn';
    public readonly sourceNames: readonly string[];
    public readonly areaKm2: number;
    public readonly bbox: BoundingBox;
    public readonly centroid: GeoPoint;

    constructor(config: TerritoryConfig) {
        this.rings = config.rings;
        this.year = config.year;
        this.origin = config.origin;
        this.sourceNames = config.sourceNames;
        this.areaKm2 = config.areaKm2;
        this.bbox = config.bbox;
        this.centroid = config.centroid;
    }

    /** How many times over the realm would cover a country the reader has a feel for. */
    public timesTheSizeOf(referenceKm2: number): number {
        return this.areaKm2 / referenceKm2;
    }

    /** True when the outline was drawn for this atlas rather than lifted from the source data. */
    public get isHandDrawn(): boolean {
        return this.origin === 'drawn';
    }
}
