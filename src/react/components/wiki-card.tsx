import { useLayoutEffect, useRef } from 'react';
import type { WikiSummary } from '@/services/wiki/wiki-service.ts';

/** How close to the edge of the screen the card is allowed to come, in pixels. */
const EDGE = 8;

/** How near the card's own corner the tip may come, so it never points off the edge of it. */
const TIP_INSET = 18;

export interface WikiCardProps {
    summary: WikiSummary;
    /** Names the card for whatever describes itself by it. */
    id?: string;
}

/**
 * The preview itself: a thumbnail, a title, a line of description and the opening sentences.
 *
 * It places itself against whatever it is put inside, which is the one arrangement that serves
 * both callers — hanging off a link in a panel, and hanging off a pin on the map. The parent
 * marks the spot and this works out the rest: slide sideways when the card would leave the
 * screen, drop below the line when there is no room above, and keep the tip over the thing it
 * came from either way.
 */
export function WikiCard({ summary, id }: WikiCardProps) {
    const card = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const node = card.current;
        const around = node?.parentElement;
        if (!node || !around) return;

        node.style.left = '0px';
        node.dataset.below = 'false';

        /*
         * Slid back onto the screen. The card is as wide as a phone is, so an anchor anywhere
         * near an edge throws it off — off the right when the link sits in a panel against the
         * right edge, off the left when the anchor is a pin over the Atlantic.
         */
        const first = node.getBoundingClientRect();
        const past = first.right - (window.innerWidth - EDGE);
        const short = EDGE - first.left;
        const shift = short > 0 ? short : past > 0 ? -past : 0;

        if (shift !== 0) node.style.left = `${shift}px`;
        if (first.top < EDGE) node.dataset.below = 'true';

        /*
         * The tip points at what opened the card, not at the card's own corner — the two stop
         * lining up the moment the card is slid sideways to stay on screen. The anchor is
         * measured by its first client rect, because a link that has wrapped across two lines
         * reports a box spanning both, whose middle is in neither.
         */
        const settled = node.getBoundingClientRect();
        const anchor = around.getClientRects()[0] ?? around.getBoundingClientRect();
        const tip = anchor.x + anchor.width / 2 - settled.x;

        node.style.setProperty('--tip', `${Math.min(Math.max(tip, TIP_INSET), settled.width - TIP_INSET)}px`);
    }, [summary]);

    return (
        <span className="wiki__card leather" ref={card} id={id} role="tooltip">
            {summary.thumbnail ? <img src={summary.thumbnail.url} alt="" loading="lazy" /> : null}
            <span className="wiki__body">
                <strong>{summary.title}</strong>
                {summary.description ? <small>{summary.description}</small> : null}
                <span className="wiki__extract">{summary.extract}</span>
            </span>
        </span>
    );
}
