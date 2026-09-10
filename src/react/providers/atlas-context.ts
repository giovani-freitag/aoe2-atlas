import { createContext, useContext } from 'react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { CatalogueOrder } from '@/services/atlas/catalogue-service.ts';

/** Past this many realms the legend names regions instead of civilizations. */
export const LEGEND_DETAIL_LIMIT = 10;

/** Where the atlas opens: the busiest century the game covers. */
export const OPENING_YEAR = 1200;

export interface AtlasState {
    /** The year on the rail. Everything on the map is drawn as it stood then. */
    year: number;
    query: string;
    /** Expansions kept; empty means every one of them. */
    expansions: readonly ExpansionKey[];
    order: CatalogueOrder;
    /** The civilization whose sheet is open. */
    focused: string | null;
    /** Realms held on the map for comparison, oldest first. */
    pinned: readonly string[];
    /** Draws every realm standing in the year, instead of only the chosen ones. */
    showAll: boolean;
    /** The civilization under the pointer, highlighted but not committed to. */
    hovered: string | null;
}

export type AtlasAction =
    | { type: 'year'; value: number }
    | { type: 'query'; value: string }
    | { type: 'toggle-expansion'; value: ExpansionKey }
    | { type: 'clear-expansions' }
    | { type: 'order'; value: CatalogueOrder }
    | { type: 'focus'; value: string | null }
    | { type: 'toggle-pin'; value: string }
    | { type: 'toggle-show-all' }
    | { type: 'clear-map' }
    | { type: 'hover'; value: string | null };

export interface AtlasStore {
    state: AtlasState;
    dispatch: (action: AtlasAction) => void;
}

export const INITIAL_ATLAS_STATE: AtlasState = {
    year: OPENING_YEAR,
    query: '',
    expansions: [],
    order: 'name',
    focused: null,
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
 * Everything here is already filtered to the year on the rail, so "draw everything" means
 * everything that actually stood in that century — not every civilization the game ships.
 *
 * @param state - What the reader has chosen.
 * @param standing - The civilizations left by the filters, standing in the year on the rail.
 * @returns The realms to draw, in draw order, the focused one last so it lies on top.
 */
export function drawnRealms(state: AtlasState, standing: readonly Civilization[]): Civilization[] {
    if (state.showAll) return [...standing];

    const byKey = new Map(standing.map((civ) => [civ.key, civ]));
    const chosen = state.pinned.filter((key) => byKey.has(key));
    if (state.focused && byKey.has(state.focused) && !chosen.includes(state.focused)) chosen.push(state.focused);

    return chosen.flatMap((key) => byKey.get(key) ?? []);
}

/**
 * Folds an action into the state.
 *
 * Exported so it can be tested without a React tree.
 *
 * @param state - The state before the action.
 * @param action - What the reader did.
 */
export function atlasReducer(state: AtlasState, action: AtlasAction): AtlasState {
    switch (action.type) {
        case 'year':
            return { ...state, year: action.value };

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

        case 'focus':
            return { ...state, focused: action.value };

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
            return { ...state, pinned: [], focused: null, showAll: false };

        case 'hover':
            return { ...state, hovered: action.value };
    }
}
