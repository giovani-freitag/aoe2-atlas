import { useTranslation } from 'react-i18next';
import { Grid2x2 } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { PROJECTION_KEYS, PROJECTIONS } from '@/domain/enums/projection.ts';
import { GENERATED_AT } from '@/data/dataset.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';
import { BottomSheet } from './bottom-sheet.tsx';
import { LanguagePicker } from './language-picker.tsx';
import { TimelineRail } from './timeline-rail.tsx';

export interface SettingsSheetProps {
    /** Every civilization, for the profile behind the year slider. */
    civilizations: readonly Civilization[];
    /** The years the atlas has maps for, oldest first. */
    years: readonly number[];
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
export function SettingsSheet({ civilizations, years, loading, open, onClose }: SettingsSheetProps) {
    const { t } = useTranslation();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const wide = useWideScreen();

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
                        years={years}
                        year={state.year}
                        loading={loading}
                        onChange={(year) => {
                            dispatch({ type: 'year', value: year });
                        }}
                    />
                </section>
            )}

            <section className="card parchment singed">
                <h3 className="eyebrow">{t('settings.language')}</h3>
                <LanguagePicker />
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
