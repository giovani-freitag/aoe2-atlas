import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMES, SUPPORTED_LOCALES, toSupportedLocale, type SupportedLocale } from '@/i18n/locales.ts';
import { Select, SelectOption } from '@/react/ui/select.tsx';
import { Flag } from './flag.tsx';

/**
 * The language the atlas is read in, chosen from a list the atlas draws itself.
 *
 * Every language is named in itself, because a reader stranded in the wrong one cannot read a
 * list of languages written in that wrong one. Where the reader's own language has a different
 * word for it, that word is shown underneath: someone reading in Spanish should not have to
 * work out that "English" is inglés, and the browser already knows how to say so.
 */
export function LanguagePicker() {
    const { t, i18n } = useTranslation();
    const locale = toSupportedLocale(i18n.language);

    /*
     * What each language is called in the one being read. `Intl.DisplayNames` ships this with the
     * browser, so seventeen languages naming seventeen languages costs nothing and is translated
     * by someone who speaks them. A name that only differs by its accents or its capitals is the
     * same name, and saying it twice would be noise.
     */
    const alsoKnownAs = useMemo(() => {
        const naming = new Intl.DisplayNames([locale], { type: 'language' });

        return new Map(
            SUPPORTED_LOCALES.map((tag) => {
                const said = naming.of(tag);
                const own = LOCALE_NAMES[tag];
                const same = said === undefined || said.localeCompare(own, locale, { sensitivity: 'base' }) === 0;

                return [tag, same ? null : said];
            }),
        );
    }, [locale]);

    return (
        <div className="picker">
            <Select<SupportedLocale>
                label={`${t('settings.language')}: ${LOCALE_NAMES[locale]}`}
                value={locale}
                onValueChange={(chosen) => {
                    void i18n.changeLanguage(chosen);
                }}
                trigger={
                    <>
                        <Flag locale={locale} />
                        <span className="picker__value" lang={locale}>
                            {LOCALE_NAMES[locale]}
                        </span>
                    </>
                }
            >
                {SUPPORTED_LOCALES.map((tag) => (
                    <SelectOption
                        key={tag}
                        value={tag}
                        lang={tag}
                        textValue={LOCALE_NAMES[tag]}
                        icon={<Flag locale={tag} />}
                    >
                        {LOCALE_NAMES[tag]}
                        {alsoKnownAs.get(tag) ? <small lang={locale}>{alsoKnownAs.get(tag)}</small> : null}
                    </SelectOption>
                ))}
            </Select>
        </div>
    );
}
