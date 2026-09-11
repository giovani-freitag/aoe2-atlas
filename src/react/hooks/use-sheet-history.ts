import { useEffect, useRef } from 'react';

/**
 * Gives the open panel a history entry, so Back closes it instead of leaving the atlas.
 *
 * On a phone the system Back gesture is how people close things, and without this it walks out
 * of the page while a sheet is still up. The entry is pushed when the panel opens and taken
 * back when it closes by any other route — Escape, the grip, a tap on the map — so the stack
 * never grows an entry the reader has to press through twice.
 *
 * @param open - Whether the panel is on screen.
 * @param onClose - Closes the panel; called when the reader presses Back.
 */
export function useSheetHistory(open: boolean, onClose: () => void): void {
    // The effect reads a ref to know whether this hook owns the top of the stack, which is
    // exactly the kind of live, outside-React state the compiler must not memoize around.
    'use no memo';

    const owned = useRef(false);

    useEffect(() => {
        const onPop = (): void => {
            if (!owned.current) return;

            owned.current = false;
            onClose();
        };

        window.addEventListener('popstate', onPop);

        return () => {
            window.removeEventListener('popstate', onPop);
        };
    }, [onClose]);

    useEffect(() => {
        if (open && !owned.current) {
            owned.current = true;
            window.history.pushState({ sheet: true }, '');

            return;
        }

        // Closed by something other than Back: drop the entry we added rather than leave it.
        if (!open && owned.current) {
            owned.current = false;
            window.history.back();
        }
    }, [open]);
}
