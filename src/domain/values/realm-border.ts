import type { GeoPoint } from '@/domain/values/geo-point.ts';
import type { BoundingBox, MultiPolygonRings } from '@/domain/values/geo-shape.ts';

/** How well the source claims to know where a border ran. */
export type BorderPrecision = 'approximate' | 'moderate' | 'surveyed';

export interface RealmBorderConfig {
    civ: string;
    /** The century this outline was actually cut for. */
    from: number;
    /** The century it is being shown in; the same as `from` unless a neighbour stood in. */
    shownAt: number;
    origin: 'dataset' | 'drawn';
    /** Polity names dissolved together; empty for a hand-drawn outline. */
    sourceNames: readonly string[];
    precision: BorderPrecision;
    areaKm2: number;
    bbox: BoundingBox;
    centroid: GeoPoint;
    rings: MultiPolygonRings;
}

/**
 * One civilization's border as the atlas draws it in one century.
 *
 * `from` and `shownAt` differ when the source has no map for the century on screen and the
 * nearest one is standing in. The atlas never hides that: a line borrowed from two hundred
 * years earlier is drawn differently and says so, because the alternative is inventing a
 * frontier and letting the reader believe it.
 */
export class RealmBorder {
    public readonly civ: string;
    public readonly from: number;
    public readonly shownAt: number;
    public readonly origin: 'dataset' | 'drawn';
    public readonly sourceNames: readonly string[];
    public readonly precision: BorderPrecision;
    public readonly areaKm2: number;
    public readonly bbox: BoundingBox;
    public readonly centroid: GeoPoint;
    public readonly rings: MultiPolygonRings;

    constructor(config: RealmBorderConfig) {
        this.civ = config.civ;
        this.from = config.from;
        this.shownAt = config.shownAt;
        this.origin = config.origin;
        this.sourceNames = config.sourceNames;
        this.precision = config.precision;
        this.areaKm2 = config.areaKm2;
        this.bbox = config.bbox;
        this.centroid = config.centroid;
        this.rings = config.rings;
    }

    /** True when the line was cut for the very century it is being shown in. */
    public get isOfItsCentury(): boolean {
        return this.from === this.shownAt;
    }

    /** True when the outline was drawn for this atlas rather than lifted from the source. */
    public get isHandDrawn(): boolean {
        return this.origin === 'drawn';
    }

    /**
     * How many years separate the line from the century it is shown in.
     *
     * The interface uses it to decide how loudly to say so: a fifty-year reach is a footnote,
     * a two-hundred-year one belongs on the map itself.
     */
    public get carriedYears(): number {
        return Math.abs(this.shownAt - this.from);
    }
}
