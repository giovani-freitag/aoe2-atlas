import { describe, expect, it } from 'vitest';
import { drawnRealms, type RealmChoice } from '@/domain/rules/drawn-realms.ts';
import { civilizationStub } from '../../../fixtures/civilizations.ts';

const MONGOLS = civilizationStub({ key: 'mongols', from: 1206, to: 1368 });
const ROMANS = civilizationStub({ key: 'romans', from: -27, to: 476 });
const BRITONS = civilizationStub({ key: 'britons', from: 800, to: 1500 });

/** What the shell hands in: only the civilizations that had a border in the century on screen. */
const STANDING = [MONGOLS, ROMANS, BRITONS];

const NOTHING_CHOSEN: RealmChoice = { showAll: false, pinned: [], focused: null };

const choiceWith = (overrides: Partial<RealmChoice>): RealmChoice => ({ ...NOTHING_CHOSEN, ...overrides });

describe('drawnRealms', () => {
    it('draws nothing until something is chosen', () => {
        const drawn = drawnRealms(NOTHING_CHOSEN, STANDING);

        expect(drawn).toEqual([]);
    });

    it('draws the pinned realms in the order they were pinned', () => {
        const choice = choiceWith({ pinned: ['britons', 'romans'] });

        const drawn = drawnRealms(choice, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['britons', 'romans']);
    });

    it('draws the open realm last so it lies on top', () => {
        const choice = choiceWith({ pinned: ['britons', 'romans'], focused: 'mongols' });

        const drawn = drawnRealms(choice, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['britons', 'romans', 'mongols']);
    });

    it('does not draw the open realm twice when it is also pinned', () => {
        const choice = choiceWith({ pinned: ['mongols'], focused: 'mongols' });

        const drawn = drawnRealms(choice, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['mongols']);
    });

    /*
     * A realm pinned in one century and still pinned in another the source does not map for it
     * must not be drawn there. This is the whole reason the shell hands in only what stood.
     */
    it('drops a pinned realm that held no ground this century', () => {
        const choice = choiceWith({ pinned: ['mongols', 'aztecs'] });

        const drawn = drawnRealms(choice, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['mongols']);
    });

    it('does not draw an open realm that held no ground this century', () => {
        const choice = choiceWith({ focused: 'aztecs' });

        const drawn = drawnRealms(choice, STANDING);

        expect(drawn).toEqual([]);
    });

    it('draws everything standing once the switch is on', () => {
        const choice = choiceWith({ showAll: true });

        const drawn = drawnRealms(choice, STANDING);

        expect(drawn).toEqual(STANDING);
    });

    it('ignores the pins entirely while the switch is on', () => {
        const choice = choiceWith({ showAll: true, pinned: ['romans'] });

        const drawn = drawnRealms(choice, STANDING);

        expect(drawn).toHaveLength(STANDING.length);
    });
});
