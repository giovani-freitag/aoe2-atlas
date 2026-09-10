import { DomainError } from '@/domain/errors/domain-error.ts';

/**
 * A stretch of years a realm was on the map for.
 *
 * Years are stored as plain integers, negative before the common era, because the atlas never
 * needs a finer grain than a year and calendar objects would only invite time zones into a
 * question that has none.
 */
export class YearSpan {
    public readonly from: number;
    public readonly to: number;

    constructor(from: number, to: number) {
        if (from > to) throw new DomainError(`A span cannot end (${to}) before it starts (${from}).`);

        this.from = from;
        this.to = to;
    }

    /**
     * Tells whether a year falls inside the span, both ends included.
     *
     * @param year - The year to test.
     */
    public contains(year: number): boolean {
        return year >= this.from && year <= this.to;
    }

    /** How many years the span covers, counting both ends. */
    public get length(): number {
        return this.to - this.from + 1;
    }

    /**
     * Tells whether two spans share at least one year.
     *
     * @param other - The span to compare against.
     */
    public overlaps(other: YearSpan): boolean {
        return this.from <= other.to && other.from <= this.to;
    }
}
