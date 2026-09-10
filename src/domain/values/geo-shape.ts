/** A [lon, lat] pair, kept as a plain list so shipped JSON needs no conversion to become one. */
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
