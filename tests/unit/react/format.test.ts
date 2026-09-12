import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/react/format.ts';

const format = createFormatters({ locale: 'en', beforeCommonEra: (year) => `${year} BC` });

describe('createFormatters', () => {
    describe('share', () => {
        it('writes a fraction as a percentage', () => {
            const written = format.share(0.42);

            expect(written).toBe('42%');
        });

        it('rounds to the nearest whole percent', () => {
            const written = format.share(0.4249);

            expect(written).toBe('42%');
        });

        /*
         * A neighbour is on the list because the two realms overlapped. Printing "0%" says the
         * one thing that cannot be true of anything on that list.
         */
        it('never writes an overlap as nothing at all', () => {
            const written = format.share(0.002);

            expect(written).toBe('<1%');
        });

        it('writes no overlap as nothing, because that is what it is', () => {
            const written = format.share(0);

            expect(written).toBe('0%');
        });
    });

    describe('year', () => {
        it('writes a year of the common era plainly', () => {
            const written = format.year(1279);

            expect(written).toBe('1279');
        });

        it('spells out the era for a year before it', () => {
            const written = format.year(-27);

            expect(written).toBe('27 BC');
        });
    });

    describe('span', () => {
        it('joins two years with a dash', () => {
            const written = format.span(885, 1375);

            expect(written).toBe('885 – 1375');
        });

        it('carries the era into the earlier end', () => {
            const written = format.span(-27, 476);

            expect(written).toBe('27 BC – 476');
        });
    });

    describe('area', () => {
        it('groups the digits and names the unit', () => {
            const written = format.area(155_037.4);

            expect(written).toBe('155,037 km²');
        });
    });

    describe('date', () => {
        it('reads an ISO date as the language writes dates', () => {
            const written = format.date('2021-01-26');

            expect(written).toBe('Jan 26, 2021');
        });
    });
});
