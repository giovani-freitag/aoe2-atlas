import { geoContains, geoDistance } from 'd3-geo';
import type { CivilizationRecord } from '@/data/civilizations.ts';
import type { DrawnRings, TerritorySpec } from '@/data/territory-sources.ts';
import {
    areaInSquareKm,
    boundingBox,
    centroidOf,
    closeRing,
    rewindMultiPolygon,
    roundMultiPolygon,
    simplifyMultiPolygon,
    type MultiPolygonRings,
    type Position,
} from './geometry.ts';
import { dissolve, overlap } from './polygon-boolean.ts';
import type { BasemapArchive, BasemapFeature } from './basemap-archive.ts';

/** How coarse a border may get, as a fraction of the diagonal of the box it fits in. */
const SIMPLIFY_FRACTION = 1 / 320;

/** Floor and ceiling on that tolerance, in degrees, so tiny realms keep their shape. */
const MIN_TOLERANCE = 0.015;
const MAX_TOLERANCE = 0.14;

/** A hundred metres of precision, far finer than any border here is actually known to. */
const COORDINATE_DECIMALS = 3;

/** Overlaps below this share of the smaller realm are noise from coarse borders, not a frontier. */
const MIN_OVERLAP_SHARE = 0.02;

/**
 * How far outside its own border a Wonder may sit before the build complains.
 *
 * Coastal monuments — Belém on the Tagus, Hagia Sophia on the Bosphorus — fall a few kilometres
 * outside a simplified coastline. The point is right; the line was thinned.
 */
const COASTAL_TOLERANCE_KM = 12;

export interface SliceBuilderConfig {
    archive: BasemapArchive;
    civilizations: readonly CivilizationRecord[];
    sources: Readonly<Record<string, TerritorySpec>>;
    /** Civilization keys whose Wonder is allowed to stand outside the realm, with the reason. */
    allowedOutside: Readonly<Record<string, string>>;
    /** The years the source publishes, oldest first. */
    sourceYears: readonly number[];
}

export interface Realm {
    civ: string;
    /** The slice this geometry was actually cut for, which may be older than the slice it sits in. */
    from: number;
    /** True when `from` equals the slice year; false when the nearest one had to stand in. */
    exact: boolean;
    origin: 'dataset' | 'drawn';
    /** Polity names dissolved together; empty for a hand-drawn outline. */
    sourceNames: string[];
    /** 1 approximate, 2 moderately precise, 3 fixed by law; the coarsest of the parts. */
    precision: number;
    areaKm2: number;
    bbox: [number, number, number, number];
    centroid: Position;
    rings: MultiPolygonRings;
}

export interface Frontier {
    a: string;
    b: string;
    areaKm2: number;
    shareOfA: number;
    shareOfB: number;
    /** True when either side's line was borrowed from another century, so the figure is softer. */
    carried: boolean;
}

export interface Slice {
    year: number;
    realms: Realm[];
    /** Realms that shared ground *in this year* — contemporaries, by construction. */
    frontiers: Frontier[];
}

export interface CivilizationSummary {
    civ: string;
    /** Years this civilization has a border cut for. */
    slices: number[];
    /** The slice where it held the most ground. */
    peakYear: number;
    peakAreaKm2: number;
}

export interface SliceDataset {
    generatedAt: string;
    years: number[];
    civilizations: CivilizationSummary[];
    slices: Slice[];
}

/** One civilization's geometry at one year, before it is placed in a slice. */
interface Cut {
    year: number;
    origin: 'dataset' | 'drawn';
    sourceNames: string[];
    precision: number;
    rings: MultiPolygonRings;
}

/**
 * Cuts one border per civilization per century, and the frontiers between contemporaries.
 *
 * The unit of work is the slice rather than the civilization on purpose: a frontier only means
 * something between realms that stood in the same year, and building year by year makes that
 * true by construction instead of by a filter somebody has to remember to apply.
 */
