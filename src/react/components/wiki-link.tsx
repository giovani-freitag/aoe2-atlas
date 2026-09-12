import { useId, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { articleUrl } from '@/data/wikipedia.ts';
import { useWikiHover } from '@/react/hooks/use-wiki-hover.ts';
import { WikiCard } from './wiki-card.tsx';

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
    const hover = useWikiHover();
    const id = useId();

    const show = (): void => {
        hover.enter(id, language, title);
    };

    return (
        <span className="wiki" onPointerLeave={hover.leave}>
            <a
                className="card__link"
                href={articleUrl(language, title)}
                target="_blank"
                rel="noreferrer"
                aria-describedby={hover.shown ? id : undefined}
                onPointerEnter={show}
                onFocus={show}
                onBlur={hover.leave}
            >
                {children} <ExternalLink size={11} aria-hidden />
            </a>

            {hover.shown ? <WikiCard summary={hover.shown.summary} id={id} /> : null}
        </span>
    );
}
