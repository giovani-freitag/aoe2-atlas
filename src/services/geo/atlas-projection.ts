import {
    geoEqualEarth,
    geoGraticule,
    geoGraticule10,
    geoMercator,
    geoNaturalEarth1,
    geoPath,
    type GeoPath,
    type GeoProjection,
} from 'd3-geo';
import type { MultiPolygon } from 'geojson';
import type { GeoPoint } from '@/domain/values/geo-point.ts';
import type { MultiPolygonRings } from '@/domain/values/geo-shape.ts';
import type { ProjectionKey } from '@/domain/enums/projection.ts';

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

/**
 * The extent every projection is fitted to, as a densified ring.
 *
 * Fitting to the whole sphere is no use for Mercator, which sends the poles to infinity, so all
 * three are fitted to the same latitude band instead — and the band is spelled out point by
 * point because d3 reads a four-corner box's edges as great circles and lets them bulge.
 */
const FITTED_WORLD: MultiPolygonRings = [[densify({ west: -180, south: -60, east: 180, north: 78 })]];

/** Radius of the Earth in kilometres, for turning a scale factor into something readable. */
const EARTH_RADIUS_KM = 6371.0088;

/** The parallels an old chart rules heavier than the rest of the grid. */
const TROPIC = 23.4366;
const POLAR = 66.5634;

export interface AtlasProjectionConfig {
    width: number;
    height: number;
    /** Which projection to draw in; the measured areas never depend on it. */
    kind: ProjectionKey;
}

/** A zoom transform in the form d3-zoom and an SVG `transform` attribute both understand. */
export interface Frame {
    k: number;
    x: number;
    y: number;
}

/** How much of the map is hidden behind a panel, in pixels, per side. */
export interface Covered {
    left?: number;
    right?: number;
}

/**
 * A projection fitted to the viewport, and the paths drawn on it.
 *
 * Equal Earth is the default because the atlas is about how much ground a realm held, and on
 * Mercator Scandinavia outweighs India. But the reader can pick, and the honesty does not
 * depend on the choice: every area in the panels is measured on the sphere when the data is
 * built, so switching to Mercator changes the picture and not one number. What the map does
 * instead is say, out loud, how much the picture is lying at the latitude on screen.
 */
export class AtlasProjection {
    public readonly width: number;
    public readonly height: number;
    public readonly kind: ProjectionKey;
    private readonly projection: GeoProjection;
    private readonly path: GeoPath;

