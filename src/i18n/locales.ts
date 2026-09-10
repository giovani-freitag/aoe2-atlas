/**
 * The seventeen languages Age of Empires II: Definitive Edition is sold in, as BCP 47 tags.
 *
 * English leads because it is the bundle every other one falls back to when a key is missing.
 */
export const SUPPORTED_LOCALES = [
    'en',
    'pt-BR',
    'es',
    'es-MX',
    'fr',
    'de',
    'it',
    'pl',
    'ru',
    'tr',
    'hi',
    'ja',
    'ko',
    'ms',
    'vi',
    'zh-CN',
    'zh-TW',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const FALLBACK_LOCALE: SupportedLocale = 'en';

/** Each language named in itself, which is how a reader who cannot read the interface finds theirs. */
export const LOCALE_NAMES: Readonly<Record<SupportedLocale, string>> = {
    en: 'English',
    'pt-BR': 'Português (Brasil)',
    es: 'Español',
    'es-MX': 'Español (México)',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pl: 'Polski',
    ru: 'Русский',
    tr: 'Türkçe',
    hi: 'हिन्दी',
    ja: '日本語',
    ko: '한국어',
    ms: 'Bahasa Melayu',
    vi: 'Tiếng Việt',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
};

/** Latin American Spanish tags that read better in the Mexican bundle than the Castilian one. */
const LATIN_AMERICAN_SPANISH = /^es-(419|ar|bo|cl|co|cr|cu|do|ec|gt|hn|mx|ni|pa|pe|pr|py|sv|us|uy|ve)$/i;

/** Chinese tags written in traditional characters. */
const TRADITIONAL_CHINESE = /^zh-(tw|hk|mo|hant)/i;

/**
 * Narrows any language tag to a locale the atlas has strings for.
 *
 * Exact tags win; otherwise the two regional splits the game makes — Mexican Spanish and
 * traditional Chinese — are honoured, Portuguese of any kind reads the Brazilian bundle, and
 * anything else falls back on its bare language or on English.
 *
 * @param language - A tag as the browser or a stored preference reports it.
 */
export function toSupportedLocale(language: string): SupportedLocale {
    const lower = language.toLowerCase();

    const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === lower);
    if (exact) return exact;

    if (lower.startsWith('pt')) return 'pt-BR';
    if (LATIN_AMERICAN_SPANISH.test(lower)) return 'es-MX';
    if (TRADITIONAL_CHINESE.test(lower)) return 'zh-TW';
    if (lower.startsWith('zh')) return 'zh-CN';

    const base = lower.split('-')[0];
    const byBase = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === base);

    return byBase ?? FALLBACK_LOCALE;
}
