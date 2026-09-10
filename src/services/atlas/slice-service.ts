import { Frontier } from '@/domain/values/frontier.ts';
import { RealmBorder, type BorderPrecision } from '@/domain/values/realm-border.ts';

/** Everything the atlas draws for one century. */
export interface TimeSlice {
    year: number;
    borders: readonly RealmBorder[];
    frontiers: readonly Frontier[];
}

interface SliceJson {
    year: number;
    realms: {
        civ: string;
        from: number;
        exact: boolean;
        origin: string;
        sourceNames: string[];
        precision: number;
        areaKm2: number;
        bbox: [number, number, number, number];
        centroid: [number, number];
        rings: number[][][][];
    }[];
    frontiers: { a: string; b: string; areaKm2: number; shareOfA: number; shareOfB: number }[];
}

export interface SliceServiceConfig {
    /** Where the century files live, with a trailing slash. */
    baseUrl: string;
    /** The centuries the atlas has maps for, oldest first. */
    years: readonly number[];
}

/**
 * Fetches a century of borders and keeps it.
 *
 * Half a megabyte of geometry across nineteen centuries is not something a phone should have to
 * swallow to look at one of them, so each century is its own file and arrives when it is asked
 * for. A century already fetched is never fetched twice, and two callers asking at once share
 * the one request.
 */
export class SliceService {
    private readonly baseUrl: string;
    private readonly years: readonly number[];
    private readonly loaded = new Map<number, TimeSlice>();
    private readonly loading = new Map<number, Promise<TimeSlice>>();

    constructor(config: SliceServiceConfig) {
        this.baseUrl = config.baseUrl;
        this.years = config.years;
    }

    /**
     * The century the atlas has a map for, nearest to the year asked about.
     *
     * @param year - Any year, whether or not the source publishes a map for it.
     * @throws When the atlas has no centuries at all, which means the build did not run.
     */
    public sliceYearFor(year: number): number {
        if (this.years.length === 0) throw new Error('O atlas não tem nenhuma fatia. Rode "npm run data:build".');

        return this.years.reduce((best, candidate) =>
            Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best,
        );
    }

    /** A century already in hand, or null while it is still on the way. */
    public peek(sliceYear: number): TimeSlice | null {
        return this.loaded.get(sliceYear) ?? null;
    }

    /**
     * Loads a century, reusing a request already in flight.
     *
     * @param sliceYear - One of the years the atlas publishes; use `sliceYearFor` to get one.
     * @returns The borders and frontiers of that century.
     * @throws When the file cannot be fetched or does not parse.
     */
    public async load(sliceYear: number): Promise<TimeSlice> {
        const held = this.loaded.get(sliceYear);
        if (held) return held;

        const inFlight = this.loading.get(sliceYear);
        if (inFlight) return inFlight;

        const request = this.fetch(sliceYear)
            .then((slice) => {
                this.loaded.set(sliceYear, slice);

                return slice;
            })
            .finally(() => {
                this.loading.delete(sliceYear);
            });

        this.loading.set(sliceYear, request);

        return request;
    }

    /**
     * Starts loading the centuries on either side, so scrubbing the timeline does not stutter.
     *
     * @param sliceYear - The century currently on screen.
     */
    public warmNeighbours(sliceYear: number): void {
        const at = this.years.indexOf(sliceYear);
        if (at === -1) return;

        for (const neighbour of [this.years[at - 1], this.years[at + 1]]) {
            if (neighbour === undefined) continue;
            void this.load(neighbour).catch(() => undefined);
        }
    }

    private async fetch(sliceYear: number): Promise<TimeSlice> {
        const url = `${this.baseUrl}slice-${sliceYear}.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Não consegui carregar o século ${sliceYear}: HTTP ${response.status}.`);

        return toSlice((await response.json()) as SliceJson);
    }
}

const PRECISIONS: Readonly<Record<number, BorderPrecision>> = {
    1: 'approximate',
    2: 'moderate',
    3: 'surveyed',
};

function toSlice(json: SliceJson): TimeSlice {
    return {
        year: json.year,
        borders: json.realms.map((realm) => {
            const [west, south, east, north] = realm.bbox;

            return new RealmBorder({
                civ: realm.civ,
                from: realm.from,
                shownAt: json.year,
                origin: realm.origin === 'drawn' ? 'drawn' : 'dataset',
                sourceNames: realm.sourceNames,
                precision: PRECISIONS[realm.precision] ?? 'approximate',
                areaKm2: realm.areaKm2,
                bbox: { west, south, east, north },
                centroid: { lon: realm.centroid[0], lat: realm.centroid[1] },
                rings: realm.rings,
            });
        }),
        frontiers: json.frontiers.map((frontier) => new Frontier(frontier)),
    };
}
