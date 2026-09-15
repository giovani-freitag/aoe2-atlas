import { useEffect } from 'react';

/**
 * Runs a handler when the reader presses Escape.
 *
 * The atlas leans on this to close the detail panel, because the reader's hand is on the map
 * and reaching back for the little X is a detour.
 *
 * @param onEscape - What to do; re-registered whenever it changes.
 */
export function useEscape(onEscape: () => void): void {
    useEffect(() => {
        const listen = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') return;
            onEscape();
        };

        window.addEventListener('keydown', listen);

        return () => {
            window.removeEventListener('keydown', listen);
        };
    }, [onEscape]);
}
