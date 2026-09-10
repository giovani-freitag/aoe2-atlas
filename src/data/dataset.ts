import { Civilization } from '@/domain/entities/civilization.ts';
import type { RegionKey } from '@/domain/enums/region.ts';
import { REGION_KEYS } from '@/domain/enums/region.ts';
import { Territory, type MultiPolygonRings } from '@/domain/values/territory.ts';
import { YearSpan } from '@/domain/values/year-span.ts';
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';
import generated from '@/data/generated/territories.json';
import landShape from '@/data/generated/land.json';

/** One pair of civilizations that both claim the same ground. */
export interface Conflict {
    a: string;
    b: string;
    areaKm2: number;
    /** The shared ground as a fraction of each realm. */
    shareOfA: number;
    shareOfB: number;
}

interface TerritoryJson {
    civ: string;
    year: number;
    origin: string;
    sourceNames: string[];
    areaKm2: number;
    bbox: [number, number, number, number];
    centroid: [number, number];
    rings: number[][][][];
}

interface GeneratedJson {
    generatedAt: string;
    territories: TerritoryJson[];
    overlaps: Conflict[];
}

const dataset = generated as GeneratedJson;
const byCiv = new Map(dataset.territories.map((entry) => [entry.civ, entry]));

/** The coastline the realms are drawn over, from Natural Earth by way of world-atlas. */
export const LAND_RINGS: MultiPolygonRings = (landShape as { coordinates: number[][][][] }).coordinates;

/** Every civilization, assembled from the curated records and the generated geometry. */
export const CIVILIZATIONS: readonly Civilization[] = CIVILIZATION_RECORDS.map((record) => {
    const entry = byCiv.get(record.key);
    if (!entry) throw new Error(`Falta a geometria de "${record.key}". Rode "npm run data:build".`);

    const [west, south, east, north] = entry.bbox;

    return new Civilization({
        key: record.key,
        name: record.name,
        icon: record.icon,
        expansion: record.expansion,
        region: record.region,
        wonder: {
            monument: record.wonder.monument,
            place: record.wonder.place,
            country: record.wonder.country,
            at: { lon: record.wonder.lon, lat: record.wonder.lat },
            wikipedia: record.wonder.wikipedia,
            anachronism: record.wonder.anachronism,
        },
        realmLabel: record.realm.label,
        span: new YearSpan(record.realm.from, record.realm.to),
        territory: new Territory({
            rings: entry.rings,
            year: entry.year,
            origin: entry.origin === 'drawn' ? 'drawn' : 'dataset',
            sourceNames: entry.sourceNames,
            areaKm2: entry.areaKm2,
            bbox: { west, south, east, north },
            centroid: { lon: entry.centroid[0], lat: entry.centroid[1] },
        }),
    });
});

/** Every pair of civilizations whose realms cover common ground. */
export const CONFLICTS: readonly Conflict[] = dataset.overlaps;

function groupByRegion(): Record<RegionKey, readonly string[]> {
    const membership = {} as Record<RegionKey, readonly string[]>;

    for (const region of REGION_KEYS) {
        membership[region] = CIVILIZATIONS.filter((civ) => civ.region === region).map((civ) => civ.key);
    }

    return membership;
}

/** Which civilizations sit in each region, in catalogue order, for the palette to texture them. */
export const REGION_MEMBERSHIP: Readonly<Record<RegionKey, readonly string[]>> = groupByRegion();

/** When the shipped geometry was cut, shown in the credits so a stale build is visible. */
export const GENERATED_AT = dataset.generatedAt;
