import { describe, expect, it } from 'vitest';
import { REGION_KEYS } from '@/domain/enums/region.ts';
import { AGE_COLUMN, AGE_REGION_SLOT } from '@/skins/age/palette.ts';

/** The parchment the Age map is drawn on, which every step was darkened to clear. */
const PARCHMENT = '#efe6d0';

/** The contrast a mark must reach against its surface to read as a mark at all. */
const MIN_CONTRAST = 3;

function relativeLuminance(hex: string): number {
    const channels = [0, 2, 4]
        .map((offset) => parseInt(hex.slice(1 + offset, 3 + offset), 16) / 255)
        .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
    const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((left, right) => right - left);

    return (high + 0.05) / (low + 0.05);
}

describe('the Age palette', () => {
    it('carries one step per region', () => {
        expect(AGE_COLUMN).toHaveLength(REGION_KEYS.length);
    });

    it('gives every region a step of its own', () => {
        const slots = REGION_KEYS.map((region) => AGE_REGION_SLOT[region]);

        expect(new Set(slots).size).toBe(REGION_KEYS.length);
    });

    it('never points a region at a step that is not there', () => {
        const outOfRange = REGION_KEYS.filter((region) => AGE_REGION_SLOT[region] >= AGE_COLUMN.length);

        expect(outOfRange).toEqual([]);
    });

    /*
     * The steps were darkened from the reference palette precisely so they would clear this on
     * aged paper; four of the originals washed out against it. A future skin that changes the
     * map surface has to redo the measurement, and this is what refuses to let it forget.
     */
    it('keeps every step readable against the parchment it is drawn on', () => {
        const washedOut = AGE_COLUMN.filter((step) => contrast(step, PARCHMENT) < MIN_CONTRAST);

        expect(washedOut).toEqual([]);
    });
});
