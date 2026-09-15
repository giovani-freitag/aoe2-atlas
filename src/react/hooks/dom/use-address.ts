import { useEffect } from 'react';
import type { SharedState } from '@/services/address/address-service.ts';
import { useAddressService } from '@/react/hooks/services/use-address-service.ts';

/**
 * Keeps the address saying what the map shows, so the address bar is always a link to it.
 *
 * The address follows the state and never leads it — it is rewritten in place rather than
 * pushed, because the rail changes the year dozens of times in a minute and each one is not a
 * page the reader wants to press Back through. The one entry that *is* pushed, for the open
 * panel, lives in `useSheetHistory`; rewriting keeps its state object intact.
 *
 * @param state - What the reader is looking at.
 */
export function useAddress(state: SharedState): void {
    const address = useAddressService();
    const query = address.write(state);

    useEffect(() => {
        const next = `${window.location.pathname}${query}${window.location.hash}`;
        if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;

        window.history.replaceState(window.history.state, '', next);
    }, [query]);
}
