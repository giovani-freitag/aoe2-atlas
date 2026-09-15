import { describe, expect, it } from 'vitest';
import { atlasReducer, INITIAL_ATLAS_STATE, type AtlasState } from '@/react/providers/atlas-context.ts';

const stateWith = (overrides: Partial<AtlasState>): AtlasState => ({ ...INITIAL_ATLAS_STATE, ...overrides });

describe('atlasReducer', () => {
    it('moves the year on the rail', () => {
        const state = atlasReducer(INITIAL_ATLAS_STATE, { type: 'year', value: 800 });

        expect(state.year).toBe(800);
    });

    it('sets the expansions the filter keeps', () => {
        const state = atlasReducer(INITIAL_ATLAS_STATE, { type: 'expansions', value: ['tak'] });

        expect(state.expansions).toEqual(['tak']);
    });

    it('empties the filter when no expansion is left on', () => {
        const held = atlasReducer(INITIAL_ATLAS_STATE, { type: 'expansions', value: ['tak'] });

        const state = atlasReducer(held, { type: 'expansions', value: [] });

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
