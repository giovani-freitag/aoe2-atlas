import { useEffect, useState } from 'react';

/** The width at which the offcanvas panels stop sliding and dock into columns. */
const WIDE = '(min-width: 60rem)';

/**
 * Whether there is room for the panels to dock instead of slide.
 *
 * The layout itself is CSS, but the offcanvas panels are real `dialog` elements, and a dialog
 * has to be told whether to open modally. On a phone it should trap the focus; docked in a
 * column it must not.
 */
export function useWideScreen(): boolean {
    const [wide, setWide] = useState(() => matchMedia(WIDE).matches);

    useEffect(() => {
        const query = matchMedia(WIDE);
        const listen = (event: MediaQueryListEvent): void => {
            setWide(event.matches);
        };

        query.addEventListener('change', listen);

        return () => {
            query.removeEventListener('change', listen);
        };
    }, []);

    return wide;
}