export class SliceBuilder {
    private readonly archive: BasemapArchive;
    private readonly civilizations: readonly CivilizationRecord[];
    private readonly sources: Readonly<Record<string, TerritorySpec>>;
    private readonly allowedOutside: Readonly<Record<string, string>>;
    private readonly sourceYears: readonly number[];

    constructor(config: SliceBuilderConfig) {
        this.archive = config.archive;
        this.civilizations = config.civilizations;
        this.sources = config.sources;
        this.allowedOutside = config.allowedOutside;
        this.sourceYears = config.sourceYears;
    }

    /**
     * Builds every slice, then checks the result before handing it over.
     *
     * @returns The dataset the application ships.
     * @throws When a civilization has no border anywhere, or a Wonder stands outside its own
     *     realm without a reason recorded in the allow list.
     */
    public async build(): Promise<SliceDataset> {
        const years = this.years();
        const cuts = new Map<string, Cut[]>();

        for (const civilization of this.civilizations) {
            cuts.set(civilization.key, await this.cutsFor(civilization, years));
        }

        this.checkEveryCivilizationStands(cuts);
        this.checkWondersStandInside(cuts);

        return {
            generatedAt: new Date().toISOString(),
            years,
            civilizations: this.summaries(cuts),
            slices: years.map((year) => this.sliceAt(year, cuts)),
        };
    }

    /** The source's own years, plus any a hand-drawn outline introduces, oldest first. */
    private years(): number[] {
        const years = new Set(this.sourceYears);

        for (const spec of Object.values(this.sources)) {
            for (const year of Object.keys(spec.drawn ?? {})) years.add(Number(year));
        }

        return [...years].sort((left, right) => left - right);
    }

    private async cutsFor(civilization: CivilizationRecord, years: readonly number[]): Promise<Cut[]> {
        const spec = this.sources[civilization.key];
        if (!spec) throw new Error(`A civilização "${civilization.key}" não tem território mapeado.`);

        const cuts: Cut[] = [];

        for (const year of years) {
            if (year < civilization.realm.from || year > civilization.realm.to) continue;

            const cut = await this.cutAt(spec, year);
            if (cut) cuts.push(cut);
        }

        return cuts;
    }

    private async cutAt(spec: TerritorySpec, year: number): Promise<Cut | null> {
        const drawn = spec.drawn?.[year];
        if (drawn) {
            const rings = shape(drawnRings(drawn.rings));

            return rings.length === 0 ? null : { year, origin: 'drawn', sourceNames: [], precision: 1, rings };
        }

        if (!this.sourceYears.includes(year)) return null;

        const wanted = spec.overrides?.[year] ?? spec.aliases;
        if (wanted.length === 0) return null;

        const features = (await this.archive.year(year)).filter(
            (feature) => feature.properties.NAME !== null && wanted.includes(feature.properties.NAME),
        );
        if (features.length === 0) return null;

        const collected = this.collect(features, spec);
        if (spec.patch) collected.push(...drawnRings(spec.patch.rings));
        if (collected.length === 0) return null;

        const rings = shape(merge(collected));
        if (rings.length === 0) return null;

        return {
            year,
            origin: 'dataset',
            sourceNames: [...new Set(features.map((feature) => feature.properties.NAME ?? ''))].sort(),
            precision: Math.min(...features.map((feature) => feature.properties.BORDERPRECISION ?? 1)),
            rings,
        };
    }

    private collect(features: readonly BasemapFeature[], spec: TerritorySpec): MultiPolygonRings[number][] {
        const parts: MultiPolygonRings[number][] = [];

        for (const feature of features) {
            const { geometry } = feature;
            const polygons: MultiPolygonRings =
                geometry.type === 'Polygon'
                    ? [geometry.coordinates as MultiPolygonRings[number]]
                    : geometry.type === 'MultiPolygon'
                      ? (geometry.coordinates as MultiPolygonRings)
                      : [];

            for (const polygon of polygons) {
                if (spec.drop && dropped(polygon, spec.drop)) continue;
                parts.push(polygon);
            }
        }

        return parts;
    }

