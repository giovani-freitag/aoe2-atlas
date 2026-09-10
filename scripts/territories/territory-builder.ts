import type { CivilizationRecord } from '@/data/civilizations.ts';
import type { TerritorySource } from '@/data/territory-sources.ts';
import {
    areaInSquareKm,
    boundingBox,
    centroidOf,
    closeRing,
    countPoints,
    rewindMultiPolygon,
    roundMultiPolygon,
    simplifyMultiPolygon,
    type MultiPolygonRings,
    type Position,
} from './geometry.ts';
import { dissolve, overlap } from './polygon-boolean.ts';
import type { BasemapArchive } from './basemap-archive.ts';

/** How coarse a border may get, as a fraction of the diagonal of the box it fits in. */
const SIMPLIFY_FRACTION = 1 / 320;

/** Floor and ceiling on that tolerance, in degrees, so tiny realms keep their shape. */
const MIN_TOLERANCE = 0.015;
const MAX_TOLERANCE = 0.14;

/** A hundred metres of precision, far finer than any border here is actually known to. */
const COORDINATE_DECIMALS = 3;

/** Overlaps below this share of the smaller realm are noise from coarse borders, not a conflict. */
const MIN_OVERLAP_SHARE = 0.02;

export interface TerritoryBuilderConfig {
    archive: BasemapArchive;
    civilizations: readonly CivilizationRecord[];
    sources: Readonly<Record<string, TerritorySource>>;
}

export interface TerritoryEntry {
    civ: string;
    /** The year the border is drawn for. */
    year: number;
    origin: 'dataset' | 'drawn';
    /** Polity names dissolved together, or an empty list for a hand-drawn border. */
    sourceNames: string[];
    areaKm2: number;
    /** West, south, east, north, in degrees. */
    bbox: [number, number, number, number];
    centroid: Position;
    rings: MultiPolygonRings;
}

export interface OverlapEntry {
    a: string;
    b: string;
    areaKm2: number;
    /** The shared ground as a fraction of each realm, so a reader sees who is swallowed by whom. */
    shareOfA: number;
    shareOfB: number;
}

export interface TerritoryDataset {
    generatedAt: string;
    territories: TerritoryEntry[];
    overlaps: OverlapEntry[];
}

/**
 * Turns the curated source list into one border per civilization, plus the ground they share.
 *
 * The two halves belong together because the overlap table is only meaningful against the exact
 * simplified borders that ship: measuring conflicts on the full-precision source and then
 * thinning the shapes would report an overlap the drawn map does not show.
 */
export class TerritoryBuilder {
    private readonly archive: BasemapArchive;
    private readonly civilizations: readonly CivilizationRecord[];
    private readonly sources: Readonly<Record<string, TerritorySource>>;

    constructor(config: TerritoryBuilderConfig) {
        this.archive = config.archive;
        this.civilizations = config.civilizations;
        this.sources = config.sources;
    }

    /**
     * Builds every border and every overlap between them.
     *
     * @returns The dataset the application ships.
     * @throws When a civilization has no source, or a source names a polity the year file lacks.
     */
    public async build(): Promise<TerritoryDataset> {
        const territories: TerritoryEntry[] = [];

        for (const civilization of this.civilizations) {
            territories.push(await this.territoryOf(civilization));
        }

        return {
            generatedAt: new Date().toISOString(),
            territories,
            overlaps: this.overlapsBetween(territories),
        };
    }

