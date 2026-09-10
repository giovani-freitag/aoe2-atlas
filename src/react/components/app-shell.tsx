import { useCallback, useMemo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useServices } from '@/react/providers/services-context.ts';
import { drawnRealms, useAtlas } from '@/react/providers/atlas-context.ts';
import { useColourScheme } from '@/react/hooks/use-colour-scheme.ts';
import { useEscape } from '@/react/hooks/use-escape.ts';
import { GENERATED_AT } from '@/data/dataset.ts';
import { AtlasMap } from './atlas-map.tsx';
import { CivSidebar } from './civ-sidebar.tsx';
import { CivDetail } from './civ-detail.tsx';
import { Legend } from './legend.tsx';
import { Timeline } from './timeline.tsx';

/** The whole interface: list on the left, map in the middle, whatever is chosen on the right. */
export function AppShell() {
    const { atlas } = useServices();
    const { state, dispatch } = useAtlas();
    const { scheme, chosen, choose } = useColourScheme();

    const visible = useMemo(
        () =>
            atlas.search({
                text: state.query,
                expansions: state.expansions,
                order: state.order,
            }),
        [atlas, state.query, state.expansions, state.order],
    );

    const range = useMemo(() => atlas.yearRange(), [atlas]);
    const drawn = useMemo(() => drawnRealms(state, visible), [state, visible]);

    useEscape(
        useCallback(() => {
            dispatch({ type: 'select', value: null });
        }, [dispatch]),
    );

    const selected = state.selected ? atlas.find(state.selected) : null;

    return (
        <div className="shell">
            <header className="shell__bar">
                <div className="shell__brand">
                    <img src={`${import.meta.env.BASE_URL}brand.svg`} alt="" width={26} height={26} />
                    <div>
                        <h1>AoE2 Atlas</h1>
                        <p>Maravilhas e territórios de Age of Empires II</p>
                    </div>
                </div>

                <Timeline
                    civilizations={atlas.all()}
                    from={range.from}
                    to={range.to}
                    year={state.year}
                    onChange={(year) => {
                        dispatch({ type: 'year', value: year });
                    }}
                />

                <button
                    type="button"
                    className="shell__theme"
                    onClick={() => {
                        choose(scheme === 'dark' ? 'light' : 'dark');
                    }}
                    aria-label={`Mudar para o tema ${scheme === 'dark' ? 'claro' : 'escuro'}`}
                    title={chosen ? 'Tema escolhido' : 'Seguindo o sistema'}
                >
                    {scheme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
                </button>
            </header>

            <div className="shell__body">
                <CivSidebar civilizations={visible} scheme={scheme} />

                <main className="shell__map">
                    <AtlasMap visible={visible} drawn={drawn} scheme={scheme} />
                    <Legend drawn={drawn} drawable={visible.length} scheme={scheme} />
                </main>

                <div className="shell__panel" data-open={selected !== null}>
                    {selected ? <CivDetail civilization={selected} scheme={scheme} /> : null}
                </div>
            </div>

            <footer className="shell__foot">
                <span>
                    Fronteiras de{' '}
                    <a href="https://github.com/aourednik/historical-basemaps" target="_blank" rel="noreferrer">
                        aourednik/historical-basemaps
                    </a>{' '}
                    (GPL-3.0) · costa de Natural Earth (domínio público) · maravilhas e emblemas conferidos na Age of
                    Empires Series Wiki
                </span>
                <span className="numeric">geometria de {GENERATED_AT.slice(0, 10)}</span>
            </footer>
        </div>
    );
}
