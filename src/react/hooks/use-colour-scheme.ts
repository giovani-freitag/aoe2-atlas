import { useEffect, useState } from 'react';

export type ColourScheme = 'light' | 'dark';

/** Where the reader's choice is kept between visits. */
const STORAGE_KEY = 'aoe2-atlas:scheme';

/**
 * The scheme the atlas is currently painted in, and a way to change it.
 *
 * The map needs this as a value rather than as a CSS variable: the realm colours are chosen in
 * JavaScript, from a palette whose light and dark steps were validated separately against their
 * own surface, so the component has to know which set it is drawing with.
 *
 * @returns The resolved scheme, whether it was chosen or inherited, and a setter.
 */
export function useColourScheme(): {
    scheme: ColourScheme;
    chosen: ColourScheme | null;
    choose: (scheme: ColourScheme | null) => void;
} {
    const [chosen, setChosen] = useState<ColourScheme | null>(readStored);
    const [systemDark, setSystemDark] = useState(prefersDark);

    useEffect(() => {
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const listen = (event: MediaQueryListEvent): void => {
            setSystemDark(event.matches);
        };

        query.addEventListener('change', listen);

        return () => {
            query.removeEventListener('change', listen);
        };
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        if (chosen) {
            root.dataset.theme = chosen;
        } else {
            delete root.dataset.theme;
        }

        try {
            if (chosen) localStorage.setItem(STORAGE_KEY, chosen);
            else localStorage.removeItem(STORAGE_KEY);
        } catch {
            // A browser with site data blocked still gets the theme; it just forgets it on reload.
        }
    }, [chosen]);

    return { scheme: chosen ?? (systemDark ? 'dark' : 'light'), chosen, choose: setChosen };
}

function readStored(): ColourScheme | null {
    try {
        const value = localStorage.getItem(STORAGE_KEY);

        return value === 'light' || value === 'dark' ? value : null;
    } catch {
        return null;
    }
}

function prefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
