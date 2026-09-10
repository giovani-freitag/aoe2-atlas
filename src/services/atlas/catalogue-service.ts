import type { Civilization } from '@/domain/entities/civilization.ts';
import type { ExpansionKey } from '@/domain/enums/expansion.ts';

/** How the civilization list can be ordered. */
export type CatalogueOrder = 'name' | 'area' | 'year' | 'expansion';

export interface CatalogueQuery {
    /** Free text matched against name, monument, place and realm. */
    text?: string;
    /** Keep only civilizations standing in this year. */
    year?: number;
    /** Keep only civilizations from these expansions; empty or absent means all of them. */
    expansions?: readonly ExpansionKey[];
    order?: CatalogueOrder;
}

export interface CatalogueServiceConfig {
    civilizations: readonly Civilization[];
    /** Order the expansions are listed in, so sorting by expansion follows release order. */
    expansionOrder: readonly ExpansionKey[];
}

/**
 * The one place the interface asks questions of the roster.
 *
 * It knows nothing about geometry: borders live a century at a time behind the slice service.
 * What it answers is "which civilizations are we talking about", which is a question the list,
 * the map and the detail panel must never disagree on.
 */
export class CatalogueService {
    private readonly civilizations: readonly Civilization[];
    private readonly expansionRank: ReadonlyMap<ExpansionKey, number>;
    private readonly byKey: ReadonlyMap<string, Civilization>;

    constructor(config: CatalogueServiceConfig) {
        this.civilizations = config.civilizations;
        this.expansionRank = new Map(config.expansionOrder.map((key, index) => [key, index]));
        this.byKey = new Map(config.civilizations.map((civ) => [civ.key, civ]));
    }

    /** Every civilization, in catalogue order. */
    public all(): readonly Civilization[] {
        return this.civilizations;
    }

    /**
     * One civilization by key.
     *
     * @param key - The civilization key.
     * @returns The civilization, or null when nothing carries that key.
     */
    public find(key: string): Civilization | null {
        return this.byKey.get(key) ?? null;
    }

    /**
     * The civilizations a query leaves standing, in the order it asks for.
     *
     * @param query - Text, year, expansion and ordering; every part is optional.
     */
    public search(query: CatalogueQuery): Civilization[] {
        const needle = normalize(query.text ?? '');
        const expansions = query.expansions && query.expansions.length > 0 ? new Set(query.expansions) : null;

        const matches = this.civilizations.filter((civ) => {
            if (query.year !== undefined && !civ.standingIn(query.year)) return false;
            if (expansions && !expansions.has(civ.expansion)) return false;
            if (needle && !normalize(civ.searchable).includes(needle)) return false;

            return true;
        });

        return this.sort(matches, query.order ?? 'name');
    }

    /** The first and last year any civilization in the roster stands, for the timeline ends. */
    public yearRange(): { from: number; to: number } {
        const from = Math.min(...this.civilizations.map((civ) => civ.span.from));
        const to = Math.max(...this.civilizations.map((civ) => civ.span.to));

        return { from, to };
    }

    private sort(civilizations: Civilization[], order: CatalogueOrder): Civilization[] {
        const byName = (left: Civilization, right: Civilization): number => left.name.localeCompare(right.name, 'pt-BR');

        if (order === 'area') {
            return civilizations.sort(
                (left, right) => right.reach.peakAreaKm2 - left.reach.peakAreaKm2 || byName(left, right),
            );
        }

        if (order === 'year') {
            return civilizations.sort((left, right) => left.span.from - right.span.from || byName(left, right));
        }

        if (order === 'expansion') {
            return civilizations.sort(
                (left, right) =>
                    (this.expansionRank.get(left.expansion) ?? 0) - (this.expansionRank.get(right.expansion) ?? 0) ||
                    byName(left, right),
            );
        }

        return civilizations.sort(byName);
    }
}

/** The combining marks that splitting an accented letter in NFD leaves behind. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Folds text down to what a reader typing without accents or capitals would produce. */
function normalize(value: string): string {
    return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}
