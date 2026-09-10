/** Countries a Brazilian reader has a feel for, largest first. */
const YARDSTICKS: readonly { name: string; km2: number }[] = [
    { name: 'o Brasil', km2: 8_510_346 },
    { name: 'a Índia', km2: 3_287_263 },
    { name: 'o México', km2: 1_964_375 },
    { name: 'o estado de Minas Gerais', km2: 586_522 },
    { name: 'a França', km2: 551_695 },
    { name: 'Portugal', km2: 92_212 },
];

const AREA = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const RATIO = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
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
 * The same area said in countries, because nobody pictures four million square kilometres.
 *
 * @param km2 - The area.
 * @returns A phrase like "≈ 2,7× a França", or null when nothing on the list fits.
 */
export function formatYardstick(km2: number): string | null {
    for (const yardstick of YARDSTICKS) {
        const ratio = km2 / yardstick.km2;
        if (ratio < 0.9) continue;

        return `≈ ${RATIO.format(ratio)}× ${yardstick.name}`;
    }

    const smallest = YARDSTICKS[YARDSTICKS.length - 1];

    return `≈ ${PERCENT.format(km2 / smallest.km2)} de ${smallest.name}`;
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
