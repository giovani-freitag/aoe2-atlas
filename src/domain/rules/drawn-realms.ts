import type { Civilization } from '@/domain/entities/civilization.ts';

export interface RealmChoice {
    /** Draws every realm standing in the year, instead of only the chosen ones. */
    showAll: boolean;
    /** Realms held on the map for comparison, oldest first. */
    pinned: readonly string[];
    /** The civilization whose panel is open. */
    focused: string | null;
}

/**
 * Works out which realms belong on the map.
 *
 * Everything passed in is already filtered to the year on the rail, so "draw everything" means
 * everything that actually stood in that century — not every civilization the game ships.
 *
 * @param choice - What the reader has put on the map.
 * @param standing - The civilizations left by the filters, standing in the year on the rail.
 * @returns The realms to draw, in draw order, the focused one last so it lies on top.
 */
export function drawnRealms(choice: RealmChoice, standing: readonly Civilization[]): Civilization[] {
    if (choice.showAll) return [...standing];

    const byKey = new Map(standing.map((civ) => [civ.key, civ]));
    const chosen = choice.pinned.filter((key) => byKey.has(key));
    if (choice.focused && byKey.has(choice.focused) && !chosen.includes(choice.focused)) chosen.push(choice.focused);

    return chosen.flatMap((key) => byKey.get(key) ?? []);
}
