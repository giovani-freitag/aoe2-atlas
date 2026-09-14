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
    /** Set for the seven whose Wonder stands somewhere its civilization never did. */
    anachronism: string | null;
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
        anachronism: text.anachronism ?? null,
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
 * The tab and the search result get the short one, and it leads with where rather than when.
 * Both questions are asked of this table and it answers both, but the one people phrase out
 * loud is where a civilization actually was — and what stands against it there is a forum
 * thread with a picture in it, while 'Wonder' leads to a wiki with a page per monument and a
 * domain this one will never outweigh. The heading on the page is free to say the whole thing,
 * because nothing truncates it.
 */
const TITLE = 'Where the 56 Age of Empires II civilizations stood, and when';
const HEADING = 'Where every Age of Empires II civilization really stood, and for how long';
const DESCRIPTION =
    'Where each of the 56 Age of Empires II civilizations actually was: the real monument its Wonder was modelled on, the city that monument stands in, and the centuries the atlas draws its realm.';

const maps = index.years.length;
const first = index.years[0];
const last = index.years[index.years.length - 1];

const odd = rows.filter((row) => row.anachronism !== null);

/*
 * The part of this page nobody else has written.
 *
 * A list of civilization against Wonder can be copied off a wiki in an afternoon. Which of them
 * stand somewhere their civilization never did, and why, is a judgement with a reason attached —
 * and it is the honest answer to what a reader means by asking where these civilizations really
 * were. The notes are the ones the atlas already shows on each civilization's own panel.
 */
const ODD_HEADING = `${odd.length} Wonders that stand where their civilization never did`;
const ODD_LEAD = 'The game puts every Wonder on a building that exists, and for most of them the building is where the civilization was. These are the exceptions, and the atlas says so on each one rather than drawing the pin and leaving it. The monument is still real; what does not hold is the claim that the civilization stood there.';

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

            .num {
                font-variant-numeric: tabular-nums;
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

            h2 {
                margin: 2.5rem 0 0;
                font-size: clamp(1.25rem, 1rem + 1vw, 1.6rem);
                line-height: 1.25;
            }

            footer {
                margin-top: 3rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--rule);
                font-size: 0.875rem;
                color: var(--faint);
            }

            /*
             * Narrow: one card per civilization instead of one row.
             *
             * Six columns of dates and areas measured 1183 pixels, which on a phone is three and a
             * half screens of sideways scrolling to read one line — the reader loses the name by
             * the time they reach the year. Stacked, every civilization is a short block that
             * reads top to bottom, and nothing scrolls but the page.
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

                /* Nothing sticks in a card: the name belongs to the block it heads, not to the top. */
                tbody tr:nth-child(odd) {
                    background: none;
                }

                td {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: space-between;
                    padding: 0.3rem 0;
                    border: none;
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

                /* The value is the thing being read, so it takes the side the eye returns to. */
                td {
                    text-align: right;
                }
            }
        </style>
    </head>
    <body>
        <main>
            <a class="back" href="../">← The atlas</a>
            <h1>${escape(HEADING)}</h1>
            <p>${escape(LEAD)}</p>
            <p>${escape(METHOD)}</p>

            <!--
                The roles are written out because the narrow layout takes them away.

                Below the breakpoint every part of this table is laid out as a block — six columns
                of dates and areas are four screens of sideways scrolling on a phone — and a
                browser drops the implicit table semantics the moment "display" stops being
                "table-cell". Stating them keeps the thing a table for a screen reader at every
                width, while "data-label" gives each figure back the heading it lost.
            -->
            <div class="sheet">
                <table role="table">
                    <thead role="rowgroup">
                        <tr role="row">
                            <th scope="col">Civilization</th>
                            <th scope="col">The Wonder is modelled on</th>
                            <th scope="col">Where it stands</th>
                            <th scope="col">On stage</th>
                            <th scope="col">Drawn on</th>
                            <th scope="col">At its widest</th>
                        </tr>
                    </thead>
                    <tbody role="rowgroup">
${rows
    .map(
        (row) => `                        <tr role="row">
                            <th scope="row" role="rowheader">${escape(row.name)}</th>
                            <td role="cell" data-label="Wonder"><a href="${row.wikipedia}">${escape(row.monument)}</a></td>
                            <td role="cell" data-label="Stands in">${escape(row.where)}</td>
                            <td role="cell" data-label="On stage" class="num">${row.from}–${row.to}</td>
                            <td role="cell" data-label="Drawn on" class="num">${escape(span(row))}</td>
                            <td role="cell" data-label="At its widest" class="num">${escape(area(row.peakAreaKm2))} in ${row.peakYear}</td>
                        </tr>`,
    )
    .join('\n')}
                    </tbody>
                </table>
            </div>

            <h2>${escape(ODD_HEADING)}</h2>
            <p>${escape(ODD_LEAD)}</p>
            <dl class="odd">
${rows
    .filter((row) => row.anachronism !== null)
    .map(
        (row) => `                <dt>${escape(row.name)} — ${escape(row.monument)}, ${escape(row.where)}</dt>
                <dd>${escape(row.anachronism ?? '')}</dd>`,
    )
    .join('\n')}
            </dl>

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

## ${ODD_HEADING}

${ODD_LEAD}

${odd.map((row) => `**${row.name} — ${row.monument}, ${row.where}.** ${row.anachronism ?? ''}`).join('\n\n')}

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
