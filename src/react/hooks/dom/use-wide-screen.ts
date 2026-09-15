import { useEffect, useState } from 'react';

/** The width at which the offcanvas panels stop sliding and dock into columns. */
const WIDE = '(min-width: 60rem)';

/**
 * Whether there is room for the panels to dock instead of slide.
 *
 * The layout itself is CSS; what this answers is the part CSS cannot. A panel laid over the map
 * has to trap the focus, make the rest of the page inert and be painted over the furniture,
 * while the same panel docked into a column must do none of those things — and none of them is
 * a matter of width alone. The width it turns on is the one the stylesheet turns on.
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
