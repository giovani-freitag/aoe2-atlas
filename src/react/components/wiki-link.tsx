import { useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { articleUrl } from '@/data/wikipedia.ts';
import { useWikiSummary } from '@/react/hooks/services/use-wiki-summary.ts';
import { HoverCard, HoverCardPanel, HoverCardTrigger } from '@/react/ui/hover-card.tsx';
import { WikiCard } from './wiki-card.tsx';

/**
 * How long a pointer must rest before the article is fetched.
 *
 * Wikipedia's own previews wait about this long. Without it, crossing a link on the way to
 * something else fires requests nobody wanted and flashes cards nobody was reading.
 */
const DWELL_MS = 320;

export interface WikiLinkProps {
    /** Which Wikipedia the article is on, as a language code. */
    language: string;
    /** The article title. */
    title: string;
    children: ReactNode;
}

/**
 * A link to Wikipedia that shows the article before the reader commits to leaving.
 *
 * The atlas says where a Wonder stands and how big the realm behind it was; what the building
 * actually is belongs to Wikipedia, and making the reader open a tab to find out is a poor
 * trade. The preview is a courtesy laid over a plain link: if the fetch fails, is slow, or the
 * reader is on a touchscreen with no pointer to hover, the link underneath behaves exactly as
 * it always did.
 */
export function WikiLink({ language, title, children }: WikiLinkProps) {
    const [open, setOpen] = useState(false);
    const summary = useWikiSummary(language, title, open);

    return (
        <HoverCard open={open && summary !== null} onOpenChange={setOpen} openDelay={DWELL_MS}>
            <HoverCardTrigger>
                <a className="card__link" href={articleUrl(language, title)} target="_blank" rel="noreferrer">
                    {children} <ExternalLink size={11} aria-hidden />
                </a>
            </HoverCardTrigger>

            <HoverCardPanel className="wiki__card leather" arrowClassName="wiki__tip" align="start">
                {summary ? <WikiCard summary={summary} /> : null}
            </HoverCardPanel>
        </HoverCard>
    );
}
