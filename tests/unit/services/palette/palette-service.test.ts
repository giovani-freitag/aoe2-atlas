import { describe, expect, it } from 'vitest';
import { REGION_KEYS, type RegionKey } from '@/domain/enums/region.ts';
import { PaletteService } from '@/services/palette/palette-service.ts';

const MEMBERSHIP: Record<RegionKey, readonly string[]> = {
    weur: ['britons', 'franks', 'celts', 'goths', 'vikings', 'spanish', 'italians'],
    ceur: ['teutons', 'poles'],
    med: ['byzantines', 'romans'],
    step: ['mongols', 'tatars'],
    sasia: ['khmer'],
    easia: ['chinese'],
    afr: ['malians'],
    amer: ['aztecs'],
};

describe('PaletteService', () => {
    const palette = new PaletteService({ membership: MEMBERSHIP });

    it('gives every civilization in a region the same hue', () => {
        const mongols = palette.styleOf('mongols');
        const tatars = palette.styleOf('tatars');

        expect([mongols.light, mongols.dark]).toEqual([tatars.light, tatars.dark]);
    });

    it('gives two civilizations of one region different hatching', () => {
        const mongols = palette.styleOf('mongols');
        const tatars = palette.styleOf('tatars');

        expect(mongols.angle).not.toBe(tatars.angle);
    });

    it('gives two regions different hues', () => {
        const mongols = palette.styleOf('mongols');
        const chinese = palette.styleOf('chinese');

        expect(mongols.dark).not.toBe(chinese.dark);
    });

    it('reaches a second stroke weight once the angles run out', () => {
        const first = palette.styleOf('britons');
        const seventh = palette.styleOf('italians');

        expect(seventh.weight).toBeGreaterThan(first.weight);
    });

    it('names a pattern after the civilization it paints', () => {
        const style = palette.styleOf('byzantines');

        expect(style.patternId).toBe('hatch-byzantines');
    });

    it('refuses a civilization that belongs to no region', () => {
        const look = (): unknown => palette.styleOf('atlanteans');

        expect(look).toThrow(/atlanteans/);
    });

    it('hands the legend a colour for every region', () => {
        const colours = REGION_KEYS.map((region) => palette.regionColour(region, 'dark'));

        expect(new Set(colours).size).toBe(REGION_KEYS.length);
    });

    it('lists one style per civilization it was given', () => {
        const all = palette.all();

        expect(all).toHaveLength(Object.values(MEMBERSHIP).flat().length);
    });
});
