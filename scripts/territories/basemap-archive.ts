import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

export interface BasemapArchiveConfig {
    /** Folder the downloaded year files are kept in between runs. */
    cacheDir: string;
    /** Prefix a `world_<year>.geojson` name is appended to. */
    baseUrl: string;
}

/** The properties aourednik/historical-basemaps puts on every polygon. */
export interface BasemapProperties {
    NAME: string | null;
    SUBJECTO: string | null;
    PARTOF: string | null;
    BORDERPRECISION: number | null;
}

export type BasemapFeature = Feature<Geometry, BasemapProperties>;

/**
 * The century-by-century world borders the atlas draws its realms from.
 *
 * Files are fetched once and kept on disk, so a rebuild costs nothing and works offline. The
 * cache is deliberately outside the repository: the shipped artefact is the derived territory
 * file, not the forty megabytes it was cut from.
 */
export class BasemapArchive {
    private readonly cacheDir: string;
    private readonly baseUrl: string;
    private readonly loaded = new Map<number, BasemapFeature[]>();

    constructor(config: BasemapArchiveConfig) {
        this.cacheDir = config.cacheDir;
        this.baseUrl = config.baseUrl;
    }

    /**
     * Reads one year of world borders, downloading it the first time it is asked for.
     *
     * @param year - The year file to read, as named in the source repository.
     * @returns Every polygon that year holds.
     */
    public async year(year: number): Promise<BasemapFeature[]> {
        const cached = this.loaded.get(year);
        if (cached) return cached;

        const raw = await this.read(year);
        const parsed = JSON.parse(raw) as FeatureCollection<Geometry, BasemapProperties>;
        const features = parsed.features.filter((feature) => feature.geometry !== null);

        this.loaded.set(year, features);

        return features;
    }

    /**
     * Every distinct polity name a year file carries, sorted, for reporting a failed lookup.
     *
     * @param year - The year file to list.
     */
    public async names(year: number): Promise<string[]> {
        const features = await this.year(year);
        const names = new Set<string>();

        for (const feature of features) {
            const name = feature.properties.NAME;
            if (name) names.add(name);
        }

        return [...names].sort((left, right) => left.localeCompare(right));
    }

    private async read(year: number): Promise<string> {
        const file = `world_${year}.geojson`;
        const path = join(this.cacheDir, file);

        if (existsSync(path)) return readFileSync(path, 'utf8');

        const url = `${this.baseUrl}/${file}`;
        console.log(`  baixando ${file}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Não consegui baixar ${url}: HTTP ${response.status}.`);

        const body = await response.text();
        mkdirSync(this.cacheDir, { recursive: true });
        writeFileSync(path, body, 'utf8');

        return body;
    }
}
