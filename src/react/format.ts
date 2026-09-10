const AREA = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

/**
 * An area in square kilometres, grouped the way Portuguese writes numbers.
 *
 * @param km2 - The area.
 */
export function formatArea(km2: number): string {
    return `${AREA.format(Math.round(km2))} km²`;
}

/**
 * A year, with the era spelled out when it is before the common one.
 *
 * @param year - The year, negative before the common era.
 */
export function formatYear(year: number): string {
    return year < 0 ? `${Math.abs(year)} a.C.` : `${year}`;
}

/**
 * A stretch of years.
 *
 * @param from - First year.
 * @param to - Last year.
 */
export function formatSpan(from: number, to: number): string {
    return `${formatYear(from)} – ${formatYear(to)}`;
}

/**
 * A fraction as a percentage.
 *
 * @param fraction - A value between zero and one.
 */
export function formatShare(fraction: number): string {
    return PERCENT.format(fraction);
}

/**
 * A release date, as a Brazilian reader writes it.
 *
 * @param iso - The date in ISO 8601.
 */
export function formatDate(iso: string): string {
    const [year, month, day] = iso.split('-');

    return `${day}/${month}/${year}`;
}
