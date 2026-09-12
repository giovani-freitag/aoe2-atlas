import { useEffect } from 'react';
import { CIVILIZATIONS, SLICE_YEARS } from '@/data/dataset.ts';
import { readAddress, writeAddress, type AddressOptions } from '@/react/address.ts';
import { INITIAL_ATLAS_STATE, OPENING_YEAR, type AtlasState } from '@/react/providers/atlas-context.ts';

const OPTIONS: AddressOptions = {
    years: SLICE_YEARS,
    keys: new Set(CIVILIZATIONS.map((civilization) => civilization.key)),
    openingYear: OPENING_YEAR,
};

/**
 * The state the atlas opens in, given the address it was opened at.
 *
 * @param search - `location.search` as the page loaded.
 */
export function openingState(search: string): AtlasState {
    return { ...INITIAL_ATLAS_STATE, ...readAddress(search, OPTIONS) };
}

/**
 * Keeps the address saying what the map shows, so the address bar is always a link to it.
 *
 * Without this there was nothing to send anyone: "look at the Byzantines in 1200" opened the
 * world in 1200 and stopped. The address follows the state and never leads it — it is rewritten
 * in place rather than pushed, because the rail changes the year dozens of times in a minute and
 * each one is not a page the reader wants to press Back through. The one entry that *is* pushed,
 * for the open panel, lives in `useSheetHistory`; rewriting keeps its state object intact.
 *
 * @param state - What the reader is looking at.
 */
export function useAddress(state: AtlasState): void {
    const query = writeAddress(state, OPTIONS);

    useEffect(() => {
        const next = `${window.location.pathname}${query}${window.location.hash}`;
        if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;

        window.history.replaceState(window.history.state, '', next);
    }, [query]);
}
