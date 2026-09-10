import { Grid2x2 } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { PROJECTION_KEYS, PROJECTIONS } from '@/domain/enums/projection.ts';
import { GENERATED_AT } from '@/data/dataset.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
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
 * How the map is drawn, and — on a phone — which year it is drawn for.
 *
 * The time control lives here on narrow screens because the histogram and slider crowd the
 * bottom of a phone; the rail outside keeps only the reading. On a wide screen the rail keeps
 * the full instrument and this panel is just the projection and the ruling.
 */
export function SettingsSheet({ civilizations, from, to, sliceYear, loading, open, onClose }: SettingsSheetProps) {
    const { state, dispatch } = useAtlas();
    const wide = useWideScreen();

    return (
        <BottomSheet
            label="Ajustes do mapa"
            open={open}
            onClose={onClose}
            wide="float"
            head={
                <div>
                    <h2>Ajustes</h2>
                    <p className="sheet__region">Como o mundo é desenhado</p>
                </div>
            }
        >
            {wide ? null : (
                <section className="card parchment singed">
                    <h3 className="eyebrow">Ano</h3>
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

            <section className="card parchment singed">
                <h3 className="eyebrow">Projeção</h3>
                <p className="card__hint">
                    Nenhuma projeção é neutra. As áreas nos painéis são medidas na esfera quando os dados são gerados,
                    então trocar aqui muda o desenho e nenhum número.
                </p>
                <div className="options" role="radiogroup" aria-label="Projeção">
                    {PROJECTION_KEYS.map((key) => {
                        const profile = PROJECTIONS[key];

                        return (
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
                                    {profile.name}
                                    <small>preserva {profile.preserves}</small>
                                </span>
                                <span className="options__caveat">{profile.caveat}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="card parchment singed">
                <h3 className="eyebrow">Carta</h3>
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
                    <span>Linhas de rumo, equador e trópicos</span>
                    <span className="switch__track" aria-hidden>
                        <span className="switch__knob" />
                    </span>
                </button>
            </section>

            <p className="sheet__credit">
                Fronteiras de{' '}
                <a href="https://github.com/aourednik/historical-basemaps" target="_blank" rel="noreferrer">
                    historical-basemaps
                </a>{' '}
                (GPL-3.0) · costa de Natural Earth · maravilhas e emblemas da Age of Empires Series Wiki · geometria
                de <span className="numeric">{GENERATED_AT.slice(0, 10)}</span>
            </p>
        </BottomSheet>
    );
}
