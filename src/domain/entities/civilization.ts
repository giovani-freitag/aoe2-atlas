import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { RegionKey } from '@/domain/enums/region.ts';
import type { GeoPoint } from '@/domain/values/geo-point.ts';
import type { YearSpan } from '@/domain/values/year-span.ts';

/** Where a civilization's Wonder stands, and what is known about it in every language alike. */
export interface Wonder {
    at: GeoPoint;
    wikipedia: string;
    /** True when the model, or the site, does not sit where or when the civilization does. */
    anachronistic: boolean;
}

/** What the atlas measured about a civilization's borders once every century was cut. */
export interface RealmReach {
    /** Years this civilization has a border cut for, oldest first. */
    slices: readonly number[];
    /** The century it held the most ground in. */
    peakYear: number;
    peakAreaKm2: number;
}

export interface CivilizationConfig {
    key: string;
    icon: string;
    expansion: ExpansionKey;
    region: RegionKey;
    wonder: Wonder;
    span: YearSpan;
    reach: RealmReach;
}

/**
 * One playable civilization, its Wonder and the reach of the realm behind it.
 *
 * Nothing here is in a language: the name, the monument and what the realm was called come from
 * the text service, so one entity serves every reader.
 */
export class Civilization {
    public readonly key: string;
    public readonly icon: string;
    public readonly expansion: ExpansionKey;
    public readonly region: RegionKey;
    public readonly wonder: Wonder;
    public readonly span: YearSpan;
    public readonly reach: RealmReach;

    constructor(config: CivilizationConfig) {
        this.key = config.key;
        this.icon = config.icon;
        this.expansion = config.expansion;
        this.region = config.region;
        this.wonder = config.wonder;
        this.span = config.span;
        this.reach = config.reach;
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
}
