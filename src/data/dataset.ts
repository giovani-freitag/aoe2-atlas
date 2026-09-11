import { Civilization } from '@/domain/entities/civilization.ts';
import { REGION_KEYS, type RegionKey } from '@/domain/enums/region.ts';
import type { MultiPolygonRings } from '@/domain/values/geo-shape.ts';
import { YearSpan } from '@/domain/values/year-span.ts';
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';
import index from '@/data/generated/atlas-index.json';
import landShape from '@/data/generated/land.json';

interface AtlasIndexJson {
    generatedAt: string;
    years: number[];
    civilizations: { civ: string; slices: number[]; peakYear: number; peakAreaKm2: number }[];
}

const atlas: AtlasIndexJson = index;
const reachOf = new Map(atlas.civilizations.map((entry) => [entry.civ, entry]));

/** The coastline the realms are drawn over, from Natural Earth by way of world-atlas. */
export const LAND_RINGS: MultiPolygonRings = (landShape as { coordinates: number[][][][] }).coordinates;

/** The centuries the atlas has maps for, oldest first. */
export const SLICE_YEARS: readonly number[] = atlas.years;

/**
 * Every civilization, assembled from the curated records and the measured reach of its borders.
 *
 * Only the summary is bundled. The borders themselves are a good half a megabyte across all
 * nineteen centuries, so they are fetched one century at a time by the slice service.
 */
export const CIVILIZATIONS: readonly Civilization[] = CIVILIZATION_RECORDS.map((record) => {
    const reach = reachOf.get(record.key);
    if (!reach) throw new Error(`Falta a geometria de "${record.key}". Rode "npm run data:build".`);

    return new Civilization({
        key: record.key,
        icon: record.icon,
        expansion: record.expansion,
        region: record.region,
        wonder: {
            at: { lon: record.wonder.lon, lat: record.wonder.lat },
            wikipedia: record.wonder.wikipedia,
            wikipediaLang: record.wonder.wikipediaLang ?? 'en',
            anachronistic: record.wonder.anachronistic === true,
        },
        span: new YearSpan(record.realm.from, record.realm.to),
        reach: { slices: reach.slices, peakYear: reach.peakYear, peakAreaKm2: reach.peakAreaKm2 },
    });
});

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
export const GENERATED_AT = atlas.generatedAt;
