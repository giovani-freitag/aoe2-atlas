/**
 * Checks every Wonder's Wikipedia link, one request each.
 *
 * A link that lands on a disambiguation page is worse than no link: the reader clicks through
 * expecting the monument and gets a list of everything sharing its name. Redirects are worth
 * knowing about too — they work, but the slug in the records has drifted from the article.
 *
 * Not part of any build. Run it after touching a `wikipedia` field:
 *   npx vite-node scripts/check-wikipedia.ts
 */
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';

const summaryUrl = (lang: string, title: string): string =>
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
const AGENT = 'aoe2-atlas/1.0 (https://github.com/giovani-freitag/aoe2-atlas)';

interface Summary {
    type: string;
    title: string;
    description?: string;
    extract?: string;
    thumbnail?: { source: string };
    titles?: { canonical: string };
}

const problems: string[] = [];
const redirects: string[] = [];

for (const record of CIVILIZATION_RECORDS) {
    const slug = record.wonder.wikipedia;
    const lang = record.wonder.wikipediaLang ?? 'en';
    const response = await fetch(summaryUrl(lang, slug), {
        headers: { 'User-Agent': AGENT, accept: 'application/json' },
    });

    if (!response.ok) {
        problems.push(`${record.key.padEnd(12)} HTTP ${response.status}  ${lang}:${slug}`);
        continue;
    }

    const summary = (await response.json()) as Summary;
    const canonical = summary.titles?.canonical ?? summary.title;

    if (summary.type === 'disambiguation') {
        problems.push(`${record.key.padEnd(12)} DESAMBIGUAÇÃO  ${lang}:${slug}`);
        continue;
    }

    if (!summary.extract) {
        problems.push(`${record.key.padEnd(12)} sem resumo  ${lang}:${slug}`);
        continue;
    }

    if (canonical !== slug) redirects.push(`${record.key.padEnd(12)} ${lang}:${slug}  →  ${canonical}`);
}

console.log(`${CIVILIZATION_RECORDS.length} maravilhas verificadas.\n`);

if (problems.length === 0) console.log('Nenhum link quebrado ou ambíguo.');
else console.log(`${problems.length} com problema:\n  ${problems.join('\n  ')}`);

if (redirects.length > 0) console.log(`\n${redirects.length} passam por redirecionamento:\n  ${redirects.join('\n  ')}`);