    private async territoryOf(civilization: CivilizationRecord): Promise<TerritoryEntry> {
        const source = this.sources[civilization.key];
        if (!source) throw new Error(`A civilização "${civilization.key}" não tem território mapeado.`);

        const raw = source.kind === 'drawn' ? drawnRings(source.rings) : await this.pickedRings(source);
        const merged = mergeRings(raw, civilization.key);
        const shaped = shapeRings(merged);

        if (shaped.length === 0) throw new Error(`O território de "${civilization.key}" saiu vazio.`);

        const [west, south, east, north] = boxTuple(shaped);
        const points = countPoints(shaped);
        const area = areaInSquareKm(shaped);
        console.log(`  ${civilization.key.padEnd(13)} ${formatArea(area)} km²  ${String(points).padStart(5)} pontos`);

        return {
            civ: civilization.key,
            year: source.kind === 'drawn' ? civilization.realm.peakYear : source.year,
            origin: source.kind === 'drawn' ? 'drawn' : 'dataset',
            sourceNames: source.kind === 'drawn' ? [] : [...source.names],
            areaKm2: Math.round(area),
            bbox: [west, south, east, north],
            centroid: centroidOf(shaped),
            rings: shaped,
        };
    }

    private async pickedRings(source: Extract<TerritorySource, { kind: 'pick' }>): Promise<MultiPolygonRings> {
        const features = await this.archive.year(source.year);
        const collected: MultiPolygonRings = [];

        for (const name of source.names) {
            const matches = features.filter((feature) => feature.properties.NAME === name);

            if (matches.length === 0) {
                const available = await this.archive.names(source.year);
                const close = available.filter((candidate) => candidate.toLowerCase().includes(name.slice(0, 4).toLowerCase()));
                throw new Error(
                    `O arquivo de ${source.year} não tem "${name}".` +
                        (close.length > 0 ? ` Talvez: ${close.slice(0, 8).join(', ')}.` : ''),
                );
            }

            for (const match of matches) {
                const { geometry } = match;
                if (geometry.type === 'Polygon') collected.push(geometry.coordinates as MultiPolygonRings[number]);
                if (geometry.type === 'MultiPolygon') collected.push(...(geometry.coordinates as MultiPolygonRings));
            }
        }

        return collected;
    }

    private overlapsBetween(territories: TerritoryEntry[]): OverlapEntry[] {
        const overlaps: OverlapEntry[] = [];

        for (let left = 0; left < territories.length; left += 1) {
            for (let right = left + 1; right < territories.length; right += 1) {
                const entry = overlapOf(territories[left], territories[right]);
                if (entry) overlaps.push(entry);
            }
        }

        return overlaps.sort((first, second) => second.areaKm2 - first.areaKm2);
    }
}

function overlapOf(a: TerritoryEntry, b: TerritoryEntry): OverlapEntry | null {
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
    };
}

function mergeRings(rings: MultiPolygonRings, civ: string): MultiPolygonRings {
    if (rings.length === 0) return rings;
    if (rings.length === 1) return rings;

    try {
        return dissolve(rings);
    } catch {
        // Dissolving is a nicety: overlapping source polygons still draw correctly stacked.
        console.warn(`  aviso: não consegui dissolver os polígonos de "${civ}"; seguindo empilhados.`);
        return rings;
    }
}

function shapeRings(rings: MultiPolygonRings): MultiPolygonRings {
    const [west, south, east, north] = boxTuple(rings);
    const diagonal = Math.hypot(east - west, north - south);
    const tolerance = Math.min(MAX_TOLERANCE, Math.max(MIN_TOLERANCE, diagonal * SIMPLIFY_FRACTION));

    return rewindMultiPolygon(roundMultiPolygon(simplifyMultiPolygon(rings, tolerance), COORDINATE_DECIMALS));
}

function drawnRings(rings: readonly (readonly (readonly [number, number])[])[]): MultiPolygonRings {
    return rings.map((ring) => [closeRing(ring.map(([lon, lat]): Position => [lon, lat]))]);
}

function boxTuple(rings: MultiPolygonRings): [number, number, number, number] {
    const { west, south, east, north } = boundingBox(rings);

    return [round(west, 3), round(south, 3), round(east, 3), round(north, 3)];
}

function boxesTouch(a: [number, number, number, number], b: [number, number, number, number]): boolean {
    return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}

function round(value: number, decimals: number): number {
    const factor = 10 ** decimals;

    return Math.round(value * factor) / factor;
}

function formatArea(area: number): string {
    return Math.round(area).toLocaleString('pt-BR').padStart(12);
}
