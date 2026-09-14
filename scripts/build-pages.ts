/**
 * Builds the one part of the atlas that is text, in every language the atlas speaks.
 *
 * The map answers "where was this civilization in 1200" better than any table could, and answers
 * "which centuries is the Byzantine realm drawn in, and what is its Wonder modelled on" worse
 * than the crudest one — you have to drag a slider nineteen times and open a panel to find out.
 * That list exists nowhere: the game's wiki tabulates civilization against Wonder with no dates,
 * no cities and no territory, and the forum thread that collects the dates collects them in prose
 * and stops at forty-three of the fifty-six.
 *
 * So this writes the table, from the same files the atlas draws itself from. Every figure here is
 * generated. None of it is typed by hand, which is the only way a reference page and the map it
 * describes are still saying the same thing in a year's time.
 *
 * It runs after `vite build` and writes into dist/, so it never touches the hashed bundle and
 * never has to care which `base` the app was built with. Pass `--docs` to also write the Markdown
 * copy under docs/, which is a thing to do deliberately from a workstation: a build step that
 * rewrites a committed file leaves every CI run with a dirty tree.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';
import { articleUrl } from '@/data/wikipedia.ts';
import { FALLBACK_LOCALE, LOCALE_NAMES, type SupportedLocale } from '@/i18n/locales.ts';
import { fill, PAGE_COPY, PAGE_LOCALES, type PageCopy } from './pages/copy.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://giovani-freitag.github.io/aoe2-atlas/';

/** What one civilization is called, in one language. */
interface AtlasText {
    name: string;
    monument: string;
    place: string;
    country: string;
    realm: string;
    /** Why the monument does not belong to the civilization's time or place, where it does not. */
    anachronism?: string;
}

interface AtlasIndex {
    years: number[];
    civilizations: { civ: string; slices: number[]; peakYear: number; peakAreaKm2: number }[];
}

interface SliceFile {
    year: number;
    realms: { civ: string; exact: boolean; areaKm2: number }[];
}

/** One row of the table: everything the atlas knows about a civilization, in words and numbers. */
interface Row {
    name: string;
    monument: string;
    where: string;
    wikipedia: string;
    from: number;
    to: number;
    /** The dated maps the realm is drawn on, oldest first. */
    drawn: number[];
    /** How many of those carry a border cut for that century rather than borrowed from a neighbour. */
    cut: number;
    peakYear: number;
    peakAreaKm2: number;
    /** Set for the few whose Wonder stands somewhere its civilization never did. */
    anachronism: string | null;
}

function read<T>(...path: string[]): T {
    return JSON.parse(readFileSync(join(ROOT, ...path), 'utf8')) as T;
}

const index = read<AtlasIndex>('src', 'data', 'generated', 'atlas-index.json');

/*
 * What the map actually draws, which is not what the source cut.
 *
 * A civilization's entry in the index lists the years its border was cut for; the slices also
 * carry borders borrowed from the nearest mapped century, drawn faint. Counting the index instead
 * would make this table disagree with the map for twenty-nine of the fifty-six.
 */
const drawn = new Map<string, { years: number[]; cut: number }>();
for (const year of index.years) {
    for (const realm of read<SliceFile>('public', 'data', `slice-${year}.json`).realms) {
        const row = drawn.get(realm.civ) ?? { years: [], cut: 0 };
        row.years.push(year);
        if (realm.exact) row.cut += 1;
        drawn.set(realm.civ, row);
    }
}

/**
 * The table, told in one language.
 *
 * @param locale - Which one.
 * @returns Its rows, in that language's own alphabetical order.
 */
function rowsIn(locale: SupportedLocale): Row[] {
    const words = read<{ civs: Record<string, AtlasText> }>('src', 'i18n', 'locales', locale, 'atlas.json').civs;

    return CIVILIZATION_RECORDS.map((civilization) => {
        const text = words[civilization.key];
        const reach = index.civilizations.find((entry) => entry.civ === civilization.key);
        const map = drawn.get(civilization.key);

        if (!text) throw new Error(`No ${locale} text for "${civilization.key}".`);
        if (!reach) throw new Error(`No index entry for "${civilization.key}".`);
        if (!map || map.years.length === 0) throw new Error(`"${civilization.key}" is drawn on no map.`);

        return {
            name: text.name,
            monument: text.monument,
            where: `${text.place}, ${text.country}`,
            wikipedia: articleUrl(civilization.wonder.wikipediaLang ?? 'en', civilization.wonder.wikipedia),
            from: civilization.realm.from,
            to: civilization.realm.to,
            drawn: map.years,
            cut: map.cut,
            peakYear: reach.peakYear,
            peakAreaKm2: reach.peakAreaKm2,
            anachronism: text.anachronism ?? null,
        };
    }).sort((left, right) => left.name.localeCompare(right.name, locale));
}

