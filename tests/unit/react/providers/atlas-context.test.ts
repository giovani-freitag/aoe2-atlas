import { describe, expect, it } from 'vitest';
import {
    atlasReducer,
    drawnRealms,
    INITIAL_ATLAS_STATE,
    type AtlasState,
} from '@/react/providers/atlas-context.ts';
import { civilizationStub } from '../../../fixtures/civilizations.ts';

const MONGOLS = civilizationStub({ key: 'mongols', name: 'Mongóis', from: 1206, to: 1368 });
const ROMANS = civilizationStub({ key: 'romans', name: 'Romanos', from: -27, to: 476 });
const BRITONS = civilizationStub({ key: 'britons', name: 'Bretões', from: 800, to: 1500 });
const VISIBLE = [MONGOLS, ROMANS, BRITONS];

const stateWith = (overrides: Partial<AtlasState>): AtlasState => ({ ...INITIAL_ATLAS_STATE, ...overrides });

describe('atlasReducer', () => {
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

    it('unpins a civilization that was already pinned', () => {
        const held = atlasReducer(INITIAL_ATLAS_STATE, { type: 'toggle-pin', value: 'mongols' });

        const state = atlasReducer(held, { type: 'toggle-pin', value: 'mongols' });

        expect(state.pinned).toEqual([]);
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

    it('clears the pins, the selection and the draw-everything switch together', () => {
        const busy = stateWith({ pinned: ['romans'], selected: 'mongols', showAll: true });

        const state = atlasReducer(busy, { type: 'clear-map' });

        expect(state).toMatchObject({ pinned: [], selected: null, showAll: false });
    });

    it('leaves the pins alone when the selection changes', () => {
        const pinned = stateWith({ pinned: ['romans', 'britons'] });

        const state = atlasReducer(pinned, { type: 'select', value: 'mongols' });

        expect(state.pinned).toEqual(['romans', 'britons']);
    });

    it('turns the year filter off again', () => {
        const parked = atlasReducer(INITIAL_ATLAS_STATE, { type: 'year', value: 1200 });

        const state = atlasReducer(parked, { type: 'year', value: null });

        expect(state.year).toBeNull();
    });
});

describe('drawnRealms', () => {
    it('draws nothing until something is chosen', () => {
        const drawn = drawnRealms(INITIAL_ATLAS_STATE, VISIBLE);

        expect(drawn).toEqual([]);
    });

    it('draws the pinned realms in the order they were pinned', () => {
        const state = stateWith({ pinned: ['britons', 'romans'] });

        const drawn = drawnRealms(state, VISIBLE);

        expect(drawn.map((civ) => civ.key)).toEqual(['britons', 'romans']);
    });

    it('draws the open realm last so it lies on top', () => {
        const state = stateWith({ pinned: ['britons', 'romans'], selected: 'mongols' });

        const drawn = drawnRealms(state, VISIBLE);

        expect(drawn.map((civ) => civ.key)).toEqual(['britons', 'romans', 'mongols']);
    });

    it('does not draw the open realm twice when it is also pinned', () => {
        const state = stateWith({ pinned: ['mongols'], selected: 'mongols' });

        const drawn = drawnRealms(state, VISIBLE);

        expect(drawn.map((civ) => civ.key)).toEqual(['mongols']);
    });

    it('drops a pinned realm the filters have taken off the list', () => {
        const state = stateWith({ pinned: ['mongols', 'aztecs'] });

        const drawn = drawnRealms(state, VISIBLE);

        expect(drawn.map((civ) => civ.key)).toEqual(['mongols']);
    });

    it('draws everything the filters left once the switch is on', () => {
        const state = stateWith({ showAll: true });

        const drawn = drawnRealms(state, VISIBLE);

        expect(drawn).toEqual(VISIBLE);
    });

    it('draws only the realms standing in the year the timeline is parked on', () => {
        const state = stateWith({ showAll: true, year: 1300 });

        const drawn = drawnRealms(state, VISIBLE);

        expect(drawn.map((civ) => civ.key)).toEqual(['mongols', 'britons']);
    });

    it('ignores the pins entirely while the switch is on', () => {
        const state = stateWith({ showAll: true, pinned: ['romans'] });

        const drawn = drawnRealms(state, VISIBLE);

        expect(drawn).toHaveLength(VISIBLE.length);
    });
});
