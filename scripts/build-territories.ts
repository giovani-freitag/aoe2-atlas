/**
 * Rebuilds the shipped geography: one border per civilization per century, plus the coastline.
 *
 * Borders are cut from aourednik/historical-basemaps, which publishes a world GeoJSON per
 * century under the GPL; the year files are cached in .cache and never committed. The coastline
 * comes from Natural Earth by way of world-atlas, which is public domain.
 *
 * Two kinds of output leave here. A small index in src/data/generated is bundled and always
 * loaded; the slices and the coastline land in public/data, fetched when they are needed,
 * because six hundred polygons in one bundle is not something a phone should have to swallow
 * to look at a single century.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { MultiPolygon } from 'geojson';
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';
import { TERRITORY_SOURCES, WONDERS_OUTSIDE_THE_REALM } from '@/data/territory-sources.ts';
import { BasemapArchive } from './territories/basemap-archive.ts';
import { SliceBuilder } from './territories/slice-builder.ts';
import {
    countPoints,
    rewindMultiPolygon,
    roundMultiPolygon,
    simplifyMultiPolygon,
    type MultiPolygonRings,
} from './territories/geometry.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_OUT = join(ROOT, 'src', 'data', 'generated');
const SLICE_OUT = join(ROOT, 'public', 'data');
const CACHE = join(ROOT, '.cache', 'historical-basemaps');

const BASEMAP_URL = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson';

/** The years the source publishes inside the window Age of Empires II covers. */
const SOURCE_YEARS = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1279, 1300, 1400, 1492, 1500, 1530, 1600];

/** Natural Earth's 50m coastline: detailed enough to recognise a bay, small enough to ship. */
const LAND_TOPOJSON = join(ROOT, 'node_modules', 'world-atlas', 'land-50m.json');

/** Roughly a quarter of a degree, which is the width of a coastline stroke at world zoom. */
const LAND_TOLERANCE = 0.06;
const LAND_DECIMALS = 2;

function write(directory: string, name: string, payload: unknown): number {
    const path = join(directory, name);
    writeFileSync(path, `${JSON.stringify(payload)}\n`, 'utf8');

    return readFileSync(path).length;
}

function buildLand(): MultiPolygonRings {
    const topology = JSON.parse(readFileSync(LAND_TOPOJSON, 'utf8')) as Topology<{ land: GeometryCollection }>;
    const collection = feature(topology, topology.objects.land);
    const rings: MultiPolygonRings = [];

    for (const land of collection.features) {
        const { geometry } = land;
        if (geometry.type === 'Polygon') rings.push(geometry.coordinates as MultiPolygonRings[number]);
        if (geometry.type === 'MultiPolygon') rings.push(...(geometry.coordinates as MultiPolygonRings));
    }

    return rewindMultiPolygon(roundMultiPolygon(simplifyMultiPolygon(rings, LAND_TOLERANCE), LAND_DECIMALS));
}

console.log('Costa (Natural Earth 50m):');
const land = buildLand();
console.log(`  ${land.length} polígonos, ${countPoints(land)} pontos`);

console.log('\nFatias temporais:');
const dataset = await new SliceBuilder({
    archive: new BasemapArchive({ cacheDir: CACHE, baseUrl: BASEMAP_URL }),
    civilizations: CIVILIZATION_RECORDS,
    sources: TERRITORY_SOURCES,
    allowedOutside: WONDERS_OUTSIDE_THE_REALM,
    sourceYears: SOURCE_YEARS,
}).build();

for (const slice of dataset.slices) {
    const drawn = slice.realms.filter((realm) => realm.exact).length;
    const carried = slice.realms.length - drawn;
    console.log(
        `  ${String(slice.year).padStart(4)}  ${String(slice.realms.length).padStart(2)} reinos` +
            ` (${drawn} próprios, ${carried} da fatia vizinha)` +
            `  ${String(slice.frontiers.length).padStart(3)} fronteiras`,
    );
}

const thin = dataset.civilizations.filter((civ) => civ.slices.length <= 1);
console.log(`\n${thin.length} civilizações têm uma única fatia: ${thin.map((civ) => civ.civ).join(', ')}`);

console.log('');
mkdirSync(INDEX_OUT, { recursive: true });
rmSync(SLICE_OUT, { recursive: true, force: true });
mkdirSync(SLICE_OUT, { recursive: true });

const landShape: MultiPolygon = { type: 'MultiPolygon', coordinates: land };
console.log(`  land.json  ${(write(SLICE_OUT, 'land.json', landShape) / 1024).toFixed(0)} kB`);

const index = {
    generatedAt: dataset.generatedAt,
    years: dataset.years,
    civilizations: dataset.civilizations,
};
console.log(`  atlas-index.json  ${(write(INDEX_OUT, 'atlas-index.json', index) / 1024).toFixed(0)} kB`);

let total = 0;
for (const slice of dataset.slices) {
    total += write(SLICE_OUT, `slice-${slice.year}.json`, slice);
}
console.log(`  ${dataset.slices.length} fatias em public/data  ${(total / 1024).toFixed(0)} kB no total`);
