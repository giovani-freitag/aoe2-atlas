import i18next, { type BackendModule, type i18n, type ReadCallback } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { FALLBACK_LOCALE, SUPPORTED_LOCALES, toSupportedLocale } from './locales.ts';

/** The two bundles each language ships: what the interface says, and what the atlas is made of. */
export const NAMESPACES = ['ui', 'atlas'] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** Where a stored language choice lives between visits. */
const STORAGE_KEY = 'aoe2-atlas.locale';

/**
 * Every bundle, as a lazy import keyed by its path.
 *
 * Seventeen languages times two bundles is well over half a megabyte of JSON; a reader wants one
 * language, so each is its own chunk and only arrives when chosen.
 */
const BUNDLES = import.meta.glob<Record<string, unknown>>('./locales/*/*.json', { import: 'default' });

/** Loads one namespace of one language from the chunk Vite cut for it. */
const lazyBackend: BackendModule = {
    type: 'backend',
    init: () => undefined,
    read: (language: string, namespace: string, callback: ReadCallback) => {
        const load = BUNDLES[`./locales/${language}/${namespace}.json`];
        if (!load) {
            callback(new Error(`Não há bundle "${namespace}" para "${language}".`), false);

            return;
        }

        load().then(
            (bundle) => {
                callback(null, bundle);
            },
            (reason: unknown) => {
                callback(reason instanceof Error ? reason : new Error(String(reason)), false);
            },
        );
    },
};

/**
 * Boots i18next: detects the reader's language, loads its two bundles, and falls back to English.
 *
 * @returns The instance the React provider and the text service both read from.
 */
export function createI18n(): i18n {
    void i18next
        .use(lazyBackend)
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            ns: [...NAMESPACES],
            defaultNS: 'ui',
            fallbackLng: FALLBACK_LOCALE,
            supportedLngs: [...SUPPORTED_LOCALES],
            load: 'currentOnly',
            interpolation: { escapeValue: false },
            detection: {
                order: ['localStorage', 'navigator'],
                lookupLocalStorage: STORAGE_KEY,
                caches: ['localStorage'],
                convertDetectedLanguage: toSupportedLocale,
            },
        });

    return i18next;
}
