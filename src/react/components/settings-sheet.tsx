import { useTranslation } from 'react-i18next';
import { Grid2x2 } from 'lucide-react';
import { PROJECTION_KEYS, PROJECTIONS } from '@/domain/enums/projection.ts';
import { GENERATED_AT } from '@/data/dataset.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { LanguagePicker } from './language-picker.tsx';
import { SideDrawer } from './side-drawer.tsx';

/** GitHub's own mark, drawn rather than fetched, since lucide carries no brand icons. */
const OCTOCAT =
    'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z';

/** `owner/name`, which is what a reader recognises; the full address is on the link itself. */
const REPOSITORY = __APP_REPOSITORY__.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\.git$/, '');

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

                {/*
                 * The version is the useful half of this link: it is what tells a reader whether
                 * what they are looking at is the build an issue was written against.
                 */}
                <a
                    className="drawer__project"
                    href={__APP_REPOSITORY__}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('settings.project', { version: __APP_VERSION__ })}
                >
                    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden focusable="false">
                        <path d={OCTOCAT} fill="currentColor" />
                    </svg>
                    <span>{REPOSITORY}</span>
                    <small>{__APP_VERSION__}</small>
                </a>

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
