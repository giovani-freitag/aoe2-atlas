import { useEffect, useState } from 'react';
import type { WikiSummary } from '@/services/wiki/wiki-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

/**
 * One article's summary, fetched the first time something asks to show it.
 *
 * Nothing is requested until the card is actually opening, so sweeping a pointer across a panel
 * full of links costs no requests. What has arrived is kept, because a reader who comes back to
 * the same link should not wait twice.
 *
 * @param language - Which Wikipedia the article is on, as a language code.
 * @param title - The article title.
 * @param wanted - Whether the card showing it is open.
 * @returns The summary once it has arrived, or null while it has not or cannot.
 */
export function useWikiSummary(language: string, title: string, wanted: boolean): WikiSummary | null {
    const { wiki } = useServices();
    const [summary, setSummary] = useState<WikiSummary | null>(null);

    useEffect(() => {
        if (!wanted) return;

        let current = true;

        void wiki.summary(language, title).then((arrived) => {
            // The pointer may have moved on while the article was in flight.
            if (current && arrived) setSummary(arrived);
        });

        return () => {
            current = false;
        };
    }, [wiki, language, title, wanted]);

    return summary;
}
