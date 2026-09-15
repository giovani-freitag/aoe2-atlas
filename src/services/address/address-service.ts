export interface SharedState {
    /** The year on the rail. */
    year: number;
    /** The civilization whose panel is open. */
    focused: string | null;
    /** Realms held on the map for comparison, oldest first. */
    pinned: readonly string[];
}

export interface AddressServiceConfig {
    /** The years the atlas has maps for, oldest first; a year in an address snaps to the nearest. */
    years: readonly number[];
    /** Every civilization the atlas knows by key; anything else in an address is dropped. */
    keys: ReadonlySet<string>;
    /** The year the atlas opens on when the address says nothing. */
    openingYear: number;
}

/** The combining marks a comma is escaped to, which the address reads better without. */
const ESCAPED_COMMA = /%2C/g;

/**
 * What the address bar says about the map, in both directions.
 *
 * The address is always a link to what is on screen: without this there was nothing to send
 * anyone, and "look at the Byzantines in 1200" opened the world in 1200 and stopped.
 */
export class AddressService {
    private readonly years: readonly number[];
    private readonly keys: ReadonlySet<string>;
    private readonly openingYear: number;

    constructor(config: AddressServiceConfig) {
        this.years = config.years;
        this.keys = config.keys;
        this.openingYear = config.openingYear;
    }

    /**
     * Reads what an address asks for.
     *
     * Nothing here is trusted. A year the atlas has no map for snaps to the nearest one it has, a
     * civilization it has never heard of is dropped, and the same pin twice is one pin — so a
     * hand-edited or half-pasted link opens something sensible rather than nothing.
     *
     * @param search - The query string, with or without its leading `?`.
     * @returns Only the fields the address actually set; the rest keep their defaults.
     */
    public read(search: string): Partial<SharedState> {
        const params = new URLSearchParams(search);
        const shared: Partial<SharedState> = {};

        const year = Number(params.get('year'));
        if (params.has('year') && Number.isFinite(year) && this.years.length > 0) {
            shared.year = this.years.reduce((best, candidate) =>
                Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best,
            );
        }

        const civ = params.get('civ');
        if (civ && this.keys.has(civ)) shared.focused = civ;

        const pins = (params.get('pin') ?? '')
            .split(',')
            .map((key) => key.trim())
            .filter((key) => this.keys.has(key));
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
     * @returns The query string with its leading `?`, or an empty string when nothing is set.
     */
    public write(state: SharedState): string {
        const params = new URLSearchParams();

        if (state.year !== this.openingYear) params.set('year', String(state.year));
        if (state.focused) params.set('civ', state.focused);
        if (state.pinned.length > 0) params.set('pin', state.pinned.join(','));

        const query = params.toString();

        // URLSearchParams escapes the comma between pins; the address reads better with it bare.
        return query ? `?${query.replace(ESCAPED_COMMA, ',')}` : '';
    }
}
