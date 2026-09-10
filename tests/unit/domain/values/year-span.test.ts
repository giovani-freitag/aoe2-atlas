import { describe, expect, it } from 'vitest';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { YearSpan } from '@/domain/values/year-span.ts';

describe('YearSpan', () => {
    it('refuses a span that ends before it starts', () => {
        const build = (): YearSpan => new YearSpan(1200, 800);

        expect(build).toThrow(DomainError);
    });

    it('counts both ends in its length', () => {
        const span = new YearSpan(1206, 1368);

        const length = span.length;

        expect(length).toBe(163);
    });

    it('holds a year on its first day', () => {
        const span = new YearSpan(1206, 1368);

        const holds = span.contains(1206);

        expect(holds).toBe(true);
    });

    it('holds a year on its last day', () => {
        const span = new YearSpan(1206, 1368);

        const holds = span.contains(1368);

        expect(holds).toBe(true);
    });

    it('lets go of a year past its end', () => {
        const span = new YearSpan(1206, 1368);

        const holds = span.contains(1369);

        expect(holds).toBe(false);
    });

    it('spans the change of era without a gap at year zero', () => {
        const span = new YearSpan(-27, 476);

        const holds = span.contains(0);

        expect(holds).toBe(true);
    });

    it('sees an overlap when two spans share a single year', () => {
        const roman = new YearSpan(-27, 476);
        const gothic = new YearSpan(376, 711);

        const shared = roman.overlaps(gothic);

        expect(shared).toBe(true);
    });

    it('sees no overlap between spans that only follow one another', () => {
        const hunnic = new YearSpan(370, 469);
        const mongol = new YearSpan(1206, 1368);

        const shared = hunnic.overlaps(mongol);

        expect(shared).toBe(false);
    });
});
