import type { Civilization } from '@/domain/entities/civilization.ts';
import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { Conflict } from '@/data/dataset.ts';

/** How the civilization list can be ordered. */
export type AtlasOrder = 'name' | 'area' | 'year' | 'expansion';

export interface AtlasQuery {
    /** Free text matched against name, monument, place and realm. */
    text?: string;
    /** Keep only civilizations standing in this year. */
    year?: number;
    /** Keep only civilizations from these expansions; empty or absent means all of them. */
    expansions?: readonly ExpansionKey[];
    order?: AtlasOrder;
}

export interface AtlasServiceConfig {
    civilizations: readonly Civilization[];
    conflicts: readonly Conflict[];
    /** Order the expansions are listed in, so sorting by expansion follows release order. */
    expansionOrder: readonly ExpansionKey[];
}

/**
 * The one place the interface asks questions of the catalogue.
 *
 * Keeping filtering, ordering and the conflict lookup together means the sidebar list, the map
 * and the detail panel can never disagree about which civilizations are on screen.
 */
export class AtlasService {
    private readonly civilizations: readonly Civilization[];
    private readonly conflicts: readonly Conflict[];
    private readonly expansionRank: ReadonlyMap<ExpansionKey, number>;
    private readonly byKey: ReadonlyMap<string, Civilization>;

    constructor(config: AtlasServiceConfig) {
        this.civilizations = config.civilizations;
        this.conflicts = config.conflicts;
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
    public search(query: AtlasQuery): Civilization[] {
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

    /**
     * The civilizations that share ground with one of them, largest overlap first.
     *
     * @param key - The civilization to look up.
     * @returns Each neighbour with the shared area and how much of each realm it is.
     */
    public conflictsOf(key: string): { other: Civilization; areaKm2: number; shareOfThis: number; shareOfOther: number }[] {
        const found: { other: Civilization; areaKm2: number; shareOfThis: number; shareOfOther: number }[] = [];

        for (const conflict of this.conflicts) {
            if (conflict.a !== key && conflict.b !== key) continue;

            const isFirst = conflict.a === key;
            const other = this.byKey.get(isFirst ? conflict.b : conflict.a);
            if (!other) continue;

            found.push({
                other,
                areaKm2: conflict.areaKm2,
                shareOfThis: isFirst ? conflict.shareOfA : conflict.shareOfB,
                shareOfOther: isFirst ? conflict.shareOfB : conflict.shareOfA,
            });
        }

        return found.sort((left, right) => right.shareOfThis - left.shareOfThis);
    }

    /** The first and last year any civilization in the catalogue stands, for the timeline ends. */
    public yearRange(): { from: number; to: number } {
        const from = Math.min(...this.civilizations.map((civ) => civ.span.from));
        const to = Math.max(...this.civilizations.map((civ) => civ.span.to));

        return { from, to };
    }

    private sort(civilizations: Civilization[], order: AtlasOrder): Civilization[] {
        const byName = (left: Civilization, right: Civilization): number => left.name.localeCompare(right.name, 'pt-BR');

        if (order === 'area') {
            return civilizations.sort((left, right) => right.territory.areaKm2 - left.territory.areaKm2 || byName(left, right));
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
