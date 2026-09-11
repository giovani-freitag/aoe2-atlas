import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { LOCALE_NAMES, SUPPORTED_LOCALES, toSupportedLocale } from '@/i18n/locales.ts';
import { useListbox } from '@/react/hooks/use-listbox.ts';

/**
 * The language the atlas is read in, chosen from a list the atlas draws itself.
 *
 * A native `select` is the one control on screen the page has no say over: on Windows it comes
 * out as a grey system rectangle in the middle of parchment and brass, and the list it drops is
 * the operating system's, not the atlas's. This is the same control built out of the same
 * materials as everything around it — and it has to earn that by behaving exactly as the
 * original did, which is what the listbox hook underneath is for.
 *
 * Every language is named in itself, because a reader stranded in the wrong one cannot read a
 * list of languages written in that wrong one.
 */
export function LanguagePicker() {
    const { t, i18n } = useTranslation();
    const locale = toSupportedLocale(i18n.language);
    const container = useRef<HTMLDivElement>(null);
    const opened = useRef<HTMLUListElement>(null);

    const list = useListbox({
        container,
        count: SUPPORTED_LOCALES.length,
        selected: SUPPORTED_LOCALES.indexOf(locale),
        onPick: (index) => {
            const chosen = SUPPORTED_LOCALES[index];
            if (chosen) void i18n.changeLanguage(chosen);
        },
    });

    /*
     * The panel this sits in scrolls, and the list is taller than the room under the button on a
     * phone. Rather than letting it run off the bottom of the sheet and trusting the reader to
     * work out that there is more, the sheet is brought up to meet it.
     */
    useEffect(() => {
        if (list.isOpen) opened.current?.scrollIntoView({ block: 'nearest' });
    }, [list.isOpen]);

    return (
        <div className="picker" ref={container} onKeyDown={list.onKeyDown}>
            <button
                type="button"
                className="picker__button"
                aria-haspopup="listbox"
                aria-expanded={list.isOpen}
                aria-label={`${t('settings.language')}: ${LOCALE_NAMES[locale]}`}
                onClick={list.toggle}
            >
                <Languages size={15} aria-hidden />
                <span className="picker__value" lang={locale}>
                    {LOCALE_NAMES[locale]}
                </span>
                <ChevronDown className="picker__caret" size={15} aria-hidden />
            </button>

            {list.isOpen ? (
                <ul className="picker__list parchment" ref={opened} role="listbox" aria-label={t('settings.language')}>
                    {SUPPORTED_LOCALES.map((tag, index) => (
                        <li key={tag}>
                            <button
                                type="button"
                                role="option"
                                lang={tag}
                                aria-selected={tag === locale}
                                data-active={index === list.active || undefined}
                                onClick={() => {
                                    list.pick(index);
                                }}
                            >
                                <span>{LOCALE_NAMES[tag]}</span>
                                {tag === locale ? <Check size={14} aria-hidden /> : null}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
