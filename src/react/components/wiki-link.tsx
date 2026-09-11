import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { WikiSummary } from '@/services/wiki/wiki-service.ts';
import { articleUrl } from '@/services/wiki/wiki-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

/**
 * How long a pointer must rest on the link before the article is fetched.
 *
 * Wikipedia's own previews wait about this long. Without it, crossing the link on the way to
 * something else fires a request the reader never wanted.
 */
const DWELL_MS = 320;

/** How close to the edge of the screen the card is allowed to come, in pixels. */
const EDGE = 8;

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
    const { wiki } = useServices();
    const [summary, setSummary] = useState<WikiSummary | null>(null);
    const [open, setOpen] = useState(false);
    const dwell = useRef<number | undefined>(undefined);
    const card = useRef<HTMLSpanElement>(null);
    const id = useId();

    useEffect(
        () => () => {
            window.clearTimeout(dwell.current);
        },
        [],
    );

    /*
     * The card hangs off the link, and the link is usually near the right edge of a panel that is
     * itself against the right edge of the screen — so left-aligned it ran a quarter of its width
     * off the viewport. It is nudged back by however much it overhangs, and dropped below the line
     * when there is no room above, which is all the placement this ever needs.
     */
    useLayoutEffect(() => {
        const node = card.current;
        if (!node) return;

        node.style.left = '0px';
        node.dataset.below = 'false';

        const box = node.getBoundingClientRect();
        const overhang = box.right - (window.innerWidth - EDGE);
        if (overhang > 0) node.style.left = `${-overhang}px`;
        if (box.top < EDGE) node.dataset.below = 'true';
    }, [open, summary]);

    const show = (): void => {
        window.clearTimeout(dwell.current);
        dwell.current = window.setTimeout(() => {
            setOpen(true);
            void wiki.summary(language, title).then(setSummary);
        }, DWELL_MS);
    };

    const hide = (): void => {
        window.clearTimeout(dwell.current);
        setOpen(false);
    };

    return (
        <span className="wiki" onPointerLeave={hide}>
            <a
                className="card__link"
                href={articleUrl(language, title)}
                target="_blank"
                rel="noreferrer"
                aria-describedby={open && summary ? id : undefined}
                onPointerEnter={show}
                onFocus={show}
                onBlur={hide}
            >
                {children} <ExternalLink size={11} aria-hidden />
            </a>

            {open && summary ? (
                <span className="wiki__card leather" ref={card} id={id} role="tooltip">
                    {summary.thumbnail ? <img src={summary.thumbnail.url} alt="" loading="lazy" /> : null}
                    <span className="wiki__body">
                        <strong>{summary.title}</strong>
                        {summary.description ? <small>{summary.description}</small> : null}
                        <span className="wiki__extract">{summary.extract}</span>
                    </span>
                </span>
            ) : null}
        </span>
    );
}
