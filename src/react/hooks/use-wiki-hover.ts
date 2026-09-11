import { useCallback, useEffect, useRef, useState } from 'react';
import type { WikiSummary } from '@/services/wiki/wiki-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

/**
 * How long a pointer must rest before the article is fetched.
 *
 * Wikipedia's own previews wait about this long. Without it, crossing a link on the way to
 * something else — or sweeping the pointer over a map full of pins — fires requests nobody
 * wanted and flashes cards nobody was reading.
 */
const DWELL_MS = 320;

export interface WikiHover {
    /** The article on screen, or null while nothing is being previewed. */
    shown: { key: string; summary: WikiSummary } | null;
    /** Begin the wait for one article; a second call replaces the first. */
    enter: (key: string, language: string, title: string) => void;
    /** Abandon the wait, and take down whatever is showing. */
    leave: () => void;
}

/**
 * The waiting and fetching behind a hover preview, without any opinion about where it appears.
 *
 * Shared so the link in the panel and the pin on the map behave identically: the same pause
 * before anything happens, the same cache underneath, and the same silence when an article
 * cannot be had.
 *
 * @returns What is on screen, and the two calls that put it there and take it away.
 */
export function useWikiHover(): WikiHover {
    const { wiki } = useServices();
    const [shown, setShown] = useState<{ key: string; summary: WikiSummary } | null>(null);
    const dwell = useRef<number | undefined>(undefined);
    const wanted = useRef<string | null>(null);

    useEffect(
        () => () => {
            window.clearTimeout(dwell.current);
        },
        [],
    );

    const enter = useCallback(
        (key: string, language: string, title: string): void => {
            window.clearTimeout(dwell.current);
            wanted.current = key;

            dwell.current = window.setTimeout(() => {
                void wiki.summary(language, title).then((summary) => {
                    // The pointer may have moved on while the article was in flight.
                    if (!summary || wanted.current !== key) return;

                    setShown({ key, summary });
                });
            }, DWELL_MS);
        },
        [wiki],
    );

    const leave = useCallback((): void => {
        window.clearTimeout(dwell.current);
        wanted.current = null;
        setShown(null);
    }, []);

    return { shown, enter, leave };
}
