import { describe, expect, it } from 'vitest';
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';

/**
 * The links to Wikipedia, checked against Wikipedia.
 *
 * These are the only tests in the project that touch the network, which is why they live outside
 * `npm test` and run on their own with `npm run test:links`. Articles get renamed, merged and
 * turned into disambiguation pages by people who have never heard of this atlas, so the check
 * has to be against the real thing — a fixture would only record what was true the day it was
 * written. Run it before a release, and on a schedule if it ever earns one.
 */

const AGENT = 'aoe2-atlas/1.0 (https://github.com/giovani-freitag/aoe2-atlas)';

/** Wikipedia asks for no more than this many requests at once from one client. */
const AT_ONCE = 8;

interface Summary {
    type: string;
    title: string;
    extract?: string;
    titles?: { canonical: string };
}

interface Checked {
    civ: string;
    lang: string;
    title: string;
    status: number;
    type: string;
    hasExtract: boolean;
    canonical: string;
}

async function check(record: (typeof CIVILIZATION_RECORDS)[number]): Promise<Checked> {
    const lang = record.wonder.wikipediaLang ?? 'en';
    const title = record.wonder.wikipedia;
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(url, { headers: { 'User-Agent': AGENT, accept: 'application/json' } });

    if (!response.ok) {
        return { civ: record.key, lang, title, status: response.status, type: '', hasExtract: false, canonical: '' };
    }

    const summary = (await response.json()) as Summary;

    return {
        civ: record.key,
        lang,
        title,
        status: response.status,
        type: summary.type,
        hasExtract: Boolean(summary.extract),
        canonical: summary.titles?.canonical ?? summary.title,
    };
}

/** Runs the checks a handful at a time, so fifty-six of them do not arrive as a burst. */
async function checkAll(): Promise<Checked[]> {
    const done: Checked[] = [];

    for (let start = 0; start < CIVILIZATION_RECORDS.length; start += AT_ONCE) {
        const batch = CIVILIZATION_RECORDS.slice(start, start + AT_ONCE);
        done.push(...(await Promise.all(batch.map(check))));
    }

    return done;
}

const checked = await checkAll();

describe('every Wonder link', () => {
    it('reaches an article that exists', () => {
        const missing = checked.filter((row) => row.status !== 200).map((row) => `${row.civ}: HTTP ${row.status} on ${row.lang}:${row.title}`);

        expect(missing).toEqual([]);
    });

    it('reaches the monument rather than a disambiguation page', () => {
        const ambiguous = checked
            .filter((row) => row.type === 'disambiguation')
            .map((row) => `${row.civ}: ${row.lang}:${row.title} is a disambiguation page`);

        expect(ambiguous).toEqual([]);
    });

    it('reaches an article with something to say, so the hover preview has a body', () => {
        const empty = checked.filter((row) => row.status === 200 && !row.hasExtract).map((row) => `${row.civ}: ${row.lang}:${row.title}`);

        expect(empty).toEqual([]);
    });

    it('names the article Wikipedia itself names, with no redirect in between', () => {
        const drifted = checked
            .filter((row) => row.status === 200 && row.canonical !== row.title)
            .map((row) => `${row.civ}: ${row.title} → ${row.canonical}`);

        expect(drifted).toEqual([]);
    });
});
