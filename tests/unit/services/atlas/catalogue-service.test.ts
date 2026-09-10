import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogueService } from '@/services/atlas/catalogue-service.ts';
import { civilizationStub } from '../../../fixtures/civilizations.ts';

const CIVILIZATIONS = [
    civilizationStub({
        key: 'mongols',
        name: 'Mongóis',
        region: 'step',
        from: 1206,
        to: 1368,
        peakAreaKm2: 22_885_825,
        monument: 'Grande tenda de Gêngis Khan',
        place: 'Carachorum',
    }),
    civilizationStub({
        key: 'tatars',
        name: 'Tártaros',
        region: 'step',
        from: 1240,
        to: 1507,
        peakAreaKm2: 12_041_558,
        monument: 'Observatório de Ulugue Begue',
        place: 'Samarcanda',
    }),
    civilizationStub({
        key: 'britons',
        name: 'Bretões',
        region: 'weur',
        from: 800,
        to: 1500,
        peakAreaKm2: 259_345,
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
        peakAreaKm2: 4_875_526,
        monument: 'Coliseu',
        place: 'Roma',
    }),
];

describe('CatalogueService', () => {
    let catalogue: CatalogueService;

    beforeEach(() => {
        catalogue = new CatalogueService({ civilizations: CIVILIZATIONS, expansionOrder: ['aok', 'ror'] });
    });

    it('finds a civilization by key', () => {
        const found = catalogue.find('tatars');

        expect(found?.name).toBe('Tártaros');
    });

    it('hands back null for a key nothing carries', () => {
        const found = catalogue.find('atlanteans');

        expect(found).toBeNull();
    });

    it('matches a search that ignores accents and case', () => {
        const found = catalogue.search({ text: 'mongois' });

        expect(found.map((civ) => civ.key)).toEqual(['mongols']);
    });

    it('matches on the monument as well as the name', () => {
        const found = catalogue.search({ text: 'samarcanda' });

        expect(found.map((civ) => civ.key)).toEqual(['tatars']);
    });

    it('keeps only the civilizations standing in a year', () => {
        const found = catalogue.search({ year: 1300 });

        expect(found.map((civ) => civ.key).sort()).toEqual(['britons', 'mongols', 'tatars']);
    });

    it('keeps only the chosen expansions', () => {
        const found = catalogue.search({ expansions: ['ror'] });

        expect(found.map((civ) => civ.key)).toEqual(['romans']);
    });

    it('treats an empty expansion list as no filter at all', () => {
        const found = catalogue.search({ expansions: [] });

        expect(found).toHaveLength(CIVILIZATIONS.length);
    });

    it('orders by the ground held at the peak, largest first', () => {
        const found = catalogue.search({ order: 'area' });

        expect(found.map((civ) => civ.key)).toEqual(['mongols', 'tatars', 'romans', 'britons']);
    });

    it('orders by the year a civilization first stood', () => {
        const found = catalogue.search({ order: 'year' });

        expect(found.map((civ) => civ.key)).toEqual(['romans', 'britons', 'mongols', 'tatars']);
    });

    it('orders by name using Portuguese collation', () => {
        const found = catalogue.search({ order: 'name' });

        expect(found.map((civ) => civ.key)).toEqual(['britons', 'mongols', 'romans', 'tatars']);
    });

    it('spans from the earliest civilization to the latest', () => {
        const range = catalogue.yearRange();

        expect(range).toEqual({ from: -27, to: 1507 });
    });
});
