import { beforeEach, describe, expect, it } from 'vitest';
import type { Conflict } from '@/data/dataset.ts';
import { AtlasService } from '@/services/atlas/atlas-service.ts';
import { civilizationStub } from '../../../fixtures/civilizations.ts';

const MONGOLS = civilizationStub({
    key: 'mongols',
    name: 'Mongóis',
    region: 'step',
    from: 1206,
    to: 1368,
    areaKm2: 22_885_825,
    monument: 'Grande tenda de Gêngis Khan',
    place: 'Carachorum',
});

const CIVILIZATIONS = [
    MONGOLS,
    civilizationStub({
        key: 'tatars',
        name: 'Tártaros',
        region: 'step',
        from: 1240,
        to: 1507,
        areaKm2: 5_091_000,
        monument: 'Observatório de Ulugue Begue',
        place: 'Samarcanda',
    }),
    civilizationStub({
        key: 'britons',
        name: 'Bretões',
        region: 'weur',
        from: 800,
        to: 1500,
        areaKm2: 259_345,
        monument: 'Catedral de Chichester',
        place: 'Chichester',
    }),
    civilizationStub({
        key: 'romans',
        name: 'Romanos',
        expansion: 'ror',
        region: 'med',
        from: -27,
        to: 476,
        areaKm2: 4_875_526,
        monument: 'Coliseu',
        place: 'Roma',
    }),
];

const CONFLICTS: Conflict[] = [
    { a: 'mongols', b: 'tatars', areaKm2: 5_088_636, shareOfA: 0.2223, shareOfB: 0.9995 },
];

describe('AtlasService', () => {
    let atlas: AtlasService;

    beforeEach(() => {
        atlas = new AtlasService({
            civilizations: CIVILIZATIONS,
            conflicts: CONFLICTS,
            expansionOrder: ['aok', 'ror'],
        });
    });

    it('finds a civilization by key', () => {
        const found = atlas.find('tatars');

        expect(found?.name).toBe('Tártaros');
    });

    it('hands back null for a key nothing carries', () => {
        const found = atlas.find('atlanteans');

        expect(found).toBeNull();
    });

    it('matches a search that ignores accents and case', () => {
        const found = atlas.search({ text: 'mongois' });

        expect(found.map((civ) => civ.key)).toEqual(['mongols']);
    });

    it('matches on the monument as well as the name', () => {
        const found = atlas.search({ text: 'chichester' });

        expect(found.map((civ) => civ.key)).toEqual(['britons']);
    });

    it('keeps only the civilizations standing in a year', () => {
        const found = atlas.search({ year: 1300 });

        expect(found.map((civ) => civ.key).sort()).toEqual(['britons', 'mongols', 'tatars']);
    });

    it('keeps only the chosen expansions', () => {
        const found = atlas.search({ expansions: ['ror'] });

        expect(found.map((civ) => civ.key)).toEqual(['romans']);
    });

    it('treats an empty expansion list as no filter at all', () => {
        const found = atlas.search({ expansions: [] });

        expect(found).toHaveLength(CIVILIZATIONS.length);
    });

    it('orders by area, largest realm first', () => {
        const found = atlas.search({ order: 'area' });

        expect(found.map((civ) => civ.key)).toEqual(['mongols', 'tatars', 'romans', 'britons']);
    });

    it('orders by the year a civilization first stood', () => {
        const found = atlas.search({ order: 'year' });

        expect(found.map((civ) => civ.key)).toEqual(['romans', 'britons', 'mongols', 'tatars']);
    });

    it('orders by name using Portuguese collation', () => {
        const found = atlas.search({ order: 'name' });

        expect(found.map((civ) => civ.key)).toEqual(['britons', 'mongols', 'romans', 'tatars']);
    });

    it('reports a conflict from the side that was asked about', () => {
        const found = atlas.conflictsOf('tatars');

        expect(found).toEqual([{ other: MONGOLS, areaKm2: 5_088_636, shareOfThis: 0.9995, shareOfOther: 0.2223 }]);
    });

    it('reports no conflicts for a realm nobody else touches', () => {
        const found = atlas.conflictsOf('britons');

        expect(found).toEqual([]);
    });

    it('spans from the earliest civilization to the latest', () => {
        const range = atlas.yearRange();

        expect(range).toEqual({ from: -27, to: 1507 });
    });
});
