import { useMemo, useReducer, type ReactNode } from 'react';
import { useAddressService } from '@/react/hooks/services/use-address-service.ts';
import { atlasReducer, AtlasStoreContext, INITIAL_ATLAS_STATE } from './atlas-context.ts';

export interface AtlasProviderProps {
    children: ReactNode;
}

/**
 * Holds what the reader is looking at, opening wherever the address asked for.
 *
 * The address is read once, as the store is built, rather than handed in from above: an atlas
 * opened at a link and an atlas opened at its bare address differ only in where they start, and
 * that is a fact about the state and not about the tree around it.
 */
export function AtlasProvider({ children }: AtlasProviderProps) {
    const address = useAddressService();
    const [state, dispatch] = useReducer(atlasReducer, undefined, () => ({
        ...INITIAL_ATLAS_STATE,
        ...address.read(window.location.search),
    }));
    const store = useMemo(() => ({ state, dispatch }), [state]);

    return <AtlasStoreContext value={store}>{children}</AtlasStoreContext>;
}