/** Where a language's page answers from; English keeps the address the others hang off. */
function addressOf(locale: SupportedLocale): string {
    return locale === FALLBACK_LOCALE ? `${SITE}civilizations/` : `${SITE}civilizations/${locale}/`;
}

function escape(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const maps = index.years.length;
const first = index.years[0];
const last = index.years[index.years.length - 1];

/**
 * One language's page, written whole.
 *
 * @param locale - Which language it is in.
 * @returns The HTML, and the Markdown twin for the copy kept under docs/.
 */
function pageIn(locale: SupportedLocale): { html: string; markdown: string } {
    const said: PageCopy = PAGE_COPY[locale];
    const rows = rowsIn(locale);
    const odd = rows.filter((row) => row.anachronism !== null);
    const carried = rows.reduce((total, row) => total + (row.drawn.length - row.cut), 0);
    const numbers = new Intl.NumberFormat(locale);

    const counts = { maps, first, last, carried, civs: rows.length, odd: odd.length };
    const heading = said.heading;
    const oddHeading = fill(said.oddHeading, counts);
    const method = fill(said.method, counts);

    const area = (value: number): string => `${numbers.format(value)} km²`;

    // Plain digits, the way the atlas writes a year and every language does: grouped, 1200 comes
    // out as "1,200" or "1.200" and reads as a quantity rather than as a date.
    const years = (value: number): string => String(value);

    /** The stretch of dated maps a realm appears on, and how many of them there are. */
    const span = (row: Row): string => {
        const from = row.drawn[0];
        const to = row.drawn[row.drawn.length - 1];
        const range = from === to ? years(from) : `${years(from)}–${years(to)}`;
        const word = row.drawn.length === 1 ? said.maps.one : said.maps.many;

        return `${range} · ${row.drawn.length} ${word}`;
    };

    const basemaps = '<a href="https://github.com/aourednik/historical-basemaps">aourednik/historical-basemaps</a>';
    const wiki =
        '<a href="https://ageofempires.fandom.com/wiki/Wonder_(Age_of_Empires_II)">Age of Empires Series Wiki</a>';

    /*
     * Every language points at every other, and at English for a reader neither was written for.
     *
     * All seventeen exist, so the set is complete by construction — there is no page here that
     * can be annotated with an address that answers nothing.
     */
    const alternates = [
        ...PAGE_LOCALES.map(
            (code) => `        <link rel="alternate" hreflang="${code}" href="${addressOf(code)}" />`,
        ),
        `        <link rel="alternate" hreflang="x-default" href="${addressOf(FALLBACK_LOCALE)}" />`,
    ].join('\n');

    const elsewhere = PAGE_LOCALES.filter((code) => code !== locale)
        .map((code) => `<a href="${addressOf(code)}" hreflang="${code}">${escape(LOCALE_NAMES[code])}</a>`)
        .join(' · ');

    const html = `<!doctype html>
<html lang="${locale}">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1a130d" />
        <meta name="color-scheme" content="dark" />
        <meta name="description" content="${escape(said.description)}" />
        <link rel="icon" type="image/svg+xml" href="${locale === FALLBACK_LOCALE ? '../' : '../../'}brand.svg" />
        <title>${escape(said.title)} — AoE2 Atlas</title>
        <link rel="canonical" href="${addressOf(locale)}" />
${alternates}
        <meta name="robots" content="max-image-preview:large" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AoE2 Atlas" />
        <meta property="og:title" content="${escape(said.title)}" />
        <meta property="og:description" content="${escape(said.description)}" />
        <meta property="og:url" content="${addressOf(locale)}" />
        <meta property="og:locale" content="${locale.replace('-', '_')}" />
        <meta property="og:image" content="${SITE}social-card.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <style>
            :root {
                --ink: #efe6d0;
                --faint: #b9a888;
                --ground: #1a130d;
                --raised: #241b14;
                --rule: #3b2c1d;
                --brass: #c8a44a;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                padding: 2.5rem 1.25rem 4rem;
                background: var(--ground);
                color: var(--ink);
                font: 16px/1.6 system-ui, sans-serif;
            }

            main {
                max-width: 64rem;
                margin: 0 auto;
            }

            a {
                color: var(--brass);
            }

            h1 {
                margin: 0 0 1rem;
                font-size: clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem);
                line-height: 1.2;
            }

            h2 {
                margin: 2.5rem 0 0;
                font-size: clamp(1.25rem, 1rem + 1vw, 1.6rem);
                line-height: 1.25;
            }

            p {
                max-width: 46rem;
                color: var(--faint);
            }

            .back {
                display: inline-block;
                margin-bottom: 2rem;
                font-weight: 600;
            }

            .sheet {
                overflow-x: auto;
                margin-top: 2rem;
                border: 1px solid var(--rule);
                border-radius: 8px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9375rem;
            }

            th,
            td {
                padding: 0.6rem 0.75rem;
                text-align: left;
                border-bottom: 1px solid var(--rule);
            }

            /* Only the figures refuse to break; a place name is free to wrap and often must. */
            .num,
            th[scope='row'] {
                white-space: nowrap;
            }

            /*
             * The column headings, and only those: a bare "th" also catches the fifty-six
             * civilization names, which are the subject of their row rather than a label for it.
             * Sticky and dimmed, they turned each name into a grey band pinned to the top.
             */
            thead th {
                position: sticky;
                top: 0;
                background: var(--raised);
                font-size: 0.75rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--faint);
            }

            th[scope='row'] {
                font-weight: 600;
                color: var(--ink);
            }

            tbody tr:nth-child(odd) {
                background: rgb(255 255 255 / 2%);
            }

            dl.odd {
                margin: 1.25rem 0 0;
                max-width: 46rem;
            }

            dl.odd dt {
                margin-top: 1rem;
                font-weight: 600;
            }

            dl.odd dd {
                margin: 0.15rem 0 0;
                color: var(--faint);
            }

            footer {
                margin-top: 3rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--rule);
                font-size: 0.875rem;
                color: var(--faint);
            }

            footer nav {
                margin-top: 0.75rem;
                line-height: 2;
            }

            /*
             * Narrow: one card per civilization instead of one row.
             *
             * Six columns of dates and areas measured over a thousand pixels, which on a phone is
             * three and a half screens of sideways scrolling to read one line — the reader loses
             * the name by the time they reach the year. Stacked, every civilization is a short
             * block that reads top to bottom, and nothing scrolls but the page.
             */
            @media (max-width: 56rem) {
                .sheet {
                    border: none;
                    border-radius: 0;
                    overflow-x: visible;
                }

                thead {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                    clip-path: inset(50%);
                }

                table,
                tbody,
                tr,
                th,
                td {
                    display: block;
                }

                tr {
                    margin-bottom: 0.75rem;
                    padding: 0.75rem 0.9rem 0.9rem;
                    border: 1px solid var(--rule);
                    border-radius: 8px;
                    background: rgb(255 255 255 / 2%);
                }

                th[scope='row'] {
                    padding: 0 0 0.5rem;
                    border: none;
                    font-size: 1.0625rem;
                    color: var(--brass);
                    white-space: normal;
                }

                /* Nothing sticks in a card: the name belongs to the block it heads, not the top. */
                tbody tr:nth-child(odd) {
                    background: none;
                }

                td {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: space-between;
                    padding: 0.3rem 0;
                    border: none;
                    text-align: right;
                }

                td + td {
                    border-top: 1px solid rgb(255 255 255 / 5%);
                }

                td::before {
                    content: attr(data-label);
                    flex: none;
                    font-size: 0.75rem;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: var(--faint);
                }
            }
        </style>
    </head>
    <body>
        <main>
            <a class="back" href="${locale === FALLBACK_LOCALE ? '../' : '../../'}">${escape(said.backToAtlas)}</a>
            <h1>${escape(heading)}</h1>
            <p>${escape(said.lead)}</p>
            <p>${escape(method)}</p>

            <!--
                The roles are written out because the narrow layout takes them away.

                Below the breakpoint every part of this table is laid out as a block, and a
                browser drops the implicit table semantics the moment "display" stops being
                "table-cell". Stating them keeps the thing a table for a screen reader at every
                width, while "data-label" gives each figure back the heading it lost.
            -->
            <div class="sheet">
                <table role="table">
                    <thead role="rowgroup">
                        <tr role="row">
                            <th scope="col">${escape(said.columns.civilization)}</th>
                            <th scope="col">${escape(said.columns.monument)}</th>
                            <th scope="col">${escape(said.columns.where)}</th>
                            <th scope="col">${escape(said.columns.onStage)}</th>
                            <th scope="col">${escape(said.columns.drawnOn)}</th>
                            <th scope="col">${escape(said.columns.widest)}</th>
                        </tr>
                    </thead>
                    <tbody role="rowgroup">
${rows
    .map(
        (row) => `                        <tr role="row">
                            <th scope="row" role="rowheader">${escape(row.name)}</th>
                            <td role="cell" data-label="${escape(said.columns.monument)}"><a href="${row.wikipedia}">${escape(row.monument)}</a></td>
                            <td role="cell" data-label="${escape(said.columns.where)}">${escape(row.where)}</td>
                            <td role="cell" data-label="${escape(said.columns.onStage)}" class="num">${years(row.from)}–${years(row.to)}</td>
                            <td role="cell" data-label="${escape(said.columns.drawnOn)}" class="num">${escape(span(row))}</td>
                            <td role="cell" data-label="${escape(said.columns.widest)}" class="num">${escape(area(row.peakAreaKm2))} · ${years(row.peakYear)}</td>
                        </tr>`,
    )
    .join('\n')}
                    </tbody>
                </table>
            </div>

            <h2>${escape(oddHeading)}</h2>
            <p>${escape(said.oddLead)}</p>
            <dl class="odd">
${odd
    .map(
        (row) => `                <dt>${escape(row.name)} — ${escape(row.monument)}, ${escape(row.where)}</dt>
                <dd>${escape(row.anachronism ?? '')}</dd>`,
    )
    .join('\n')}
            </dl>

            <footer>
                <p>${fill(said.sources, { basemaps, wiki })}</p>
                <p>${escape(said.disagreement)}</p>
                <p>
                    <a href="${locale === FALLBACK_LOCALE ? '../' : '../../'}">${escape(said.openTheAtlas)}</a> ·
                    <a href="https://github.com/giovani-freitag/aoe2-atlas">${escape(said.source)}</a>
                </p>
                <nav aria-label="${escape(said.otherLanguages)}">${elsewhere}</nav>
            </footer>
        </main>
    </body>
</html>
`;

    const markdown = `# ${heading}

${said.lead}

${method}

| ${said.columns.civilization} | ${said.columns.monument} | ${said.columns.where} | ${said.columns.onStage} | ${said.columns.drawnOn} | ${said.columns.widest} |
| --- | --- | --- | --- | --- | --- |
${rows
    .map(
        (row) =>
            `| ${row.name} | [${row.monument}](${row.wikipedia}) | ${row.where} | ${years(row.from)}–${years(row.to)} | ${span(row)} | ${area(row.peakAreaKm2)} · ${years(row.peakYear)} |`,
    )
    .join('\n')}

## ${oddHeading}

${said.oddLead}

${odd.map((row) => `**${row.name} — ${row.monument}, ${row.where}.** ${row.anachronism ?? ''}`).join('\n\n')}

Borders from [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps),
monuments from the [Age of Empires Series Wiki](https://ageofempires.fandom.com/wiki/Wonder_(Age_of_Empires_II)).
This file is generated by \`scripts/build-pages.ts\` — edit the data, not the table.

[${said.openTheAtlas}](${SITE})
`;

    return { html, markdown };
}

/*
 * The list of everything, because nothing outside points at most of it.
 *
 * This was refused while the atlas was one address — a sitemap of a single URL says nothing that
 * the address itself does not. Sixteen of these eighteen have no inbound link at all and are
 * reachable only from a drawer inside a map, which a crawler does not open; the list is now the
 * mechanism of discovery rather than a formality. It has to be handed over by hand in Search
 * Console, because a `Sitemap:` line belongs in a robots.txt at the root of the host, and the
 * root of this host is a 404 nobody here owns.
 */
function sitemap(): string {
    const addresses = [SITE, ...PAGE_LOCALES.map(addressOf)];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${addresses
    .map((address) => {
        // Only the table pages are a set of translations; the atlas itself is one address that
        // speaks every language, and annotating it as seventeen would be a claim about URLs
        // that do not exist.
        const alternates = address === SITE
            ? ''
            : `\n${PAGE_LOCALES.map(
                  (code) =>
                      `        <xhtml:link rel="alternate" hreflang="${code}" href="${addressOf(code)}" />`,
              ).join('\n')}\n        <xhtml:link rel="alternate" hreflang="x-default" href="${addressOf(FALLBACK_LOCALE)}" />`;

        return `    <url>\n        <loc>${address}</loc>${alternates}\n    </url>`;
    })
    .join('\n')}
</urlset>
`;
}

let total = 0;
for (const locale of PAGE_LOCALES) {
    const { html } = pageIn(locale);
    const out = locale === FALLBACK_LOCALE
        ? join(ROOT, 'dist', 'civilizations')
        : join(ROOT, 'dist', 'civilizations', locale);

    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'index.html'), html, 'utf8');
    total += Buffer.byteLength(html);
}

console.log(`  dist/civilizations  ${PAGE_LOCALES.length} languages · ${(total / 1024).toFixed(0)} kB`);

writeFileSync(join(ROOT, 'dist', 'sitemap.xml'), sitemap(), 'utf8');
console.log(`  dist/sitemap.xml    ${PAGE_LOCALES.length + 1} addresses`);

if (process.argv.includes('--docs')) {
    writeFileSync(join(ROOT, 'docs', 'civilizations.md'), pageIn(FALLBACK_LOCALE).markdown, 'utf8');
    console.log('  docs/civilizations.md');
}
