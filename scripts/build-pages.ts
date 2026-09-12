/**
 * Builds the one page of the atlas that is text.
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://giovani-freitag.github.io/aoe2-atlas/';

/** What one civilization is called, in English; the other sixteen languages stay in the app. */
interface AtlasText {
    name: string;
    monument: string;
    place: string;
    country: string;
    realm: string;
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
}

function read<T>(...path: string[]): T {
    return JSON.parse(readFileSync(join(ROOT, ...path), 'utf8')) as T;
}

const index = read<AtlasIndex>('src', 'data', 'generated', 'atlas-index.json');
const words = read<{ civs: Record<string, AtlasText> }>('src', 'i18n', 'locales', 'en', 'atlas.json').civs;

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

const rows: Row[] = CIVILIZATION_RECORDS.map((civilization) => {
    const text = words[civilization.key];
    const reach = index.civilizations.find((entry) => entry.civ === civilization.key);
    const map = drawn.get(civilization.key);

    if (!text) throw new Error(`No English text for "${civilization.key}".`);
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
    };
}).sort((left, right) => left.name.localeCompare(right.name, 'en'));

const numbers = new Intl.NumberFormat('en-GB');
const carried = rows.reduce((total, row) => total + (row.drawn.length - row.cut), 0);

/** The stretch of dated maps a realm appears on, and how many of them there are. */
function span(row: Row): string {
    const first = row.drawn[0];
    const last = row.drawn[row.drawn.length - 1];
    const range = first === last ? String(first) : `${first}–${last}`;

    return `${range} · ${row.drawn.length} ${row.drawn.length === 1 ? 'map' : 'maps'}`;
}

function area(value: number): string {
    return `${numbers.format(value)} km²`;
}

function escape(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*
 * Two headings, because they answer to different readers.
 *
 * The tab and the search result get the short one, and it leads with the dates: that is the
 * question this page is the best answer to on the open web — the thread that collects them
 * collects them in prose and stops at forty-three of the fifty-six — while 'Wonder' leads to a
 * wiki with a page per monument and a domain this one will never outweigh. The heading on the
 * page itself is free to say the whole thing, because nothing truncates it.
 */
const TITLE = 'The dates of all 56 Age of Empires II civilizations';
const HEADING = 'Every Age of Empires II civilization: the years it stood, and the Wonder it built';
const DESCRIPTION =
    'When each of the 56 Age of Empires II civilizations stood, the dated maps the atlas draws its realm on, and the real monument its Wonder was modelled on.';

const maps = index.years.length;
const first = index.years[0];
const last = index.years[index.years.length - 1];

/* The two sentences that say what the numbers in the table mean, used by both outputs. */
const LEAD = `Every civilization in Age of Empires II builds a Wonder modelled on a building that exists. This table names the building and the city it stands in, the years the game's own lore gives the realm, the dated maps the atlas draws it on, and how much ground it held when it was at its widest.`;
const METHOD = `The atlas is cut into ${maps} dated maps between AD ${first} and ${last}. A realm is listed for every map it is drawn on, which includes the ${carried} cases across all ${rows.length} civilizations where the border had to be borrowed from the nearest mapped century — the atlas draws those faint. Areas are measured on the globe, so they compare whatever projection the map is opened in.`;

const page = `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1a130d" />
        <meta name="color-scheme" content="dark" />
        <meta name="description" content="${escape(DESCRIPTION)}" />
        <link rel="icon" type="image/svg+xml" href="../brand.svg" />
        <title>${escape(TITLE)} — AoE2 Atlas</title>
        <link rel="canonical" href="${SITE}civilizations/" />
        <meta name="robots" content="max-image-preview:large" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AoE2 Atlas" />
        <meta property="og:title" content="${escape(TITLE)}" />
        <meta property="og:description" content="${escape(DESCRIPTION)}" />
        <meta property="og:url" content="${SITE}civilizations/" />
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
                white-space: nowrap;
            }

            th {
                position: sticky;
                top: 0;
                background: var(--raised);
                font-size: 0.75rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--faint);
            }

            tbody tr:nth-child(odd) {
                background: rgb(255 255 255 / 2%);
            }

            td:first-child {
                font-weight: 600;
            }

            .num {
                font-variant-numeric: tabular-nums;
            }

            footer {
                margin-top: 3rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--rule);
                font-size: 0.875rem;
                color: var(--faint);
            }
        </style>
    </head>
    <body>
        <main>
            <a class="back" href="../">← The atlas</a>
            <h1>${escape(HEADING)}</h1>
            <p>${escape(LEAD)}</p>
            <p>${escape(METHOD)}</p>

            <div class="sheet">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Civilization</th>
                            <th scope="col">The Wonder is modelled on</th>
                            <th scope="col">Where it stands</th>
                            <th scope="col">On stage</th>
                            <th scope="col">Drawn on</th>
                            <th scope="col">At its widest</th>
                        </tr>
                    </thead>
                    <tbody>
${rows
    .map(
        (row) => `                        <tr>
                            <th scope="row">${escape(row.name)}</th>
                            <td><a href="${row.wikipedia}">${escape(row.monument)}</a></td>
                            <td>${escape(row.where)}</td>
                            <td class="num">${row.from}–${row.to}</td>
                            <td class="num">${escape(span(row))}</td>
                            <td class="num">${escape(area(row.peakAreaKm2))} in ${row.peakYear}</td>
                        </tr>`,
    )
    .join('\n')}
                    </tbody>
                </table>
            </div>

            <footer>
                <p>
                    Borders from
                    <a href="https://github.com/aourednik/historical-basemaps">aourednik/historical-basemaps</a>,
                    monuments from the
                    <a href="https://ageofempires.fandom.com/wiki/Wonder_(Age_of_Empires_II)">Age of Empires Series Wiki</a>.
                    Where the wiki and the atlas disagree on where a Wonder stands — the Varangian one at Bolghar
                    against Gnezdovo, the Mongol one at Avarga against Karakorum — the atlas says which it chose and
                    why on the civilization's own panel.
                </p>
                <p><a href="../">Open the atlas</a> · <a href="https://github.com/giovani-freitag/aoe2-atlas">Source</a></p>
            </footer>
        </main>
    </body>
</html>
`;

const markdown = `# ${HEADING}

${LEAD}

${METHOD}

| Civilization | The Wonder is modelled on | Where it stands | On stage | Drawn on | At its widest |
| --- | --- | --- | --- | --- | --- |
${rows
    .map(
        (row) =>
            `| ${row.name} | [${row.monument}](${row.wikipedia}) | ${row.where} | ${row.from}–${row.to} | ${span(row)} | ${area(row.peakAreaKm2)} in ${row.peakYear} |`,
    )
    .join('\n')}

Borders from [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps),
monuments from the [Age of Empires Series Wiki](https://ageofempires.fandom.com/wiki/Wonder_(Age_of_Empires_II)).
This file is generated by \`scripts/build-pages.ts\` — edit the data, not the table.

[Open the atlas](${SITE})
`;

const out = join(ROOT, 'dist', 'civilizations');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), page, 'utf8');
console.log(`  dist/civilizations/index.html  ${(Buffer.byteLength(page) / 1024).toFixed(0)} kB · ${rows.length} civilizations`);

if (process.argv.includes('--docs')) {
    writeFileSync(join(ROOT, 'docs', 'civilizations.md'), markdown, 'utf8');
    console.log(`  docs/civilizations.md          ${(Buffer.byteLength(markdown) / 1024).toFixed(0)} kB`);
}
