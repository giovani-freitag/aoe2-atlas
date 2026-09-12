import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { geoArea, geoContains, geoDistance } from 'd3-geo';
import { CIVILIZATIONS, LAND_RINGS, REGION_MEMBERSHIP, SLICE_YEARS } from '@/data/dataset.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { REGION_KEYS } from '@/domain/enums/region.ts';
import type { MultiPolygonRings, Ring } from '@/domain/values/geo-shape.ts';
import { TERRITORY_SOURCES, WONDERS_OUTSIDE_THE_REALM } from '@/data/territory-sources.ts';

/** Half the sphere in steradians: an outer ring past this is wound inside out. */
const HALF_SPHERE = 2 * Math.PI;

/** The slack a coastal monument gets against a simplified coastline. */
const COASTAL_TOLERANCE_KM = 12;

interface SliceJson {
    year: number;
    realms: { civ: string; from: number; exact: boolean; areaKm2: number; rings: number[][][][] }[];
    frontiers: { a: string; b: string; shareOfA: number; shareOfB: number }[];
}

const SLICES: SliceJson[] = SLICE_YEARS.map(
    (year) => JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', `slice-${year}.json`), 'utf8')) as SliceJson,
);

const CIV_KEYS = new Set(CIVILIZATIONS.map((civ) => civ.key));
const SPANS = new Map(CIVILIZATIONS.map((civ) => [civ.key, civ.span]));

function outerRings(rings: MultiPolygonRings): Ring[] {
    return rings.map((polygon) => polygon[0]);
}

function isWoundInsideOut(ring: Ring): boolean {
    return geoArea({ type: 'Polygon', coordinates: [ring as number[][]] }) > HALF_SPHERE;
}

