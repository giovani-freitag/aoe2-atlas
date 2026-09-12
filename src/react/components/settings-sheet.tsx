import { useTranslation } from 'react-i18next';
import { Grid2x2 } from 'lucide-react';
import { PROJECTION_KEYS, PROJECTIONS } from '@/domain/enums/projection.ts';
import { GENERATED_AT } from '@/data/dataset.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { LanguagePicker } from './language-picker.tsx';
import { SideDrawer } from './side-drawer.tsx';

export interface SettingsSheetProps {
    /** Which edge it comes in from; it follows the button that opens it. */
    side: 'left' | 'right';
    open: boolean;
    onClose: () => void;
}

/**
 * How the map is drawn, and in which language. Nothing about what is on it.
 *
 * The right half of a pair: the roster comes in from the left and says what is on the map, and
 * this comes in from the right and says how it is drawn. The civilization panel is the only one
 * that still rises from the foot, because it is about one thing on the map rather than about
 * the map, and it has to leave the map itself in view.
 *
 * The year used to be the first thing in here on a phone, which made the axis of the whole
 * atlas a preference — something set once and left alone — when it is the control a reader
 * touches more than any other. It lives on the rail now, at both sizes.
 */
export function SettingsSheet({ side, open, onClose }: SettingsSheetProps) {
    const { t } = useTranslation();
    const { state, dispatch } = useAtlas();
    const format = useFormat();

    return (
        <SideDrawer label={t('settings.title')} open={open} onClose={onClose} side={side} className="prefs">
            <div className="drawer__head">
                <div>
                    <h2>{t('settings.title')}</h2>
                    <p className="drawer__note">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="drawer__body">
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

                <p className="drawer__credit">
                    {t('settings.creditsBorders')}{' '}
                    <a href="https://github.com/aourednik/historical-basemaps" target="_blank" rel="noreferrer">
                        historical-basemaps
                    </a>{' '}
                    {t('settings.creditsRest', { date: format.date(GENERATED_AT.slice(0, 10)) })}
                </p>
            </div>
        </SideDrawer>
    );
}
