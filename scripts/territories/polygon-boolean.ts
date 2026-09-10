import { createRequire } from 'node:module';
import type { MultiPolygonRings } from './geometry.ts';

/**
 * Boolean operations on rings, reached the one way the library actually offers them.
 *
 * polygon-clipping ships CommonJS with no exports map, so the named bindings its type
 * declaration promises resolve to undefined under an ESM loader and every call fails silently
 * inside a try block. Requiring the module hands over the real object.
 */
interface PolygonClipping {
    union(geom: MultiPolygonRings, ...geoms: MultiPolygonRings[]): MultiPolygonRings;
    intersection(geom: MultiPolygonRings, ...geoms: MultiPolygonRings[]): MultiPolygonRings;
}

const clipping = createRequire(import.meta.url)('polygon-clipping') as PolygonClipping;

/**
 * Dissolves overlapping polygons into one outline.
 *
 * @param rings - The polygons to merge.
 * @returns The merged outline.
 * @throws When the clipper cannot close an output ring, which coarse borders can provoke.
 */
export function dissolve(rings: MultiPolygonRings): MultiPolygonRings {
    return clipping.union(rings);
}

/**
 * The ground two outlines both cover.
 *
 * @param left - The first outline.
 * @param right - The second outline.
 * @returns The shared ground, empty when they only touch.
 * @throws When the clipper cannot close an output ring.
 */
export function overlap(left: MultiPolygonRings, right: MultiPolygonRings): MultiPolygonRings {
    return clipping.intersection(left, right);
}
