/**
 * Where an article lives.
 *
 * This sits with the data rather than with the service that fetches previews, because the build
 * script that writes the civilizations table needs the same address and has no business pulling a
 * browser service — and two spellings of one URL convention is how a link rots on one of them.
 *
 * @param language - Which Wikipedia, as a language code.
 * @param title - The article title.
 */
export function articleUrl(language: string, title: string): string {
    return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}
