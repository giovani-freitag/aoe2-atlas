/**
 * Plain geometry helpers the territory build leans on.
 *
 * Everything here works on GeoJSON-ordered [lon, lat] pairs and stays free of any GeoJSON
 * wrapper objects, so the builder can pass raw coordinate arrays straight through.
 */
import { geoArea, geoBounds, geoCentroid } from 'd3-geo';
import type { MultiPolygon, Polygon } from 'geojson';

/** Mean radius of the Earth in kilometres, IUGG value, the one d3 areas are scaled by. */
const EARTH_RADIUS_KM = 6371.0088;

/** Half the sphere in steradians; a realm larger than this has its rings wound the wrong way. */
const HALF_SPHERE = 2 * Math.PI;

/** The whole sphere in steradians. */
const FULL_SPHERE = 4 * Math.PI;

export type Position = [number, number];
export type Ring = Position[];
export type PolygonRings = Ring[];
export type MultiPolygonRings = PolygonRings[];

export interface BoundingBox {
    west: number;
    south: number;
    east: number;
    north: number;
}

/**
 * Drops the points of a ring that fall within `tolerance` of the line they sit on.
 *
 * Ramer-Douglas-Peucker in plain degrees. Degrees are not a distance, so the same tolerance
 * thins a polar ring more than an equatorial one, which is acceptable here: the atlas is drawn
 * on an equal-area projection where a degree of longitude near the pole is worth very little.
 *
 * @param ring - The ring to thin, at least two points long.
 * @param tolerance - Perpendicular distance in degrees below which a point is dropped.
 * @returns A new ring holding the points that survived.
 */
export function simplifyRing(ring: Ring, tolerance: number): Ring {
    if (ring.length <= 2) return [...ring];

    const keep = new Array<boolean>(ring.length).fill(false);
    keep[0] = true;
    keep[ring.length - 1] = true;

    const stack: [number, number][] = [[0, ring.length - 1]];

    while (stack.length > 0) {
        const segment = stack.pop();
        if (!segment) break;

        const [start, end] = segment;
        let farthest = -1;
        let distance = tolerance;

        for (let index = start + 1; index < end; index += 1) {
            const candidate = perpendicularDistance(ring[index], ring[start], ring[end]);
            if (candidate > distance) {
                distance = candidate;
                farthest = index;
            }
        }

        if (farthest === -1) continue;

        keep[farthest] = true;
        stack.push([start, farthest], [farthest, end]);
    }

    return ring.filter((_point, index) => keep[index]);
}

/**
 * Thins every ring of a multipolygon, discarding the ones that collapse into a line.
 *
 * @param rings - The multipolygon to thin.
 * @param tolerance - Perpendicular distance in degrees passed to each ring.
 * @returns A new multipolygon; polygons whose outer ring collapsed are left out entirely.
 */
export function simplifyMultiPolygon(rings: MultiPolygonRings, tolerance: number): MultiPolygonRings {
    const simplified: MultiPolygonRings = [];

    for (const polygon of rings) {
        const thinned = polygon
            .map((ring) => closeRing(simplifyRing(ring, tolerance)))
            .filter((ring) => ring.length >= 4);

        if (thinned.length > 0) simplified.push(thinned);
    }

    return simplified;
}

/**
 * Rounds every coordinate to a fixed number of decimals, then drops the points that collide.
 *
 * Seven decimals of longitude is a centimetre. Three is a hundred metres, which is finer than
 * any border in this atlas is known to, and cuts the shipped file to a fraction of its size.
 *
 * @param rings - The multipolygon to round.
 * @param decimals - How many decimal places to keep.
 * @returns A new multipolygon with rounded, de-duplicated points.
 */
export function roundMultiPolygon(rings: MultiPolygonRings, decimals: number): MultiPolygonRings {
    const factor = 10 ** decimals;
    const snap = (value: number): number => Math.round(value * factor) / factor;
    const rounded: MultiPolygonRings = [];

    for (const polygon of rings) {
        const snapped = polygon
            .map((ring) => closeRing(dropRepeats(ring.map(([lon, lat]): Position => [snap(lon), snap(lat)]))))
            .filter((ring) => ring.length >= 4);

        if (snapped.length > 0) rounded.push(snapped);
    }

    return rounded;
}