    private sliceAt(year: number, cuts: ReadonlyMap<string, Cut[]>): Slice {
        const realms: Realm[] = [];

        for (const civilization of this.civilizations) {
            if (year < civilization.realm.from || year > civilization.realm.to) continue;

            const cut = nearest(cuts.get(civilization.key) ?? [], year, this.sources[civilization.key]?.absent ?? []);
            if (!cut) continue;

            realms.push(describe(civilization.key, cut, year));
        }

        return { year, realms, frontiers: frontiersAmong(realms) };
    }

    private summaries(cuts: ReadonlyMap<string, Cut[]>): CivilizationSummary[] {
        return this.civilizations.map((civilization) => {
            const own = cuts.get(civilization.key) ?? [];
            const measured = own.map((cut) => ({ year: cut.year, area: areaInSquareKm(cut.rings) }));
            const peak = measured.reduce((best, entry) => (entry.area > best.area ? entry : best), {
                year: own[0].year,
                area: 0,
            });

            return {
                civ: civilization.key,
                slices: own.map((cut) => cut.year),
                peakYear: peak.year,
                peakAreaKm2: Math.round(peak.area),
            };
        });
    }

    private checkEveryCivilizationStands(cuts: ReadonlyMap<string, Cut[]>): void {
        const empty = this.civilizations.filter((civ) => (cuts.get(civ.key) ?? []).length === 0);
        if (empty.length === 0) return;

        throw new Error(`Sem nenhuma fronteira em nenhum século: ${empty.map((civ) => civ.key).join(', ')}.`);
    }

    /**
     * Refuses a Wonder the atlas cannot reach from its own civilization's borders.
     *
     * This is the check that would have caught all ten of the misplaced monuments the first
     * version shipped with. A monument outside every slice is nearly always a wrong coordinate
     * or a missing source name, so the build stops rather than drawing something misleading.
     */
    private checkWondersStandInside(cuts: ReadonlyMap<string, Cut[]>): void {
        const strays: string[] = [];

        for (const civilization of this.civilizations) {
            if (this.allowedOutside[civilization.key]) continue;

            const at: Position = [civilization.wonder.lon, civilization.wonder.lat];
            const own = cuts.get(civilization.key) ?? [];
            const reach = own.map((cut) => distanceToKm(cut.rings, at));

            if (reach.some((km) => km <= COASTAL_TOLERANCE_KM)) continue;

            strays.push(`${civilization.key} (${Math.round(Math.min(...reach))} km em ${own.length} fatias)`);
        }

        if (strays.length === 0) return;

        throw new Error(
            `Maravilhas fora do próprio território: ${strays.join(', ')}. ` +
                'Corrija a coordenada, os aliases da fonte, ou registre o motivo em WONDERS_OUTSIDE_THE_REALM.',
        );
    }
}

function describe(civ: string, cut: Cut, year: number): Realm {
    const { west, south, east, north } = boundingBox(cut.rings);

    return {
        civ,
        from: cut.year,
        exact: cut.year === year,
        origin: cut.origin,
        sourceNames: cut.sourceNames,
        precision: cut.precision,
        areaKm2: Math.round(areaInSquareKm(cut.rings)),
        bbox: [round(west, 3), round(south, 3), round(east, 3), round(north, 3)],
        centroid: centroidOf(cut.rings),
        rings: cut.rings,
    };
}

/**
 * The cut for a year, or the nearest one the civilization has.
 *
 * A century the source does not map is bridged with the nearest border, because the source is
 * patchy and a hole in it is nearly always a hole in the data: England is missing from 1279 to
 * 1400 and Goryeo from the same years, and both plainly existed. The one thing that stops the
 * bridge is a declared absence — the realm was gone, somebody else held the ground, and the old
 * line would invent a state. That judgement is written down per civilization, with its reason,
 * rather than inferred from the shape of the gaps.
 */