    constructor(config: AtlasProjectionConfig) {
        this.width = config.width;
        this.height = config.height;
        this.kind = config.kind;
        this.projection = build(config.kind).fitExtent(
            [
                [0, 0],
                [config.width, config.height],
            ],
            asMultiPolygon(FITTED_WORLD),
        );
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

    /**
     * Centres a projected box in whatever of the map is still visible.
     *
     * @param box - The bounds to centre, in projected pixels.
     * @param fill - How much of the free space the box should take.
     * @param covered - Pixels hidden behind panels on each side.
     */
    private fit(box: { left: number; top: number; right: number; bottom: number }, fill: number, covered: Covered): Frame {
        const hiddenLeft = covered.left ?? 0;
        const hiddenRight = covered.right ?? 0;
        const free = Math.max(this.width - hiddenLeft - hiddenRight, this.width * 0.3);

        const spanX = Math.max(box.right - box.left, 1);
        const spanY = Math.max(box.bottom - box.top, 1);
        const k = clamp((fill * Math.min(free / spanX, this.height / spanY)) || MIN_SCALE);

        return {
            k,
            x: hiddenLeft + free / 2 - (k * (box.left + box.right)) / 2,
            y: this.height / 2 - (k * (box.top + box.bottom)) / 2,
        };
    }

    /**
     * The place a pixel falls on, the inverse of `pointOf`.
     *
     * @param point - Pixel coordinates in the projection's own space, before any zoom.
     * @returns The place in degrees, or null where the projection has no land to invert onto.
     */
    public placeOf(point: [number, number]): GeoPoint | null {
        const place = this.projection.invert?.(point);

        return place ? { lon: place[0], lat: place[1] } : null;
    }

    /**
     * How large the projection draws the world before any zoom is applied.
     *
     * Two projections of the same world at different viewport sizes differ by exactly this
     * ratio, which is what lets a zoom be carried from one to the other without the map
     * appearing to jump.
     */
    public get baseScale(): number {
        return this.projection.scale();
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
     * The lines an old chart draws heavier than the rest of the grid.
     *
     * @returns The equator on its own, and the tropics and polar circles together.
     */
    public referenceLines(): { equator: string; tropics: string } {
        const along = (lat: number): string =>
            this.path(geoGraticule().extentMajor([[-180, lat], [180, lat]]).stepMinor([360, 360]).outline()) ?? '';

        return {
            equator: along(0),
            tropics: [TROPIC, -TROPIC, POLAR, -POLAR].map(along).join(' '),
        };
    }

    /**
     * How many times larger a shape looks at a latitude than it truly is.
     *
     * Measured rather than derived, so it holds for whichever projection is on: a small quad is
     * projected at the latitude and at the equator, and the two area ratios are compared. An
     * equal-area projection answers one everywhere; Mercator answers three at fifty-five degrees.
     *
     * @param lat - The latitude to measure at, in degrees.
     */
    public areaInflationAt(lat: number): number {
        const baseline = this.quadRatio(0);
        const here = this.quadRatio(Math.max(-84, Math.min(84, lat)));
        if (baseline === 0) return 1;

        return here / baseline;
    }

    /**
     * The latitude at the middle of what the reader is currently looking at.
     *
     * @param frame - The pan and zoom on screen.
     * @returns The latitude in degrees, or zero when the centre falls off the map.
     */
    public centreLatitude(frame: Frame): number {
        const centre = this.projection.invert?.([
            (this.width / 2 - frame.x) / frame.k,
            (this.height / 2 - frame.y) / frame.k,
        ]);

        return centre ? centre[1] : 0;
    }

    /** Projected area over true area for a small quad at one latitude. */
    private quadRatio(lat: number): number {
        const half = 0.5;
        const corners: [number, number][] = [
            [-half, lat - half],
            [half, lat - half],
            [half, lat + half],
            [-half, lat + half],
        ];

        let projected = 0;
        for (let index = 0; index < corners.length; index += 1) {
            const from = this.projection(corners[index]);
            const to = this.projection(corners[(index + 1) % corners.length]);
            if (!from || !to) return 0;

            projected += from[0] * to[1] - to[0] * from[1];
        }

        const trueArea = Math.abs(
            (Math.PI / 180) * (2 * half) * (Math.sin(((lat + half) * Math.PI) / 180) - Math.sin(((lat - half) * Math.PI) / 180)),
        );

        return trueArea === 0 ? 0 : Math.abs(projected / 2) / (trueArea * EARTH_RADIUS_KM * EARTH_RADIUS_KM);
    }

    /**
     * The zoom that brings a realm into the middle of the frame.
     *
     * @param rings - The outline to frame.
     * @param covered - Pixels of the map hidden under a panel, so the realm lands beside it
     * rather than behind it. The projection is untouched: only where the middle is moves.
     * @returns A transform, clamped to the zoom the map allows.
     */
    public frameFor(rings: MultiPolygonRings, covered: Covered = {}): Frame {
        const [[left, top], [right, bottom]] = this.path.bounds(asMultiPolygon(rings));

        return this.fit({ left, top, right, bottom }, FRAME_FILL, covered);
    }

    /**
     * The drawn world, as large as it goes while staying whole. Where the map starts and resets to.
     *
     * Not the whole sphere: Equal Earth is twice as wide as it is tall, so fitting the poles and
     * the empty Pacific into a portrait viewport leaves most of a phone screen holding nothing.
     * Fitting the window the atlas actually draws in gains a third of the size and loses no
     * civilization at all.
     */
    public wholeWorld(covered: Covered = {}): Frame {
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

        return this.fit({ left, top, right, bottom }, 1, covered);
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

function build(kind: ProjectionKey): GeoProjection {
    if (kind === 'mercator') return geoMercator();
    if (kind === 'natural-earth') return geoNaturalEarth1();

    return geoEqualEarth();
}

/** Walks the edges of a box so the ring follows parallels and meridians, not great circles. */
function densify(box: { west: number; south: number; east: number; north: number }): [number, number][] {
    const ring: [number, number][] = [];

    for (let lon = box.west; lon <= box.east; lon += SAMPLE_STEP) ring.push([lon, box.south]);
    for (let lat = box.south; lat <= box.north; lat += SAMPLE_STEP) ring.push([box.east, lat]);
    for (let lon = box.east; lon >= box.west; lon -= SAMPLE_STEP) ring.push([lon, box.north]);
    for (let lat = box.north; lat >= box.south; lat -= SAMPLE_STEP) ring.push([box.west, lat]);
    ring.push([box.west, box.south]);

    return ring;
}

function clamp(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
