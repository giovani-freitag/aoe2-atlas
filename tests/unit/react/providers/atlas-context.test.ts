import { describe, expect, it } from 'vitest';
import { atlasReducer, drawnRealms, INITIAL_ATLAS_STATE, type AtlasState } from '@/react/providers/atlas-context.ts';
import { civilizationStub } from '../../../fixtures/civilizations.ts';

const MONGOLS = civilizationStub({ key: 'mongols', from: 1206, to: 1368 });
const ROMANS = civilizationStub({ key: 'romans', from: -27, to: 476 });
const BRITONS = civilizationStub({ key: 'britons', from: 800, to: 1500 });

/** What the shell hands in: only the civilizations that had a border in the century on screen. */
const STANDING = [MONGOLS, ROMANS, BRITONS];

const stateWith = (overrides: Partial<AtlasState>): AtlasState => ({ ...INITIAL_ATLAS_STATE, ...overrides });

describe('atlasReducer', () => {
    it('moves the year on the rail', () => {
        const state = atlasReducer(INITIAL_ATLAS_STATE, { type: 'year', value: 800 });

        expect(state.year).toBe(800);
    });

    it('adds an expansion to the filter', () => {
        const state = atlasReducer(INITIAL_ATLAS_STATE, { type: 'toggle-expansion', value: 'tak' });

        expect(state.expansions).toEqual(['tak']);
    });

    it('takes an expansion back out when it is toggled again', () => {
        const held = atlasReducer(INITIAL_ATLAS_STATE, { type: 'toggle-expansion', value: 'tak' });

        const state = atlasReducer(held, { type: 'toggle-expansion', value: 'tak' });

        expect(state.expansions).toEqual([]);
    });

    it('pins a civilization for comparison', () => {
        const state = atlasReducer(INITIAL_ATLAS_STATE, { type: 'toggle-pin', value: 'mongols' });

        expect(state.pinned).toEqual(['mongols']);
    });

    it('puts no ceiling on how many realms may be pinned', () => {
        const many = stateWith({ pinned: Array.from({ length: 40 }, (_unused, index) => `civ-${index}`) });

        const state = atlasReducer(many, { type: 'toggle-pin', value: 'mongols' });

        expect(state.pinned).toHaveLength(41);
    });

    it('keeps every earlier pin in place when a new one arrives', () => {
        const many = stateWith({ pinned: ['romans', 'britons'] });

        const state = atlasReducer(many, { type: 'toggle-pin', value: 'mongols' });

        expect(state.pinned.slice(0, 2)).toEqual(['romans', 'britons']);
    });

    it('clears the pins, the open sheet and the draw-everything switch together', () => {
        const busy = stateWith({ pinned: ['romans'], focused: 'mongols', showAll: true });

        const state = atlasReducer(busy, { type: 'clear-map' });

        expect(state).toMatchObject({ pinned: [], focused: null, showAll: false });
    });

    it('leaves the pins alone when the open sheet changes', () => {
        const pinned = stateWith({ pinned: ['romans', 'britons'] });

        const state = atlasReducer(pinned, { type: 'focus', value: 'mongols' });

        expect(state.pinned).toEqual(['romans', 'britons']);
    });
});

describe('drawnRealms', () => {
    it('draws nothing until something is chosen', () => {
        const drawn = drawnRealms(INITIAL_ATLAS_STATE, STANDING);

        expect(drawn).toEqual([]);
    });

    it('draws the pinned realms in the order they were pinned', () => {
        const state = stateWith({ pinned: ['britons', 'romans'] });

        const drawn = drawnRealms(state, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['britons', 'romans']);
    });

    it('draws the open realm last so it lies on top', () => {
        const state = stateWith({ pinned: ['britons', 'romans'], focused: 'mongols' });

        const drawn = drawnRealms(state, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['britons', 'romans', 'mongols']);
    });

    it('does not draw the open realm twice when it is also pinned', () => {
        const state = stateWith({ pinned: ['mongols'], focused: 'mongols' });

        const drawn = drawnRealms(state, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['mongols']);
    });

    /*
     * A realm pinned in one century and still pinned in another the source does not map for it
     * must not be drawn there. This is the whole reason the shell hands in only what stood.
     */
    it('drops a pinned realm that held no ground this century', () => {
        const state = stateWith({ pinned: ['mongols', 'aztecs'] });

        const drawn = drawnRealms(state, STANDING);

        expect(drawn.map((civ) => civ.key)).toEqual(['mongols']);
    });

    it('does not draw an open realm that held no ground this century', () => {
        const state = stateWith({ focused: 'aztecs' });

        const drawn = drawnRealms(state, STANDING);

        expect(drawn).toEqual([]);
    });

    it('draws everything standing once the switch is on', () => {
        const state = stateWith({ showAll: true });

        const drawn = drawnRealms(state, STANDING);

        expect(drawn).toEqual(STANDING);
    });

    it('ignores the pins entirely while the switch is on', () => {
        const state = stateWith({ showAll: true, pinned: ['romans'] });

        const drawn = drawnRealms(state, STANDING);

        expect(drawn).toHaveLength(STANDING.length);
    });
});
