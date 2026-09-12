import { useMemo, useReducer, type ReactNode } from 'react';
import { atlasReducer, AtlasStoreContext, INITIAL_ATLAS_STATE, type AtlasState } from './atlas-context.ts';

export interface AtlasProviderProps {
    /** Where the atlas opens; the address it was opened at may have asked for somewhere. */
    initial?: AtlasState;
    children: ReactNode;
}

/** Holds what the reader is looking at. */
export function AtlasProvider({ initial = INITIAL_ATLAS_STATE, children }: AtlasProviderProps) {
    const [state, dispatch] = useReducer(atlasReducer, initial);
    const store = useMemo(() => ({ state, dispatch }), [state]);

    return <AtlasStoreContext value={store}>{children}</AtlasStoreContext>;
}