describe('the shipped geography', () => {
    it('carries every civilization the game has', () => {
        const count = CIVILIZATIONS.length;

        expect(count).toBe(56);
    });

    it('gives every civilization a key of its own', () => {
        const keys = CIVILIZATIONS.map((civ) => civ.key);

        expect(new Set(keys).size).toBe(keys.length);
    });

    it('gives every civilization an expansion that exists', () => {
        const known = new Set(EXPANSION_RECORDS.map((expansion) => expansion.key));

        const strays = CIVILIZATIONS.filter((civ) => !known.has(civ.expansion));

        expect(strays).toEqual([]);
    });

    it('places every civilization in exactly one region', () => {
        const placed = REGION_KEYS.flatMap((region) => REGION_MEMBERSHIP[region]);

        expect(placed.sort()).toEqual([...CIV_KEYS].sort());
    });

    it('ships the emblem every civilization points at', () => {
        const missing = CIVILIZATIONS.filter(
            (civ) => !existsSync(join(process.cwd(), 'public', 'img', 'civs', `${civ.icon}.webp`)),
        );

        expect(missing.map((civ) => civ.key)).toEqual([]);
    });

    it('gives every civilization a border in at least one century', () => {
        const groundless = CIVILIZATIONS.filter((civ) => civ.reach.slices.length === 0);

        expect(groundless.map((civ) => civ.key)).toEqual([]);
    });

    it('keeps every wonder on the globe', () => {
        const offWorld = CIVILIZATIONS.filter(
            (civ) => Math.abs(civ.wonder.at.lat) > 90 || Math.abs(civ.wonder.at.lon) > 180,
        );

        expect(offWorld.map((civ) => civ.key)).toEqual([]);
    });

    /*
     * The first version shipped ten monuments standing outside the realm that built them —
     * the Somnath temple two hundred and forty-eight kilometres beyond the Gurjaras, and so on.
     * Cutting one border per century fixed eight of them; the two that remain are true, and
     * have to say why in the allow list.
     */
    it('reaches every wonder from its own borders, or says why not', () => {
        const strays: string[] = [];

        for (const civ of CIVILIZATIONS) {
            if (WONDERS_OUTSIDE_THE_REALM[civ.key]) continue;

            const at: [number, number] = [civ.wonder.at.lon, civ.wonder.at.lat];
            const reached = SLICES.some((slice) =>
                slice.realms.some((realm) => realm.civ === civ.key && withinReach(realm.rings, at)),
            );

            if (!reached) strays.push(civ.key);
        }

        expect(strays).toEqual([]);
    });

    it('only excuses a wonder that is really outside', () => {
        const excused = Object.keys(WONDERS_OUTSIDE_THE_REALM);

        expect(excused.filter((key) => !CIV_KEYS.has(key))).toEqual([]);
    });

    /*
     * A century inside a civilization's span with no border in it is either a declared absence —
     * the realm was genuinely gone, and the spec says why — or a mistake. The first version of
     * the century rule inferred absences from the shape of the gaps and wiped England, Goryeo and
     * Rome out of centuries they plainly stood in. Now every blank has to be accounted for.
     */
    it('explains every century a standing civilization is missing from', () => {
        const unexplained = CIVILIZATIONS.flatMap((civ) => {
            const absences = TERRITORY_SOURCES[civ.key]?.absent ?? [];

            return SLICE_YEARS.filter(
                (year) =>
                    civ.span.contains(year) &&
                    !SLICES.find((slice) => slice.year === year)?.realms.some((realm) => realm.civ === civ.key) &&
                    !absences.some((gap) => year >= gap.from && year <= gap.to),
            ).map((year) => `${civ.key}@${year}`);
        });

        expect(unexplained).toEqual([]);
    });

    it('honours every declared absence', () => {
        const drawnAnyway = CIVILIZATIONS.flatMap((civ) =>
            (TERRITORY_SOURCES[civ.key]?.absent ?? []).flatMap((gap) =>
                SLICES.filter(
                    (slice) =>
                        slice.year >= gap.from &&
                        slice.year <= gap.to &&
                        slice.realms.some((realm) => realm.civ === civ.key),
                ).map((slice) => `${civ.key}@${slice.year}`),
            ),
        );

        expect(drawnAnyway).toEqual([]);
    });

    it('never draws a civilization outside the years it stood', () => {
        const adrift = SLICES.flatMap((slice) =>
            slice.realms.filter((realm) => !SPANS.get(realm.civ)?.contains(slice.year)).map((realm) => `${realm.civ}@${slice.year}`),
        );

        expect(adrift).toEqual([]);
    });

    it('winds every outer ring around its own realm rather than around the rest of the world', () => {
        const inverted = SLICES.flatMap((slice) =>
            slice.realms
                .filter((realm) => outerRings(realm.rings as MultiPolygonRings).some(isWoundInsideOut))
                .map((realm) => `${realm.civ}@${slice.year}`),
        );

        expect(inverted).toEqual([]);
    });

    it('winds the coastline the same way', () => {
        const inverted = outerRings(LAND_RINGS).filter(isWoundInsideOut);

        expect(inverted).toEqual([]);
    });

    /*
     * The whole reason the atlas was rebuilt around centuries. A frontier between realms that
     * never shared a year is not a frontier, and the only way to be sure is to check that both
     * sides of every pair were standing in the century the pair was reported for.
     */
    it('only reports a frontier between civilizations alive in the same century', () => {
        const anachronisms = SLICES.flatMap((slice) =>
            slice.frontiers
                .filter((frontier) => !bothStoodIn(frontier.a, frontier.b, slice.year))
                .map((frontier) => `${frontier.a}×${frontier.b}@${slice.year}`),
        );

        expect(anachronisms).toEqual([]);
    });

    it('never reports a realm as more than wholly overlapped', () => {
        const impossible = SLICES.flatMap((slice) =>
            slice.frontiers.filter((frontier) => frontier.shareOfA > 1.01 || frontier.shareOfB > 1.01),
        );

        expect(impossible).toEqual([]);
    });

    it('finds the Mongols the largest realm the game ever fielded', () => {
        const largest = [...CIVILIZATIONS].sort((left, right) => right.reach.peakAreaKm2 - left.reach.peakAreaKm2)[0];

        expect(largest.key).toBe('mongols');
    });

    it('measures the Mongol Empire at something like its accepted size', () => {
        const mongols = CIVILIZATIONS.find((civ) => civ.key === 'mongols');

        expect(mongols?.reach.peakAreaKm2).toBeGreaterThan(20_000_000);
    });
});

function withinReach(rings: number[][][][], at: [number, number]): boolean {
    if (geoContains({ type: 'MultiPolygon', coordinates: rings }, at)) return true;

    for (const polygon of rings) {
        for (const ring of polygon) {
            for (const point of ring) {
                if (geoDistance(at, [point[0], point[1]]) * 6371.0088 <= COASTAL_TOLERANCE_KM) return true;
            }
        }
    }

    return false;
}

function bothStoodIn(a: string, b: string, year: number): boolean {
    return SPANS.get(a)?.contains(year) === true && SPANS.get(b)?.contains(year) === true;
}
