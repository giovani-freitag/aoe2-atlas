import type { WikiSummary } from '@/services/wiki/wiki-service.ts';

export interface WikiCardProps {
    summary: WikiSummary;
}

/**
 * What is inside the preview: a thumbnail, a title, a line of description and the opening
 * sentences.
 *
 * Only the contents. Where the card goes — beside a link in a panel, or above a pin on the map —
 * and how it stays on screen are the card's container's business, and the same for both callers.
 */
export function WikiCard({ summary }: WikiCardProps) {
    return (
        <>
            {summary.thumbnail ? <img src={summary.thumbnail.url} alt="" loading="lazy" /> : null}
            <span className="wiki__body">
                <strong>{summary.title}</strong>
                {summary.description ? <small>{summary.description}</small> : null}
                <span className="wiki__extract">{summary.extract}</span>
            </span>
        </>
    );
}
