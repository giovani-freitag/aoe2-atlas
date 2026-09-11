import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CIVILIZATION_RECORDS } from '@/data/civilizations.ts';
import { REGION_KEYS } from '@/domain/enums/region.ts';
import { LOCALE_NAMES, SUPPORTED_LOCALES, toSupportedLocale } from '@/i18n/locales.ts';

const LOCALES_DIR = join(process.cwd(), 'src', 'i18n', 'locales');

/** Every leaf key of a bundle as a dotted path, so two bundles can be compared shape to shape. */
function leaves(value: unknown, prefix = ''): string[] {
    if (typeof value !== 'object' || value === null) return [prefix];

    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
        leaves(child, prefix ? `${prefix}.${key}` : key),
    );
}

const held = new Map<string, Record<string, unknown>>();

/** Each bundle is read once and kept; the tests only ever look at it. */
function bundle(locale: string, namespace: string): Record<string, unknown> {
    const key = `${locale}/${namespace}`;
    const kept = held.get(key);
    if (kept) return kept;

    const read = JSON.parse(readFileSync(join(LOCALES_DIR, locale, `${namespace}.json`), 'utf8')) as Record<
        string,
        unknown
    >;
    held.set(key, read);

    return read;
}

/** The value at a dotted path, or undefined where the path runs out. */
function at(bundleOf: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], bundleOf);
}

/** The placeholders a string interpolates, in order, so a translation cannot drop or rename one. */
function placeholders(text: string): string[] {
    return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();
}

describe('the locale bundles', () => {
    it('ship a folder for every supported language and nothing else', () => {
        const folders = readdirSync(LOCALES_DIR, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();

        expect(folders).toEqual([...SUPPORTED_LOCALES].sort());
    });

    it.each(SUPPORTED_LOCALES)('%s carries every interface key English does, with the same placeholders', (locale) => {
        const reference = bundle('en', 'ui');
        const translated = bundle(locale, 'ui');

        // Walk each bundle once and compare through sets: this used to re-flatten both of them
        // for every key it checked, which was most of the time the whole suite spent.
        const expected = leaves(reference);
        const actual = new Set(leaves(translated));

        const missing = expected.filter((key) => !actual.has(key));
        const extra = [...actual].filter((key) => !expected.includes(key));
        const drift = expected.filter((key) => {
            const source = at(reference, key);
            const target = at(translated, key);

            return typeof target === 'string' && placeholders(source as string).join() !== placeholders(target).join();
        });

        expect({ missing, extra, drift }).toEqual({ missing: [], extra: [], drift: [] });
    });

    it.each(SUPPORTED_LOCALES)('%s names every civilization, monument, realm and region', (locale) => {
        const atlas = bundle(locale, 'atlas') as {
            regions: Record<string, string>;
            civs: Record<string, Record<string, string>>;
        };

        const unnamedRegions = REGION_KEYS.filter((region) => !atlas.regions[region]);
        const incomplete = CIVILIZATION_RECORDS.filter((record) => {
            const entry = atlas.civs[record.key];
            if (!entry) return true;

            const fields = ['name', 'monument', 'place', 'country', 'realm'];
            if (record.wonder.anachronistic) fields.push('anachronism');

            return fields.some((field) => !entry[field]);
        }).map((record) => record.key);
        const orphans = Object.keys(atlas.civs).filter((key) => !CIVILIZATION_RECORDS.some((record) => record.key === key));
        const strayAnachronisms = CIVILIZATION_RECORDS.filter(
            (record) => !record.wonder.anachronistic && atlas.civs[record.key]?.anachronism,
        ).map((record) => record.key);

        expect({ unnamedRegions, incomplete, orphans, strayAnachronisms }).toEqual({
            unnamedRegions: [],
            incomplete: [],
            orphans: [],
            strayAnachronisms: [],
        });
    });

    it('names each language in itself', () => {
        const names = SUPPORTED_LOCALES.map((locale) => LOCALE_NAMES[locale]);

        expect(new Set(names).size).toBe(SUPPORTED_LOCALES.length);
    });
});

describe('toSupportedLocale', () => {
    it.each([
        ['pt-BR', 'pt-BR'],
        ['pt-PT', 'pt-BR'],
        ['pt', 'pt-BR'],
        ['es-ES', 'es'],
        ['es-AR', 'es-MX'],
        ['es-419', 'es-MX'],
        ['zh-Hant-TW', 'zh-TW'],
        ['zh-HK', 'zh-TW'],
        ['zh', 'zh-CN'],
        ['zh-Hans-CN', 'zh-CN'],
        ['de-AT', 'de'],
        ['EN-us', 'en'],
        ['sv', 'en'],
    ])('narrows %s to %s', (tag, expected) => {
        const locale = toSupportedLocale(tag);

        expect(locale).toBe(expected);
    });
});
