import { createContext, useContext } from 'react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { AtlasOrder } from '@/services/atlas/atlas-service.ts';

/** Past this many realms the legend names regions instead of civilizations. */
export const LEGEND_DETAIL_LIMIT = 12;

export interface AtlasState {
    /** Free text typed into the search field. */
    query: string;
    /** Expansions kept; empty means every one of them. */
    expansions: readonly ExpansionKey[];
    order: AtlasOrder;
    /** The year the timeline is parked on, or null while the timeline is off. */
    year: number | null;
    /** The civilization whose detail panel is open. */
    selected: string | null;
    /** Realms held on the map for comparison, oldest first. */
    pinned: readonly string[];
    /** Draws every realm the filters leave, instead of only the chosen ones. */
    showAll: boolean;
    /** The civilization under the pointer, highlighted but not committed to. */
    hovered: string | null;
}

export type AtlasAction =
    | { type: 'query'; value: string }
    | { type: 'toggle-expansion'; value: ExpansionKey }
    | { type: 'clear-expansions' }
    | { type: 'order'; value: AtlasOrder }
    | { type: 'year'; value: number | null }
    | { type: 'select'; value: string | null }
    | { type: 'toggle-pin'; value: string }
    | { type: 'toggle-show-all' }
    | { type: 'clear-map' }
    | { type: 'hover'; value: string | null };

export interface AtlasStore {
    state: AtlasState;
    dispatch: (action: AtlasAction) => void;
}

export const INITIAL_ATLAS_STATE: AtlasState = {
    query: '',
    expansions: [],
    order: 'name',
    year: null,
    selected: null,
    pinned: [],
    showAll: false,
    hovered: null,
};

const AtlasContext = createContext<AtlasStore | null>(null);

export const AtlasStoreContext = AtlasContext;

/**
 * Everything the interface knows about what the reader is currently looking at.
 *
 * @throws When called outside the provider, which means the tree was assembled wrong.
 */
export function useAtlas(): AtlasStore {
    const store = useContext(AtlasContext);
    if (!store) throw new Error('useAtlas precisa estar dentro de <AtlasProvider>.');

    return store;
}

/**
 * Works out which realms belong on the map.
 *
 * With "draw everything" off it is the pinned realms plus whichever one is open, in that order,
 * so the chosen one lies on top. With it on it is every realm the filters left — and, when the
 * timeline is parked on a year, only the ones actually standing then, which is the whole point
 * of asking to see them all at once.
 *
 * @param state - What the reader has chosen.
 * @param visible - The civilizations the filters leave, already ordered.
 * @returns The realms to draw, in draw order.
 */
export function drawnRealms(state: AtlasState, visible: readonly Civilization[]): Civilization[] {
    if (state.showAll) {
        return visible.filter((civ) => state.year === null || civ.standingIn(state.year));
    }

    const byKey = new Map(visible.map((civ) => [civ.key, civ]));
    const chosen = state.pinned.filter((key) => byKey.has(key));
    if (state.selected && !chosen.includes(state.selected)) chosen.push(state.selected);

    return chosen.flatMap((key) => byKey.get(key) ?? []);
}

/**
 * Folds an action into the state.
 *
 * Exported so it can be tested without a React tree.
 *
 * @param state - The state before the action.
 * @param action - What the reader did.
 * @returns The state after it.
 */
export function atlasReducer(state: AtlasState, action: AtlasAction): AtlasState {
    switch (action.type) {
        case 'query':
            return { ...state, query: action.value };

        case 'toggle-expansion': {
            const held = state.expansions.includes(action.value);

            return {
                ...state,
                expansions: held
                    ? state.expansions.filter((key) => key !== action.value)
                    : [...state.expansions, action.value],
            };
        }

        case 'clear-expansions':
            return { ...state, expansions: [] };

        case 'order':
            return { ...state, order: action.value };

        case 'year':
            return { ...state, year: action.value };

        case 'select':
            return { ...state, selected: action.value };

        case 'toggle-pin': {
            if (state.pinned.includes(action.value)) {
                return { ...state, pinned: state.pinned.filter((key) => key !== action.value) };
            }

            // There is no cap: colour follows the region, so a new pin never repaints an old one.
            return { ...state, pinned: [...state.pinned, action.value] };
        }

        case 'toggle-show-all':
            return { ...state, showAll: !state.showAll };

        case 'clear-map':
            return { ...state, pinned: [], selected: null, showAll: false };

        case 'hover':
            return { ...state, hovered: action.value };
    }
}
