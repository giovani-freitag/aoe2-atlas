import { geoEqualEarth, geoGraticule10, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import type { MultiPolygon } from 'geojson';
import type { GeoPoint } from '@/domain/values/geo-point.ts';
import type { MultiPolygonRings } from '@/domain/values/territory.ts';

/** How much of the frame a realm is allowed to fill when the map flies to it. */
const FRAME_FILL = 0.72;

/** Zoom never goes below the whole world, nor past the point where the coastline turns to facets. */
const MIN_SCALE = 1;
const MAX_SCALE = 64;

export interface AtlasProjectionConfig {
    width: number;
    height: number;
}

/** A zoom transform in the form d3-zoom and an SVG `transform` attribute both understand. */
export interface Frame {
    k: number;
    x: number;
    y: number;
}

/**
 * Equal Earth, fitted to the viewport, and the paths drawn on it.
 *
 * The projection is equal-area on purpose. The whole point of the atlas is that a reader can
 * look at the Mongol Empire beside Mali and believe the sizes; on Mercator, which every slippy
 * map uses, Scandinavia would outweigh India and the comparison would be a lie.
 */
export class AtlasProjection {
    public readonly width: number;
    public readonly height: number;
    private readonly projection: GeoProjection;
    private readonly path: GeoPath;

    constructor(config: AtlasProjectionConfig) {
        this.width = config.width;
        this.height = config.height;
        this.projection = geoEqualEarth().fitSize([config.width, config.height], { type: 'Sphere' });
        this.path = geoPath(this.projection);
    }

    /**
     * The SVG path for a set of rings.
     *
     * @param rings - Outline in [lon, lat] pairs.
     * @returns A path string, empty when nothing of it lands on the map.
     */
    public pathOf(rings: MultiPolygonRings): string {
        return this.path(asMultiPolygon(rings)) ?? '';
    }

    /**
     * Where a place lands on the map.
     *
     * @param point - The place, in degrees.
     * @returns Pixel coordinates, or null when the projection cannot place it.
     */
    public pointOf(point: GeoPoint): [number, number] | null {
        return this.projection([point.lon, point.lat]);
    }

    /** The outline of the whole globe, which is the shape of the ocean behind everything. */
    public spherePath(): string {
        return this.path({ type: 'Sphere' }) ?? '';
    }

    /** Meridians and parallels every ten degrees, as one path. */
    public graticulePath(): string {
        return this.path(geoGraticule10()) ?? '';
    }

    /**
     * The zoom that brings a realm into the middle of the frame.
     *
     * @param rings - The outline to frame.
     * @returns A transform, clamped to the zoom the map allows.
     */
    public frameFor(rings: MultiPolygonRings): Frame {
        const [[left, top], [right, bottom]] = this.path.bounds(asMultiPolygon(rings));

        const spanX = Math.max(right - left, 1);
        const spanY = Math.max(bottom - top, 1);
        const k = clamp((FRAME_FILL * Math.min(this.width / spanX, this.height / spanY)) || MIN_SCALE);

        return {
            k,
            x: this.width / 2 - (k * (left + right)) / 2,
            y: this.height / 2 - (k * (top + bottom)) / 2,
        };
    }

    /** The whole world, centred, which is where the map starts and what "reset" goes back to. */
    public wholeWorld(): Frame {
        return { k: MIN_SCALE, x: 0, y: 0 };
    }

    /** The zoom limits the map is allowed to move between. */
    public static get scaleExtent(): [number, number] {
        return [MIN_SCALE, MAX_SCALE];
    }
}

/**
 * Hands the atlas's own read-only outline to d3, which types its input as mutable GeoJSON.
 *
 * The cast is the whole reason this function exists: it is the single place the third-party
 * shape meets the domain one, and nothing downstream ever writes to the rings.
 */
function asMultiPolygon(rings: MultiPolygonRings): MultiPolygon {
    return { type: 'MultiPolygon', coordinates: rings as MultiPolygon['coordinates'] };
}

function clamp(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
