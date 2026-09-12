import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';

/** How many neighbours a panel shows before the list stops being a list. */
const MOST = 6;

/**
 * The civilizations that shared ground with this one, widest share first.
 *
 * Both panels asked the same question of the same data and each wrote its own answer, down to
 * its own idea of how many is too many. One of them would eventually have been changed alone.
 *
 * @param civilization - The civilization the panel is about.
 * @param frontiers - Every shared border of the century, in no particular order.
 */
export function contemporaries(civilization: Civilization, frontiers: readonly Frontier[]): readonly Frontier[] {
    return frontiers
        .filter((frontier) => frontier.otherThan(civilization.key) !== null)
        .sort((left, right) => right.shareOf(civilization.key) - left.shareOf(civilization.key))
        .slice(0, MOST);
}
