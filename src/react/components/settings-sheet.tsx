import { useTranslation } from 'react-i18next';
import { Grid2x2, Languages } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { PROJECTION_KEYS, PROJECTIONS } from '@/domain/enums/projection.ts';
import { GENERATED_AT } from '@/data/dataset.ts';
import { LOCALE_NAMES, SUPPORTED_LOCALES, toSupportedLocale } from '@/i18n/locales.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';
import { BottomSheet } from './bottom-sheet.tsx';
import { TimelineRail } from './timeline-rail.tsx';

export interface SettingsSheetProps {
    /** Every civilization, for the profile behind the year slider. */
    civilizations: readonly Civilization[];
    from: number;
    to: number;
    sliceYear: number;
    loading: boolean;
    open: boolean;
    onClose: () => void;
}

/**
 * How the map is drawn, in which language, and — on a phone — for which year.
 *
 * The time control lives here on narrow screens because the histogram and slider crowd the
 * bottom of a phone; the rail outside keeps only the reading. On a wide screen the rail keeps
 * the full instrument and this panel is the language, the projection and the ruling.
 */
export function SettingsSheet({ civilizations, from, to, sliceYear, loading, open, onClose }: SettingsSheetProps) {
    const { t, i18n } = useTranslation();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const wide = useWideScreen();
    const locale = toSupportedLocale(i18n.language);

    return (
        <BottomSheet
            label={t('settings.title')}
            open={open}
            onClose={onClose}
            wide="float"
            head={
                <div>
                    <h2>{t('settings.title')}</h2>
                    <p className="sheet__region">{t('settings.subtitle')}</p>
                </div>
            }
        >
            {wide ? null : (
                <section className="card parchment singed">
                    <h3 className="eyebrow">{t('settings.year')}</h3>
                    <TimelineRail
                        civilizations={civilizations}
                        from={from}
                        to={to}
                        year={state.year}
                        sliceYear={sliceYear}
                        loading={loading}
                        onChange={(year) => {
                            dispatch({ type: 'year', value: year });
                        }}
                    />
                </section>
            )}

            {/* Each language is named in itself, so a reader lost in the wrong one can still find theirs. */}
            <section className="card parchment singed">
                <h3 className="eyebrow">{t('settings.language')}</h3>
                <label className="select">
                    <Languages size={16} aria-hidden />
                    <select
                        value={locale}
                        aria-label={t('settings.language')}
                        onChange={(event) => {
                            void i18n.changeLanguage(event.target.value);
                        }}
                    >
                        {SUPPORTED_LOCALES.map((tag) => (
                            <option key={tag} value={tag} lang={tag}>
                                {LOCALE_NAMES[tag]}
                            </option>
                        ))}
                    </select>
                </label>
            </section>

            <section className="card parchment singed">
                <h3 className="eyebrow">{t('settings.projection')}</h3>
                <p className="card__hint">{t('settings.projectionHint')}</p>
                <div className="options" role="radiogroup" aria-label={t('settings.projection')}>
                    {PROJECTION_KEYS.map((key) => (
                        <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={state.projection === key}
                            data-active={state.projection === key}
                            onClick={() => {
                                dispatch({ type: 'projection', value: key });
                            }}
                        >
                            <span className="options__name">
                                {PROJECTIONS[key].name}
                                <small>{t('settings.preserves', { what: t(`projections.${key}.preserves`) })}</small>
                            </span>
                            <span className="options__caveat">{t(`projections.${key}.caveat`)}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="card parchment singed">
                <h3 className="eyebrow">{t('settings.chart')}</h3>
                <button
                    type="button"
                    className="switch"
                    role="switch"
                    aria-checked={state.ruled}
                    data-active={state.ruled}
                    onClick={() => {
                        dispatch({ type: 'toggle-ruled' });
                    }}
                >
                    <Grid2x2 size={16} aria-hidden />
                    <span>{t('settings.ruled')}</span>
                    <span className="switch__track" aria-hidden>
                        <span className="switch__knob" />
                    </span>
                </button>
            </section>

            <p className="sheet__credit">
                {t('settings.creditsBorders')}{' '}
                <a href="https://github.com/aourednik/historical-basemaps" target="_blank" rel="noreferrer">
                    historical-basemaps
                </a>{' '}
                {t('settings.creditsRest', { date: format.date(GENERATED_AT.slice(0, 10)) })}
            </p>
        </BottomSheet>
    );
}
