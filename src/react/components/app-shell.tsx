import { useCallback, useMemo, useState } from 'react';
import { List, Loader, SlidersHorizontal } from 'lucide-react';
import { useServices } from '@/react/providers/services-context.ts';
import { drawnRealms, useAtlas } from '@/react/providers/atlas-context.ts';
import { useEscape } from '@/react/hooks/use-escape.ts';
import { useTimeSlice } from '@/react/hooks/use-time-slice.ts';
import { useSpecular } from '@/react/hooks/use-specular.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';
import { AtlasMap } from './atlas-map.tsx';
import { DetailSheet } from './detail-sheet.tsx';
import { EmberCanvas } from './ember-canvas.tsx';
import { LegendPanel } from './legend-panel.tsx';
import { RosterDrawer } from './roster-drawer.tsx';
import { SettingsSheet } from './settings-sheet.tsx';
import { TimelineRail } from './timeline-rail.tsx';
import { YearStepper } from './year-stepper.tsx';

/** The whole interface: a map that owns the screen, with everything else sliding over it. */
export function AppShell() {
    const { catalogue, slices } = useServices();
    const { state, dispatch } = useAtlas();
    const wide = useWideScreen();
    const [rosterOpen, setRosterOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    useSpecular('.iron');

    const { slice, loading, error } = useTimeSlice(slices, state.year);
    const sliceYear = slices.sliceYearFor(state.year);

    const borders = useMemo(() => new Map((slice?.borders ?? []).map((border) => [border.civ, border])), [slice]);

    const listed = useMemo(
        () => catalogue.search({ text: state.query, expansions: state.expansions, order: state.order }),
        [catalogue, state.query, state.expansions, state.order],
    );

    const standing = useMemo(() => listed.filter((civ) => borders.has(civ.key)), [listed, borders]);
    const drawn = useMemo(() => drawnRealms(state, standing), [state, standing]);
    const range = useMemo(() => catalogue.yearRange(), [catalogue]);
    const focused = state.focused ? catalogue.find(state.focused) : null;

    const closeSheet = useCallback(() => {
        dispatch({ type: 'focus', value: null });
    }, [dispatch]);

    const closeSettings = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    useEscape(closeSheet);

    const setYear = useCallback(
        (year: number) => {
            dispatch({ type: 'year', value: year });
        },
        [dispatch],
    );

    return (
        <div className="shell">
            <header className="bar leather">
                <EmberCanvas className="bar__embers" density={0.7} wind={0.6} />

                <button
                    type="button"
                    className="bar__button iron riveted"
                    onClick={() => {
                        setRosterOpen(true);
                    }}
                    aria-label="Abrir a lista de civilizações"
                >
                    <List size={20} aria-hidden />
                </button>

                <div className="bar__brand">
                    <img src={`${import.meta.env.BASE_URL}brand.svg`} alt="" width={26} height={26} />
                    <div>
                        <h1>AoE2 Atlas</h1>
                        <p>Maravilhas e territórios, século a século</p>
                    </div>
                </div>

                <span className="bar__spacer" />

                {loading ? (
                    <span className="bar__loading" role="status">
                        <Loader size={16} aria-hidden />
                        <span className="sr-only">Carregando o século</span>
                    </span>
                ) : null}

                {wide ? (
                    <button
                        type="button"
                        className="bar__button iron"
                        onClick={() => {
                            setSettingsOpen(true);
                        }}
                        aria-label="Abrir os ajustes do mapa"
                    >
                        <SlidersHorizontal size={18} aria-hidden />
                    </button>
                ) : null}
            </header>

            <main className="stage">
                <AtlasMap standing={standing} drawn={drawn} borders={borders} />
                <LegendPanel drawn={drawn} borders={borders} standingCount={standing.length} />
                {error ? <p className="stage__error">{error}</p> : null}
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

            <SettingsSheet
                civilizations={catalogue.all()}
                from={range.from}
                to={range.to}
                sliceYear={sliceYear}
                loading={loading}
                open={settingsOpen}
                onClose={closeSettings}
            />

            {/*
             * The rail keeps the full instrument where there is room for it, and shrinks to the
             * reading alone on a phone, where a histogram and a slider would be fighting the map
             * for the bottom of the screen.
             */}
            <div className="rail leather">
                {wide ? (
                    <TimelineRail
                        civilizations={catalogue.all()}
                        from={range.from}
                        to={range.to}
                        year={state.year}
                        sliceYear={sliceYear}
                        loading={loading}
                        onChange={setYear}
                    />
                ) : (
                    <YearStepper
                        from={range.from}
                        to={range.to}
                        year={state.year}
                        sliceYear={sliceYear}
                        loading={loading}
                        onChange={setYear}
                        onOpenSettings={() => {
                            setSettingsOpen(true);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
