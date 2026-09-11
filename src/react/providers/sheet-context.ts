import { createContext, useContext } from 'react';

export interface Sheet {
    /** Drops the sheet back to the height it opens at, uncovering the map behind it. */
    collapse: () => void;
}

const SheetContext = createContext<Sheet>({ collapse: () => undefined });

export const SheetProviderContext = SheetContext;

/**
 * The sheet a component finds itself inside, for the things in it that act on the map.
 *
 * Tapping a neighbour traces that realm, and a reader who cannot see the map has no way of
 * knowing it happened — so whatever does that has to be able to get the sheet out of the way.
 * Outside a sheet this does nothing, which is the right answer for a panel that never covers
 * anything.
 */
export function useSheet(): Sheet {
    return useContext(SheetContext);
}
