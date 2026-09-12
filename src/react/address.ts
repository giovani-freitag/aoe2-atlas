import type { AtlasState } from './providers/atlas-context.ts';

/** The part of what the reader is looking at that an address can carry. */
export type SharedState = Pick<AtlasState, 'year' | 'focused' | 'pinned'>;

export interface AddressOptions {
    /** The years the atlas has maps for, oldest first; a year in an address snaps to the nearest. */
    years: readonly number[];
    /** Every civilization the atlas knows by key; anything else in an address is dropped. */
    keys: ReadonlySet<string>;
    /** The year the atlas opens on when the address says nothing. */
    openingYear: number;
}

/**
 * Reads what an address asks for.
 *
 * Nothing here is trusted. A year the atlas has no map for snaps to the nearest one it has, a
 * civilization it has never heard of is dropped, and the same pin twice is one pin — so a
 * hand-edited or half-pasted link opens something sensible rather than nothing.
 *
 * @param search - The query string, with or without its leading `?`.
 * @param options - What counts as a valid year and a known civilization.
 * @returns Only the fields the address actually set; the rest keep their defaults.
 */
export function readAddress(search: string, options: AddressOptions): Partial<SharedState> {
    const params = new URLSearchParams(search);
    const shared: Partial<SharedState> = {};

    const year = Number(params.get('year'));
    if (params.has('year') && Number.isFinite(year) && options.years.length > 0) {
        shared.year = options.years.reduce((best, candidate) =>
            Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best,
        );
    }

    const civ = params.get('civ');
    if (civ && options.keys.has(civ)) shared.focused = civ;

    const pins = (params.get('pin') ?? '')
        .split(',')
        .map((key) => key.trim())
        .filter((key) => options.keys.has(key));
    if (pins.length > 0) shared.pinned = [...new Set(pins)];

    return shared;
}

/**
 * Writes what the reader is looking at as a query string.
 *
 * Defaults are left out, so the atlas at rest has a clean address and a link only says what
 * the reader changed: `?year=800`, `?civ=byzantines`, `?year=1200&civ=byzantines&pin=bulgarians`.
 *
 * @param state - The year on the rail, the open civilization and the pinned ones.
 * @param options - Which year counts as the default.
 * @returns The query string with its leading `?`, or an empty string when nothing is set.
 */
export function writeAddress(state: SharedState, options: Pick<AddressOptions, 'openingYear'>): string {
    const params = new URLSearchParams();

    if (state.year !== options.openingYear) params.set('year', String(state.year));
    if (state.focused) params.set('civ', state.focused);
    if (state.pinned.length > 0) params.set('pin', state.pinned.join(','));

    const query = params.toString();

    // URLSearchParams escapes the comma between pins; the address reads better with it bare.
    return query ? `?${query.replace(/%2C/g, ',')}` : '';
}
