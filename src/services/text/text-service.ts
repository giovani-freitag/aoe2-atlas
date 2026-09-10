import type { CivilizationText } from '@/domain/values/civilization-text.ts';
import type { RegionKey } from '@/domain/enums/region.ts';

export interface TextServiceConfig {
    /** Resolves a key in the atlas bundle to a string in the current language. */
    translate: (key: string) => string;
    /** The language currently in force, as a BCP 47 tag. */
    language: () => string;
}

/**
 * The words of the atlas — names, monuments, places, regions — in whatever language is on.
 *
 * The records that describe a civilization carry no text at all, so anything the interface or
 * the catalogue needs to say about one comes through here. It is a thin skin over the translator
 * and exists so the rest of the code never learns which library does the translating.
 */
export class TextService {
    private readonly translate: (key: string) => string;
    private readonly language: () => string;

    constructor(config: TextServiceConfig) {
        this.translate = config.translate;
        this.language = config.language;
    }

    /** The language in force, for collation and number formatting. */
    public locale(): string {
        return this.language();
    }

    /**
     * Everything said about one civilization.
     *
     * @param key - The civilization key.
     * @param anachronistic - Whether the records flag its Wonder as out of time or place.
     */
    public civilization(key: string, anachronistic: boolean): CivilizationText {
        return {
            name: this.translate(`atlas:civs.${key}.name`),
            monument: this.translate(`atlas:civs.${key}.monument`),
            place: this.translate(`atlas:civs.${key}.place`),
            country: this.translate(`atlas:civs.${key}.country`),
            realm: this.translate(`atlas:civs.${key}.realm`),
            anachronism: anachronistic ? this.translate(`atlas:civs.${key}.anachronism`) : null,
        };
    }

    /**
     * The text a search for a civilization is matched against.
     *
     * @param key - The civilization key.
     */
    public searchable(key: string): string {
        const text = this.civilization(key, false);

        return `${text.name} ${text.monument} ${text.place} ${text.country} ${text.realm}`;
    }

    /**
     * The name of one of the eight regions the atlas colours by.
     *
     * @param region - The region key.
     */
    public region(region: RegionKey): string {
        return this.translate(`atlas:regions.${region}`);
    }
}
