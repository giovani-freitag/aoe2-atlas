/** What a Wikipedia article says about itself, in the two lines a preview can hold. */
export interface WikiSummary {
    title: string;
    /** The one-line label under the title, when the article has one. */
    description: string | null;
    /** The opening sentences, plain text. */
    extract: string;
    /** A small square image, when the article carries one. */
    thumbnail: { url: string; width: number; height: number } | null;
    /** Where the full article is. */
    href: string;
}

interface SummaryJson {
    type: string;
    titles?: { normalized?: string };
    title: string;
    description?: string;
    extract?: string;
    thumbnail?: { source: string; width: number; height: number };
    content_urls?: { desktop?: { page?: string } };
}

export interface WikiServiceConfig {
    /** Names this application to Wikimedia, as their API policy asks. */
    agent: string;
}

/**
 * Fetches the article summaries the Wonder previews are made of.
 *
 * This is the endpoint Wikipedia's own hover previews read: a short extract, a thumbnail and a
 * description, cached at their edge and served with permissive CORS. No key, no build step, and
 * nothing to keep in step with the articles — a monument that gets rewritten reads correctly
 * here the same day.
 *
 * Answers are kept for the life of the page, including the misses. A reader who hovers the same
 * link twice should pay for it once, and an article that does not exist will not start existing
 * because we asked again.
 */
export class WikiService {
    private readonly agent: string;
    private readonly held = new Map<string, Promise<WikiSummary | null>>();

    constructor(config: WikiServiceConfig) {
        this.agent = config.agent;
    }

    /**
     * One article's summary.
     *
     * @param language - Which Wikipedia to ask, as a language code.
     * @param title - The article title.
     * @returns The summary, or null when there is no article or the network refused.
     */
    public summary(language: string, title: string): Promise<WikiSummary | null> {
        const key = `${language}:${title}`;
        const held = this.held.get(key);
        if (held) return held;

        const pending = this.fetch(language, title);
        this.held.set(key, pending);

        return pending;
    }

    private async fetch(language: string, title: string): Promise<WikiSummary | null> {
        const url = `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

        try {
            const response = await globalThis.fetch(url, {
                headers: { accept: 'application/json', 'Api-User-Agent': this.agent },
            });
            if (!response.ok) return null;

            const json = (await response.json()) as SummaryJson;
            if (!json.extract) return null;

            return {
                title: json.titles?.normalized ?? json.title,
                description: json.description ?? null,
                extract: json.extract,
                thumbnail: json.thumbnail
                    ? { url: json.thumbnail.source, width: json.thumbnail.width, height: json.thumbnail.height }
                    : null,
                href: json.content_urls?.desktop?.page ?? articleUrl(language, title),
            };
        } catch {
            // A preview is a courtesy. The link underneath still works, so failure says nothing.
            return null;
        }
    }
}

/**
 * Where an article lives.
 *
 * @param language - Which Wikipedia, as a language code.
 * @param title - The article title.
 */
export function articleUrl(language: string, title: string): string {
    return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}
