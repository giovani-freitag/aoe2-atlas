import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Loader, SlidersHorizontal } from 'lucide-react';
import { SLICE_YEARS } from '@/data/dataset.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { drawnRealms, useAtlas } from '@/react/providers/atlas-context.ts';
import { useEscape } from '@/react/hooks/use-escape.ts';
import { useMeasuredHeight } from '@/react/hooks/use-measured-height.ts';
import { useTimeSlice } from '@/react/hooks/use-time-slice.ts';
import { useSheetHistory } from '@/react/hooks/use-sheet-history.ts';
import { useSpecular } from '@/react/hooks/use-specular.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';
import { AtlasMap } from './atlas-map.tsx';
import { DetailSheet } from './detail-sheet.tsx';
import { EmberCanvas } from './ember-canvas.tsx';
import { LegendPanel } from './legend-panel.tsx';
import { RosterDrawer } from './roster-drawer.tsx';
import { SettingsSheet } from './settings-sheet.tsx';
import { TimelineRail } from './timeline-rail.tsx';

/** The whole interface: a map that owns the screen, with everything else sliding over it. */
export function AppShell() {
    const { t, i18n } = useTranslation();
    const { catalogue, slices } = useServices();
    const { state, dispatch } = useAtlas();
    const wide = useWideScreen();
    const [rosterOpen, setRosterOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    useSpecular('.iron');

    // The panels slide over the map, never over the header or the year rail; this is what tells
    // the stylesheet where those two end.
    const bar = useMeasuredHeight<HTMLElement>('--bar-height');
    const rail = useMeasuredHeight<HTMLDivElement>('--rail-height');

    // The document follows the language: its tag for screen readers and fonts, its title for the tab.
    const language = i18n.language;
    useEffect(() => {
        document.documentElement.lang = language;
        document.title = `${t('app.title')} — ${t('app.tagline')}`;
    }, [language, t]);

    const { slice, loading, failed } = useTimeSlice(slices, state.year);

    const borders = useMemo(() => new Map((slice?.borders ?? []).map((border) => [border.civ, border])), [slice]);

    // The language is a dependency because the names the search matches and sorts by live in it.
    const listed = useMemo(
        () => catalogue.search({ text: state.query, expansions: state.expansions, order: state.order }),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the language changes what search returns
        [catalogue, state.query, state.expansions, state.order, language],
    );

    const standing = useMemo(() => listed.filter((civ) => borders.has(civ.key)), [listed, borders]);
    const drawn = useMemo(() => drawnRealms(state, standing), [state, standing]);
    const focused = state.focused ? catalogue.find(state.focused) : null;

    const closeSheet = useCallback(() => {
        dispatch({ type: 'focus', value: null });
    }, [dispatch]);

    const closeSettings = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    const toggleSettings = useCallback(() => {
        setSettingsOpen((open) => !open);
    }, []);

    /*
     * Escape closes whatever is on top: the settings float over the detail, so they go first and
     * a second press reaches the sheet underneath. Without the order, one key would clear both.
     */
    /*
     * The open civilization is a history entry, so the phone's Back gesture closes the sheet and
     * pulls the map back out to the world — which is what Back means to anyone holding a phone.
     */
    useSheetHistory(state.focused !== null, closeSheet);

    useEscape(
        useCallback(() => {
            if (settingsOpen) {
                setSettingsOpen(false);

                return;
            }

            closeSheet();
        }, [settingsOpen, closeSheet]),
    );

    const setYear = useCallback(
        (year: number) => {
            dispatch({ type: 'year', value: year });
        },
        [dispatch],
    );

    return (
        <div className="shell">
            <header className="bar leather" ref={bar}>
                <EmberCanvas className="bar__embers" density={0.7} wind={0.6} />

                {/* Wide, the roster is already a column of the grid, so the handle that opens it would open nothing. */}
                {wide ? null : (
                    <button
                        type="button"
                        className="bar__button iron riveted"
                        onClick={() => {
                            setRosterOpen(true);
                        }}
                        aria-label={t('app.openRoster')}
                    >
                        <List size={20} aria-hidden />
                    </button>
                )}

                <div className="bar__brand">
                    <img src={`${import.meta.env.BASE_URL}brand.svg`} alt="" width={26} height={26} />
                    <div>
                        <h1>{t('app.title')}</h1>
                        <p>{t('app.tagline')}</p>
                    </div>
                </div>

                <span className="bar__spacer" />

                {loading ? (
                    <span className="bar__loading" role="status">
                        <Loader size={16} aria-hidden />
                        <span className="sr-only">{t('app.loading')}</span>
                    </span>
                ) : null}

                {/*
                 * Three questions, three places. Who is on the left, behind the roster; how the
                 * world is drawn is here on the right; and when — the axis every reading on the
                 * map is qualified by — is along the foot, always out and never behind a panel.
                 */}
                <button
                    type="button"
                    className="bar__button iron"
                    aria-expanded={settingsOpen}
                    onClick={toggleSettings}
                    aria-label={t(settingsOpen ? 'app.closeSettings' : 'app.openSettings')}
                >
                    <SlidersHorizontal size={18} aria-hidden />
                </button>
            </header>

            <main className="stage">
                <AtlasMap standing={standing} drawn={drawn} borders={borders} />
                <LegendPanel drawn={drawn} borders={borders} />
                {failed ? <p className="stage__error">{t('errors.slice')}</p> : null}
            </main>

            <RosterDrawer
                civilizations={listed}
                borders={borders}
                open={rosterOpen}
                onClose={() => {
                    setRosterOpen(false);
                }}
            />

            {focused ? (
                <DetailSheet
                    civilization={focused}
                    border={borders.get(focused.key) ?? null}
                    frontiers={slice?.frontiers ?? []}
                    onClose={closeSheet}
                />
            ) : null}

            <SettingsSheet open={settingsOpen} onClose={closeSettings} />

            {/*
             * The same instrument at both sizes, because the year is not a preference.
             *
             * It used to shrink to a bare reading on a phone and hand the slider to the settings
             * panel, which put the map's only axis two taps inside a sheet about how the world
             * is drawn — while the filters, which a reader touches far less often, had a drawer
             * to themselves. On a phone the arrows come out, and that is the whole difference.
             */}
            <div className="rail leather" ref={rail}>
                <TimelineRail
                    civilizations={catalogue.all()}
                    years={SLICE_YEARS}
                    year={state.year}
                    loading={loading}
                    stepping={!wide}
                    onChange={setYear}
                />
            </div>
        </div>
    );
}