function nearest(cuts: readonly Cut[], year: number, absent: readonly { from: number; to: number }[]): Cut | null {
    if (cuts.length === 0) return null;
    if (absent.some((gap) => year >= gap.from && year <= gap.to)) return null;

    return cuts.reduce((best, cut) => (Math.abs(cut.year - year) < Math.abs(best.year - year) ? cut : best));
}

function frontiersAmong(realms: readonly Realm[]): Frontier[] {
    const frontiers: Frontier[] = [];

    for (let left = 0; left < realms.length; left += 1) {
        for (let right = left + 1; right < realms.length; right += 1) {
            const found = frontierBetween(realms[left], realms[right]);
            if (found) frontiers.push(found);
        }
    }

    return frontiers.sort((first, second) => second.areaKm2 - first.areaKm2);
}

function frontierBetween(a: Realm, b: Realm): Frontier | null {
    if (!boxesTouch(a.bbox, b.bbox)) return null;

    let shared: MultiPolygonRings;
    try {
        shared = overlap(a.rings, b.rings);
    } catch {
        // A self-touching border can defeat the clipper; a missing pair beats a failed build.
        return null;
    }

    if (shared.length === 0) return null;

    const area = areaInSquareKm(shared);
    const shareOfA = area / a.areaKm2;
    const shareOfB = area / b.areaKm2;

    if (Math.max(shareOfA, shareOfB) < MIN_OVERLAP_SHARE) return null;

    return {
        a: a.civ,
        b: b.civ,
        areaKm2: Math.round(area),
        shareOfA: round(shareOfA, 4),
        shareOfB: round(shareOfB, 4),
        carried: !a.exact || !b.exact,
    };
}

/** How far a point sits from a shape, in kilometres; zero when it is inside. */
function distanceToKm(rings: MultiPolygonRings, at: Position): number {
    if (geoContains({ type: 'MultiPolygon', coordinates: rings }, [at[0], at[1]])) return 0;

    let nearestKm = Infinity;
    for (const polygon of rings) {
        for (const ring of polygon) {
            for (const point of ring) {
                const km = geoDistance([at[0], at[1]], [point[0], point[1]]) * 6371.0088;
                if (km < nearestKm) nearestKm = km;
            }
        }
    }

    return nearestKm;
}

function dropped(polygon: MultiPolygonRings[number], boxes: readonly { west: number; south: number; east: number; north: number }[]): boolean {
    const [lon, lat] = centroidOf([polygon]);

    return boxes.some((box) => lon >= box.west && lon <= box.east && lat >= box.south && lat <= box.north);
}

function merge(parts: MultiPolygonRings): MultiPolygonRings {
    if (parts.length <= 1) return parts;

    try {
        return dissolve(parts);
    } catch {
        // Dissolving is a nicety: overlapping source polygons still draw correctly stacked.
        return parts;
    }
}

function shape(rings: MultiPolygonRings): MultiPolygonRings {
    if (rings.length === 0) return rings;

    const { west, south, east, north } = boundingBox(rings);
    const diagonal = Math.hypot(east - west, north - south);
    const tolerance = Math.min(MAX_TOLERANCE, Math.max(MIN_TOLERANCE, diagonal * SIMPLIFY_FRACTION));

    return rewindMultiPolygon(roundMultiPolygon(simplifyMultiPolygon(rings, tolerance), COORDINATE_DECIMALS));
}

function drawnRings(rings: DrawnRings): MultiPolygonRings {
    return rings.map((ring) => [closeRing(ring.map(([lon, lat]): Position => [lon, lat]))]);
}

function boxesTouch(a: [number, number, number, number], b: [number, number, number, number]): boolean {
    return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}

function round(value: number, decimals: number): number {
    const factor = 10 ** decimals;

    return Math.round(value * factor) / factor;
}