/**
 * Winds every ring the way spherical GeoJSON readers expect: outer rings enclose their inside.
 *
 * This is not tidiness. d3 reads a ring's direction as which side of it is land, so a polygon
 * handed over backwards is drawn as *the rest of the planet* — one badly wound realm floods the
 * whole map. The source files are inconsistent about it, so every ring is checked here: an
 * outer ring covering more than half the globe has been read inside out, and a hole is the same
 * test upside down.
 *
 * @param rings - The multipolygon to correct.
 * @returns The same shape with each ring pointing the right way round.
 */
export function rewindMultiPolygon(rings: MultiPolygonRings): MultiPolygonRings {
    return rings.map((polygon) =>
        polygon.map((ring, index) => {
            const covers = geoArea({ type: 'Polygon', coordinates: [ring] });
            const isHole = index > 0;
            const inverted = isHole ? covers < HALF_SPHERE : covers > HALF_SPHERE;

            return inverted ? [...ring].reverse() : ring;
        }),
    );
}

/**
 * Measures a multipolygon on the sphere, in square kilometres.
 *
 * d3 reads a ring's winding as the side of it that is inside, so a clockwise outer ring comes
 * back as everything except the realm. No civilization here holds half the planet, so any
 * result past that is taken as an inverted ring and flipped.
 *
 * @param rings - The multipolygon to measure.
 * @returns The area in square kilometres.
 */
export function areaInSquareKm(rings: MultiPolygonRings): number {
    let steradians = 0;

    for (const polygon of rings) {
        const single: Polygon = { type: 'Polygon', coordinates: polygon };
        const measured = geoArea(single);
        steradians += measured > HALF_SPHERE ? FULL_SPHERE - measured : measured;
    }

    return steradians * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
}

/**
 * The rectangle a multipolygon fits in, as d3 reads it on the sphere.
 *
 * @param rings - The multipolygon to bound.
 * @returns The corners in degrees.
 */
export function boundingBox(rings: MultiPolygonRings): BoundingBox {
    const shape: MultiPolygon = { type: 'MultiPolygon', coordinates: rings };
    const [[west, south], [east, north]] = geoBounds(shape);

    return { west, south, east, north };
}

/**
 * The spherical centroid of a multipolygon, for anchoring a label.
 *
 * @param rings - The multipolygon to weigh.
 * @returns The centroid as a [lon, lat] pair.
 */
export function centroidOf(rings: MultiPolygonRings): Position {
    const shape: MultiPolygon = { type: 'MultiPolygon', coordinates: rings };
    const [lon, lat] = geoCentroid(shape);

    return [lon, lat];
}

/**
 * Counts the points a multipolygon is made of, for reporting how heavy the output is.
 *
 * @param rings - The multipolygon to count.
 */
export function countPoints(rings: MultiPolygonRings): number {
    return rings.reduce((total, polygon) => total + polygon.reduce((sum, ring) => sum + ring.length, 0), 0);
}

/**
 * Repeats a ring's first point at its end, as GeoJSON requires, when it is not there already.
 *
 * @param ring - The ring to close.
 */
export function closeRing(ring: Ring): Ring {
    if (ring.length === 0) return ring;

    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) return ring;

    return [...ring, [first[0], first[1]]];
}

function dropRepeats(ring: Ring): Ring {
    const kept: Ring = [];

    for (const point of ring) {
        const previous = kept[kept.length - 1];
        if (previous && previous[0] === point[0] && previous[1] === point[1]) continue;
        kept.push(point);
    }

    return kept;
}

function perpendicularDistance(point: Position, start: Position, end: Position): number {
    const [x, y] = point;
    const [x1, y1] = start;
    const [x2, y2] = end;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);

    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    const clamped = Math.max(0, Math.min(1, t));

    return Math.hypot(x - (x1 + clamped * dx), y - (y1 + clamped * dy));
}
