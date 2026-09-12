/**
 * Fetches the civilization emblems the installed game does not ship yet.
 *
 * The Viking Sagas civilizations were announced before their release, so `widgetui/textures/
 * menu/civs` has no emblem for them and the extraction path the other fifty-three icons came
 * from has nothing to extract. The Age of Empires Series Wiki carries the reveal artwork, so
 * this pulls it and cuts it to the same 104-pixel plate as the rest.
 *
 * Delete this script once the expansion ships and the emblems can be read from the install.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'img', 'civs');

/** The side of the emblem plates already in the folder. */
const SIZE = 104;

/** Civilization key to the wiki file that holds its emblem. */
const EMBLEMS: Readonly<Record<string, string>> = {
    danes: 'Danes AoE2.png',
    saxons: 'Saxons AoE2.png',
    varangians: 'Varangians AoE2.png',
};

const WIKI = 'https://ageofempires.fandom.com/api.php';

interface ImageInfoResponse {
    query: {
        pages: { title: string; missing?: boolean; imageinfo?: { url: string }[] }[];
    };
}

/**
 * Asks the wiki where each named file actually lives.
 *
 * @param titles - File page titles, without the `File:` prefix.
 * @returns Title to direct URL.
 * @throws When the wiki has no such file, which means the name changed.
 */
async function resolve(titles: readonly string[]): Promise<Map<string, string>> {
    const query = new URLSearchParams({
        action: 'query',
        prop: 'imageinfo',
        iiprop: 'url',
        format: 'json',
        formatversion: '2',
        titles: titles.map((title) => `File:${title}`).join('|'),
    });

    const response = await fetch(`${WIKI}?${query.toString()}`, { headers: { 'user-agent': 'aoe2-atlas' } });
    if (!response.ok) throw new Error(`A wiki respondeu HTTP ${response.status}.`);

    const body = (await response.json()) as ImageInfoResponse;
    const found = new Map<string, string>();

    for (const page of body.query.pages) {
        const url = page.imageinfo?.[0]?.url;
        if (!url) throw new Error(`A wiki não tem "${page.title}".`);

        found.set(page.title.replace(/^File:/, ''), url.split('/revision')[0]);
    }

    return found;
}

const urls = await resolve(Object.values(EMBLEMS));
mkdirSync(OUT, { recursive: true });

for (const [key, title] of Object.entries(EMBLEMS)) {
    const url = urls.get(title);
    if (!url) throw new Error(`Faltou a URL de "${title}".`);

    const response = await fetch(url, { headers: { 'user-agent': 'aoe2-atlas' } });
    if (!response.ok) throw new Error(`Não consegui baixar ${url}: HTTP ${response.status}.`);

    // The wiki serves these as WebP whatever the file name says, so the format is never assumed.
    const plate = await sharp(Buffer.from(await response.arrayBuffer()))
        .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90, alphaQuality: 100, effort: 6 })
        .toBuffer();

    writeFileSync(join(OUT, `${key}.webp`), plate);
    console.log(`  ${key}.webp  ${SIZE}x${SIZE}  ${(plate.length / 1024).toFixed(0)} kB  ← ${title}`);
}
