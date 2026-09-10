/**
 * Rebuilds the shipped geography: one border per civilization, plus the coastline under them.
 *
 * Borders are cut from aourednik/historical-basemaps, which publishes a world GeoJSON per
 * century under the GPL; the year files are cached in .cache and never committed. The coastline
 * comes from Natural Earth by way of world-atlas, which is public domain. Both outputs land in
 * src/data/generated and are committed, so the application itself downloads nothing.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { MultiPolygon } from 'geojson';
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';
import { TERRITORY_SOURCES } from '@/data/territory-sources.ts';
import { BasemapArchive } from './territories/basemap-archive.ts';
import { TerritoryBuilder } from './territories/territory-builder.ts';
import {
    countPoints,
    rewindMultiPolygon,
    roundMultiPolygon,
    simplifyMultiPolygon,
    type MultiPolygonRings,
} from './territories/geometry.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'data', 'generated');
const CACHE = join(ROOT, '.cache', 'historical-basemaps');

const BASEMAP_URL = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson';

/** Natural Earth's 50m coastline: detailed enough to recognise a bay, small enough to ship. */
const LAND_TOPOJSON = join(ROOT, 'node_modules', 'world-atlas', 'land-50m.json');

/** Roughly a quarter of a degree, which is the width of a coastline stroke at world zoom. */
const LAND_TOLERANCE = 0.06;
const LAND_DECIMALS = 2;

function write(name: string, payload: unknown): void {
    const path = join(OUT, name);
    writeFileSync(path, `${JSON.stringify(payload)}\n`, 'utf8');
    console.log(`  escrito ${name} (${(readFileSync(path).length / 1024).toFixed(0)} kB)`);
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

console.log('\nTerritórios:');
const dataset = await new TerritoryBuilder({
    archive: new BasemapArchive({ cacheDir: CACHE, baseUrl: BASEMAP_URL }),
    civilizations: CIVILIZATION_RECORDS,
    sources: TERRITORY_SOURCES,
}).build();

console.log(`\n${dataset.overlaps.length} pares de civilizações dividem terreno. Dez maiores:`);
for (const overlap of dataset.overlaps.slice(0, 10)) {
    const share = Math.round(Math.max(overlap.shareOfA, overlap.shareOfB) * 100);
    console.log(`  ${overlap.a} × ${overlap.b}: ${overlap.areaKm2.toLocaleString('pt-BR')} km² (${share}%)`);
}

console.log('');
mkdirSync(OUT, { recursive: true });
const landShape: MultiPolygon = { type: 'MultiPolygon', coordinates: land };
write('land.json', landShape);
write('territories.json', dataset);
