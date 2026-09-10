import { geoEqualEarth, geoGraticule10, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import type { MultiPolygon } from 'geojson';
import type { GeoPoint } from '@/domain/values/geo-point.ts';
import type { MultiPolygonRings } from '@/domain/values/geo-shape.ts';

/** How much of the frame a realm is allowed to fill when the map flies to it. */
const FRAME_FILL = 0.72;

/** Zoom never goes below the whole world, nor past the point where the coastline turns to facets. */
const MIN_SCALE = 1;
const MAX_SCALE = 64;

/**
 * The zoom limits, as one shared array.
 *
 * It is a constant rather than a getter because React compares it by identity: a fresh array
 * each render made the zoom behaviour rebind on every pass, which quietly cancelled the flight
 * that frames a realm.
 */
export const SCALE_EXTENT: readonly [number, number] = Object.freeze([MIN_SCALE, MAX_SCALE]);

/**
 * The window the atlas actually draws in: Mexico to Japan, Patagonia to the Arctic circle.
 *
 * Fitting the whole sphere wastes most of a phone screen on the empty Pacific and the ice caps,
 * where this atlas has nothing to show. Every Wonder and every realm in the game falls inside
 * this window, so the opening view is fitted to it instead — a third larger, with nothing lost.
 */
const DRAWN_WINDOW = { west: -115, south: -48, east: 150, north: 72 };

/** How finely the window's edges are sampled when working out where they land, in degrees. */
const SAMPLE_STEP = 5;

export interface AtlasProjectionConfig {
    width: number;
    height: number;
    /**
     * Pixels at the foot of the viewport the legend sits over.
     *
     * A world map is twice as wide as it is tall and a phone is the other way round, so the
     * opening view always has spare height. Knowing what covers the bottom lets the map centre
     * itself in what is actually visible instead of hiding behind the legend.
     */
    bottomInset?: number;
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
    private readonly visibleHeight: number;
    private readonly projection: GeoProjection;
    private readonly path: GeoPath;

    constructor(config: AtlasProjectionConfig) {
        this.width = config.width;
        this.height = config.height;
        this.visibleHeight = Math.max(config.height - (config.bottomInset ?? 0), config.height * 0.4);
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
        const k = clamp((FRAME_FILL * Math.min(this.width / spanX, this.visibleHeight / spanY)) || MIN_SCALE);

        return {
            k,
            x: this.width / 2 - (k * (left + right)) / 2,
            y: this.visibleHeight / 2 - (k * (top + bottom)) / 2,
        };
    }

    /**
     * The drawn world, as large as it goes while staying whole. Where the map starts and resets to.
     *
     * Not the whole sphere: Equal Earth is twice as wide as it is tall, so fitting the poles and
     * the empty Pacific into a portrait viewport leaves most of a phone screen holding nothing.
     * Fitting the window the atlas actually draws in gains a third of the size and loses no
     * civilization at all.
     */
    public wholeWorld(): Frame {
        /*
         * The corners are projected one by one rather than handed to `path.bounds`. d3 reads a
         * polygon's edges as great circles, so a four-corner box spanning two hundred and sixty
         * degrees of longitude bulges past its own parallels and the bounds come back as the
         * whole sphere — which is exactly the framing this method exists to avoid.
         */
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;

        for (let lon = DRAWN_WINDOW.west; lon <= DRAWN_WINDOW.east; lon += SAMPLE_STEP) {
            for (const lat of [DRAWN_WINDOW.south, 0, DRAWN_WINDOW.north]) {
                const point = this.projection([lon, lat]);
                if (!point) continue;

                left = Math.min(left, point[0]);
                right = Math.max(right, point[0]);
                top = Math.min(top, point[1]);
                bottom = Math.max(bottom, point[1]);
            }
        }

        if (!Number.isFinite(left)) return { k: MIN_SCALE, x: 0, y: 0 };

        const k = clamp(Math.min(this.width / Math.max(right - left, 1), this.visibleHeight / Math.max(bottom - top, 1)));

        return {
            k,
            x: this.width / 2 - (k * (left + right)) / 2,
            y: this.visibleHeight / 2 - (k * (top + bottom)) / 2,
        };
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
