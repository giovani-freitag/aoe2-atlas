import { createContext, useContext } from 'react';

import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { ProjectionKey } from '@/domain/enums/projection.ts';
import type { CatalogueOrder } from '@/services/atlas/catalogue-service.ts';
import { OPENING_YEAR } from '@/data/dataset.ts';

/** Past this many realms the legend names regions instead of civilizations. */
export const LEGEND_DETAIL_LIMIT = 10;

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
    /** Which projection the world is drawn in; the measured areas never depend on it. */
    projection: ProjectionKey;
    /** Whether the chart's ruled lines — grid, equator, tropics — are drawn. */
    ruled: boolean;
}

export type AtlasAction =
    | { type: 'year'; value: number }
    | { type: 'query'; value: string }
    | { type: 'expansions'; value: readonly ExpansionKey[] }
    | { type: 'order'; value: CatalogueOrder }
    | { type: 'focus'; value: string | null }
    | { type: 'toggle-pin'; value: string }
    | { type: 'toggle-show-all' }
    | { type: 'clear-map' }
    | { type: 'hover'; value: string | null }
    | { type: 'projection'; value: ProjectionKey }
    | { type: 'toggle-ruled' };

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
    projection: 'equal-earth',
    ruled: true,
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

        case 'expansions':
            return { ...state, expansions: action.value };

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

        case 'projection':
            return { ...state, projection: action.value };

        case 'toggle-ruled':
            return { ...state, ruled: !state.ruled };
    }
}
