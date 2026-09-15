import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListFilter, Loader, SlidersHorizontal } from 'lucide-react';
import { SLICE_YEARS } from '@/data/dataset.ts';
import { useCatalogue } from '@/react/hooks/services/use-catalogue.ts';
import { useAtlasView } from '@/react/hooks/view/use-atlas-view.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useAddress } from '@/react/hooks/dom/use-address.ts';
import { useEscape } from '@/react/hooks/dom/use-escape.ts';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { useMeasuredHeight, useMeasuredWidth } from '@/react/hooks/dom/use-measured-height.ts';
import { useSheetHistory } from '@/react/hooks/dom/use-sheet-history.ts';
import { useSpecular } from '@/react/hooks/dom/use-specular.ts';
import { useAtLeast } from '@/react/hooks/dom/use-breakpoint.ts';
import { AtlasMap } from './atlas-map.tsx';
import { CivDeck } from './civ-deck.tsx';
import { DetailSheet } from './detail-sheet.tsx';
import { EmberCanvas } from './ember-canvas.tsx';
import { LegendPanel } from './legend-panel.tsx';
import { RosterDrawer } from './roster-drawer.tsx';
import { TimelineRail } from './timeline-rail.tsx';

/*
 * How the world is drawn is a question a reader asks once a session, if at all, and the panel
 * that answers it carries the heaviest controls in the atlas — the language list alone brings
 * the whole floating layer with it. None of that is fetched until the panel is first opened.
 */
const SettingsSheet = lazy(() =>
    import('./settings-sheet.tsx').then((module) => ({ default: module.SettingsSheet })),
);

/** The whole interface: a map that owns the screen, with everything else sliding over it. */
export function AppShell() {
    const { t, i18n } = useTranslation();
    const catalogue = useCatalogue();
    const format = useFormat();
    const { state, dispatch } = useAtlas();
    const { listed, standing, drawn, borders, focused, focusedName, slice, loading, failed } = useAtlasView();
    const roomForPanel = useAtLeast('md');

    /*
     * The way into the filters goes when the filters are already out, and not a step before.
     * Tied to the wrong step it left a band of widths — a tablet's — where the button had gone
     * and the list had not yet arrived, and the filters could not be reached at all.
     */
    const rosterStaysOut = useAtLeast('lg');
    const [rosterOpen, setRosterOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsEverOpened, setSettingsEverOpened] = useState(false);

    useSpecular('.iron');

    // The address bar is always a link to what is on the map: the year, the open realm, the pins.
    useAddress(state);

    // The panels slide over the map, never over the header or the year rail; this is what tells
    // the stylesheet where those two end.
    const bar = useMeasuredHeight<HTMLElement>('--bar-height');
    const rail = useMeasuredHeight<HTMLDivElement>('--rail-height');

    // On a phone the bar is a pill floating over the map, and the legend stands beside it.
    const brand = useMeasuredWidth<HTMLDivElement>('--brand-width');

    // The document's language tag follows the reader's, for screen readers, hyphenation and fonts.
    const language = i18n.language;
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    /*
     * The title says what is on the map, in the reader's language.
     *
     * At rest it names the game — none of the seventeen taglines did, so the title that gets
     * indexed, which is this one and not the one index.html served, used to be missing the one
     * phrase every search for this thing contains. With a civilization open it names that
     * civilization and the year instead: a link to "the Byzantines in 800" now says so in the
     * tab, in the history, and in the text the share sheet offers alongside the address.
     */
    const yearLabel = format.year(state.year);
    useEffect(() => {
        const subject = focusedName ? t('app.focusedTitle', { name: focusedName, year: yearLabel }) : t('app.documentTitle');

        document.title = `${subject} — ${t('app.title')}`;
    }, [focusedName, yearLabel, t]);

    const closeSheet = useCallback(() => {
        dispatch({ type: 'focus', value: null });
    }, [dispatch]);

    const closeSettings = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    const toggleSettings = useCallback(() => {
        setSettingsEverOpened(true);
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
                <div className="bar__brand" ref={brand}>
                    {/* On a phone the name beside it is hidden, so the mark carries it on hover. */}
                    <img
                        src={`${import.meta.env.BASE_URL}brand.svg`}
                        alt=""
                        title={t('app.title')}
                        width={26}
                        height={26}
                    />
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
                 * Three questions, three places, and the same three at every width. How the world
                 * is drawn comes in from the left; what is on it comes in from the right; and
                 * when — the axis every reading on the map is qualified by — is along the foot,
                 * always out and never behind a panel.
                 */}
                <button
                    type="button"
                    className="bar__button bar__settings iron"
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
                side="right"
                open={rosterOpen}
                onClose={() => {
                    setRosterOpen(false);
                }}
            />

            {/* On a phone a civilization is a bar over the year rail, not a sheet over the map. */}
            {focused ? (
                roomForPanel ? (
                    <DetailSheet
                        civilization={focused}
                        border={borders.get(focused.key) ?? null}
                        frontiers={slice?.frontiers ?? []}
                        onClose={closeSheet}
                    />
                ) : (
                    <CivDeck
                        civilization={focused}
                        border={borders.get(focused.key) ?? null}
                        frontiers={slice?.frontiers ?? []}
                        onClose={closeSheet}
                    />
                )
            ) : null}

            {/* Kept mounted once opened, so closing it can still slide out. */}
            {settingsEverOpened ? (
                <Suspense fallback={null}>
                    <SettingsSheet side="left" open={settingsOpen} onClose={closeSettings} />
                </Suspense>
            ) : null}

            {/*
             * The same instrument at both sizes, because the year is not a preference.
             *
             * It used to shrink to a bare reading on a phone and hand the slider to the settings
             * panel, which put the map's only axis two taps inside a sheet about how the world
             * is drawn — while the filters, which a reader touches far less often, had a drawer
             * to themselves. On a phone the arrows come out, and that is the whole difference.
             */}
            <div className="rail leather" ref={rail}>
                {/*
                 * Something is burning below the screen.
                 *
                 * The embers used to be tied to the year's handle, which made them a decoration
                 * on a control: they moved when it moved, and a fire that follows a slider is a
                 * fidget rather than a hearth. Loosed across the rail they read as what they are,
                 * a light thrown up from under the last band of the atlas with sparks straying
                 * into it.
                 */}
                <EmberCanvas className="rail__embers" density={1.6} wind={0.7} />

                <TimelineRail
                    civilizations={catalogue.all()}
                    years={SLICE_YEARS}
                    year={state.year}
                    loading={loading}
                    stepping={!roomForPanel}
                    onChange={setYear}
                    trailing={
                        rosterStaysOut ? null : (
                            <button
                                type="button"
                                className="rail-body__step iron riveted"
                                onClick={() => {
                                    setRosterOpen(true);
                                }}
                                aria-label={t('app.openRoster')}
                            >
                                <ListFilter size={18} aria-hidden />
                            </button>
                        )
                    }
                />
            </div>
        </div>
    );
}
