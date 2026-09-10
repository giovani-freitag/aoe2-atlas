export interface Formatters {
    /** An area in square kilometres, grouped the way the language writes numbers. */
    area(km2: number): string;
    /** A fraction as a percentage. */
    share(fraction: number): string;
    /** A year, with the era spelled out when it is before the common one. */
    year(year: number): string;
    /** A stretch of years. */
    span(from: number, to: number): string;
    /** A calendar date given in ISO 8601, written as the language writes dates. */
    date(iso: string): string;
}

export interface FormattersConfig {
    /** The language in force, as a BCP 47 tag. */
    locale: string;
    /** Writes a year before the common era, in the language in force. */
    beforeCommonEra: (year: number) => string;
}

/**
 * Number and date formatting bound to one language.
 *
 * Everything the interface says in digits goes through here, so a reader in Delhi sees
 * 12,34,567 km² and one in Berlin sees 1.234.567 km² of the very same realm.
 *
 * @param config - The language and how it writes a year before Christ.
 */
export function createFormatters(config: FormattersConfig): Formatters {
    const area = new Intl.NumberFormat(config.locale, { maximumFractionDigits: 0 });
    const percent = new Intl.NumberFormat(config.locale, { style: 'percent', maximumFractionDigits: 0 });
    const date = new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium', timeZone: 'UTC' });

    const year = (value: number): string => (value < 0 ? config.beforeCommonEra(Math.abs(value)) : `${value}`);

    return {
        area: (km2) => `${area.format(Math.round(km2))} km²`,
        share: (fraction) => percent.format(fraction),
        year,
        span: (from, to) => `${year(from)} – ${year(to)}`,
        date: (iso) => date.format(new Date(`${iso}T00:00:00Z`)),
    };
}
