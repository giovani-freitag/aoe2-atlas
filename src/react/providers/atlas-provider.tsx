import { useMemo, useReducer, type ReactNode } from 'react';
import { atlasReducer, AtlasStoreContext, INITIAL_ATLAS_STATE } from './atlas-context.ts';

export interface AtlasProviderProps {
    children: ReactNode;
}

/** Holds what the reader is looking at. */
export function AtlasProvider({ children }: AtlasProviderProps) {
    const [state, dispatch] = useReducer(atlasReducer, INITIAL_ATLAS_STATE);
    const store = useMemo(() => ({ state, dispatch }), [state]);

    return <AtlasStoreContext value={store}>{children}</AtlasStoreContext>;
}
