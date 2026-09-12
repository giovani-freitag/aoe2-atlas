import type { MultiPolygonRings } from '@/domain/values/geo-shape.ts';

export interface CoastlineServiceConfig {
    /** Where the coastline file is served from. */
    url: string;
}

interface LandJson {
    type: 'MultiPolygon';
    coordinates: number[][][][];
}

/**
 * Fetches the coastline the realms are drawn over, once.
 *
 * It used to be bundled: two hundred and seventy kilobytes of Natural Earth inside the
 * JavaScript, which was forty per cent of the main chunk and every byte of it parsed as code
 * before the map could start. It is data, and it travels as data now — asked for alongside the
 * bundle rather than after it, and kept for the life of the page.
 */
export class CoastlineService {
    private readonly url: string;
    private held: MultiPolygonRings | null = null;
    private loading: Promise<MultiPolygonRings> | null = null;

    constructor(config: CoastlineServiceConfig) {
        this.url = config.url;
    }

    /** The coastline already in hand, or null while it is still on the way. */
    public peek(): MultiPolygonRings | null {
        return this.held;
    }

    /**
     * Loads the coastline, reusing a request already in flight.
     *
     * @returns The rings of every landmass.
     * @throws When the file cannot be fetched or does not parse.
     */
    public async load(): Promise<MultiPolygonRings> {
        if (this.held) return this.held;
        if (this.loading) return this.loading;

        this.loading = this.fetch()
            .then((rings) => {
                this.held = rings;

                return rings;
            })
            .finally(() => {
                this.loading = null;
            });

        return this.loading;
    }

    private async fetch(): Promise<MultiPolygonRings> {
        const response = await fetch(this.url);
        if (!response.ok) throw new Error(`Não consegui carregar o litoral: HTTP ${response.status}.`);

        return ((await response.json()) as LandJson).coordinates;
    }
}
