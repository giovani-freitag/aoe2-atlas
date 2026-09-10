import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { RegionKey } from '@/domain/enums/region.ts';
import type { GeoPoint } from '@/domain/values/geo-point.ts';
import type { Territory } from '@/domain/values/territory.ts';
import type { YearSpan } from '@/domain/values/year-span.ts';

/** The monument a civilization's Wonder is a copy of. */
export interface Wonder {
    monument: string;
    place: string;
    country: string;
    at: GeoPoint;
    wikipedia: string;
    /** Set when the model is centuries younger than the people it stands for. */
    anachronism?: string;
}

export interface CivilizationConfig {
    key: string;
    name: string;
    icon: string;
    expansion: ExpansionKey;
    region: RegionKey;
    wonder: Wonder;
    /** What the drawn border actually is, named so a reader can check it. */
    realmLabel: string;
    /** The years the atlas counts the civilization as standing. */
    span: YearSpan;
    territory: Territory;
}

/** One playable civilization, its Wonder and the ground behind it. */
export class Civilization {
    public readonly key: string;
    public readonly name: string;
    public readonly icon: string;
    public readonly expansion: ExpansionKey;
    public readonly region: RegionKey;
    public readonly wonder: Wonder;
    public readonly realmLabel: string;
    public readonly span: YearSpan;
    public readonly territory: Territory;

    constructor(config: CivilizationConfig) {
        this.key = config.key;
        this.name = config.name;
        this.icon = config.icon;
        this.expansion = config.expansion;
        this.region = config.region;
        this.wonder = config.wonder;
        this.realmLabel = config.realmLabel;
        this.span = config.span;
        this.territory = config.territory;
    }

    /**
     * Whether the civilization was on the map in a given year.
     *
     * @param year - The year to test, negative before the common era.
     */
    public standingIn(year: number): boolean {
        return this.span.contains(year);
    }

    /** Where the atlas puts the civilization's mark: on its Wonder, not on its centre of mass. */
    public get markerAt(): GeoPoint {
        return this.wonder.at;
    }

    /** The text a search matches against. */
    public get searchable(): string {
        return `${this.name} ${this.wonder.monument} ${this.wonder.place} ${this.wonder.country} ${this.realmLabel}`;
    }
}
