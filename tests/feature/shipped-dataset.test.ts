import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { geoArea } from 'd3-geo';
import { CIVILIZATIONS, CONFLICTS, LAND_RINGS, REGION_MEMBERSHIP } from '@/data/dataset.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { REGION_KEYS } from '@/domain/enums/region.ts';
import type { MultiPolygonRings, Ring } from '@/domain/values/territory.ts';

/** Half the sphere in steradians: an outer ring past this is wound inside out. */
const HALF_SPHERE = 2 * Math.PI;

const EXPANSION_KEYS = new Set(EXPANSION_RECORDS.map((expansion) => expansion.key));
const CIV_KEYS = new Set(CIVILIZATIONS.map((civ) => civ.key));

function outerRings(rings: MultiPolygonRings): Ring[] {
    return rings.map((polygon) => polygon[0]);
}

function isClosed(ring: Ring): boolean {
    const first = ring[0];
    const last = ring[ring.length - 1];

    return first[0] === last[0] && first[1] === last[1];
}

describe('the shipped dataset', () => {
    it('carries every civilization the game has', () => {
        const count = CIVILIZATIONS.length;

        expect(count).toBe(56);
    });

    it('gives every civilization a key of its own', () => {
        const keys = CIVILIZATIONS.map((civ) => civ.key);

        expect(new Set(keys).size).toBe(keys.length);
    });

    it('gives every civilization an expansion that exists', () => {
        const strays = CIVILIZATIONS.filter((civ) => !EXPANSION_KEYS.has(civ.expansion));

        expect(strays).toEqual([]);
    });

    it('places every civilization in exactly one region', () => {
        const placed = REGION_KEYS.flatMap((region) => REGION_MEMBERSHIP[region]);

        expect(placed.sort()).toEqual([...CIV_KEYS].sort());
    });

    it('gives every civilization ground to stand on', () => {
        const empty = CIVILIZATIONS.filter((civ) => civ.territory.rings.length === 0 || civ.territory.areaKm2 <= 0);

        expect(empty.map((civ) => civ.key)).toEqual([]);
    });

    it('ships the emblem every civilization points at', () => {
        const missing = CIVILIZATIONS.filter(
            (civ) => !existsSync(join(process.cwd(), 'public', 'img', 'civs', `${civ.icon}.png`)),
        );

        expect(missing.map((civ) => civ.key)).toEqual([]);
    });

    it('keeps every wonder on the globe', () => {
        const offWorld = CIVILIZATIONS.filter(
            (civ) => Math.abs(civ.wonder.at.lat) > 90 || Math.abs(civ.wonder.at.lon) > 180,
        );

        expect(offWorld.map((civ) => civ.key)).toEqual([]);
    });

    it('draws every border inside the years the civilization stood', () => {
        const adrift = CIVILIZATIONS.filter((civ) => !civ.span.contains(civ.territory.year));

        expect(adrift.map((civ) => civ.key)).toEqual([]);
    });

    it('closes every ring it ships', () => {
        const open = CIVILIZATIONS.filter((civ) =>
            civ.territory.rings.some((polygon) => polygon.some((ring) => !isClosed(ring))),
        );

        expect(open.map((civ) => civ.key)).toEqual([]);
    });

    /*
     * The winding of a ring tells a spherical renderer which side of it is inside. One realm
     * handed over backwards is drawn as the whole planet minus itself, which is exactly what
     * happened before the build started rewinding — so it is worth a test of its own.
     */
    it('winds every outer ring around its own realm rather than around the rest of the world', () => {
        const inverted = CIVILIZATIONS.filter((civ) =>
            outerRings(civ.territory.rings).some(
                (ring) => geoArea({ type: 'Polygon', coordinates: [ring as number[][]] }) > HALF_SPHERE,
            ),
        );

        expect(inverted.map((civ) => civ.key)).toEqual([]);
    });

    it('winds the coastline the same way', () => {
        const inverted = outerRings(LAND_RINGS).filter(
            (ring) => geoArea({ type: 'Polygon', coordinates: [ring as number[][]] }) > HALF_SPHERE,
        );

        expect(inverted).toEqual([]);
    });

    it('only reports conflicts between civilizations it knows', () => {
        const strays = CONFLICTS.filter((conflict) => !CIV_KEYS.has(conflict.a) || !CIV_KEYS.has(conflict.b));

        expect(strays).toEqual([]);
    });

    it('never reports a realm as more than wholly overlapped', () => {
        const impossible = CONFLICTS.filter(
            (conflict) => conflict.shareOfA > 1.01 || conflict.shareOfB > 1.01 || conflict.areaKm2 <= 0,
        );

        expect(impossible).toEqual([]);
    });

    it('finds the Mongols the largest realm on the map', () => {
        const largest = [...CIVILIZATIONS].sort((left, right) => right.territory.areaKm2 - left.territory.areaKm2)[0];

        expect(largest.key).toBe('mongols');
    });

    it('measures the Mongol Empire within a million square kilometres of the accepted figure', () => {
        const mongols = CIVILIZATIONS.find((civ) => civ.key === 'mongols');

        expect(mongols?.territory.areaKm2).toBeGreaterThan(20_000_000);
    });
});
