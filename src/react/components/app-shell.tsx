import { useCallback, useMemo, useState } from 'react';
import { List, Loader } from 'lucide-react';
import { EmberCanvas } from './ember-canvas.tsx';
import { useServices } from '@/react/providers/services-context.ts';
import { drawnRealms, useAtlas } from '@/react/providers/atlas-context.ts';
import { useEscape } from '@/react/hooks/use-escape.ts';
import { useTimeSlice } from '@/react/hooks/use-time-slice.ts';
import { useSpecular } from '@/react/hooks/use-specular.ts';
import { GENERATED_AT } from '@/data/dataset.ts';
import { AtlasMap } from './atlas-map.tsx';
import { DetailSheet } from './detail-sheet.tsx';
import { LegendPanel } from './legend-panel.tsx';
import { RosterDrawer } from './roster-drawer.tsx';
import { TimelineRail } from './timeline-rail.tsx';

/** The whole interface: a map that owns the screen, with everything else sliding over it. */
export function AppShell() {
    const { catalogue, slices } = useServices();
    const { state, dispatch } = useAtlas();
    const [rosterOpen, setRosterOpen] = useState(false);

    useSpecular('.iron');

    const { slice, loading, error } = useTimeSlice(slices, state.year);
    const sliceYear = slices.sliceYearFor(state.year);

    const borders = useMemo(
        () => new Map((slice?.borders ?? []).map((border) => [border.civ, border])),
        [slice],
    );

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

    useEscape(closeSheet);

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

            <div className="rail leather">
                <TimelineRail
                    civilizations={catalogue.all()}
                    from={range.from}
                    to={range.to}
                    year={state.year}
                    sliceYear={sliceYear}
                    loading={loading}
                    onChange={(year) => {
                        dispatch({ type: 'year', value: year });
                    }}
                />
                <p className="rail__credit">
                    Fronteiras de{' '}
                    <a href="https://github.com/aourednik/historical-basemaps" target="_blank" rel="noreferrer">
                        historical-basemaps
                    </a>{' '}
                    · costa de Natural Earth · <span className="numeric">{GENERATED_AT.slice(0, 10)}</span>
                </p>
            </div>
        </div>
    );
}
