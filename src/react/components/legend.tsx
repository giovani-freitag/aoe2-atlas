import { Layers, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { REGION_KEYS, REGION_NAMES, type RegionKey } from '@/domain/enums/region.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { LEGEND_DETAIL_LIMIT, useAtlas } from '@/react/providers/atlas-context.ts';
import type { ColourScheme } from '@/react/hooks/use-colour-scheme.ts';
import { formatArea } from '@/react/format.ts';
import { HatchSwatch } from './hatch-swatch.tsx';

export interface LegendProps {
    /** The realms currently drawn, in draw order. */
    drawn: readonly Civilization[];
    /** How many realms the filters leave, which is what "draw everything" would put on screen. */
    drawable: number;
    scheme: ColourScheme;
}

/**
 * What each hatch on the map means, and the switch that puts every realm on it at once.
 *
 * Colour alone never carries identity here: two realms of one region wear the same hue and are
 * told apart by the angle of their hatching. Naming all of them stops working somewhere around
 * a dozen, so past that the legend names the eight regions instead and lets the map itself
 * answer "which one is this" on hover.
 */
export function Legend({ drawn, drawable, scheme }: LegendProps) {
    const { palette } = useServices();
    const { state, dispatch } = useAtlas();

    const byRegion = new Set(drawn.map((civ) => civ.region));
    const detailed = drawn.length <= LEGEND_DETAIL_LIMIT;

    // A realm is on the map because it is pinned or because it is the open one; taking it off
    // has to undo whichever of the two put it there.
    const remove = (key: string): void => {
        if (state.pinned.includes(key)) dispatch({ type: 'toggle-pin', value: key });
        if (state.selected === key) dispatch({ type: 'select', value: null });
    };

    return (
        <div className="legend">
            <div className="legend__head">
                <span className="eyebrow">
                    {drawn.length === 0 ? 'Territórios' : `${drawn.length} no mapa`}
                </span>
                {drawn.length > 0 ? (
                    <button
                        type="button"
                        onClick={() => {
                            dispatch({ type: 'clear-map' });
                        }}
                    >
                        limpar
                    </button>
                ) : null}
            </div>

            <button
                type="button"
                className="legend__all"
                data-active={state.showAll}
                aria-pressed={state.showAll}
                onClick={() => {
                    dispatch({ type: 'toggle-show-all' });
                }}
            >
                <Layers size={14} aria-hidden />
                {state.showAll ? 'Mostrando todos' : `Plotar todos (${drawable})`}
            </button>

            {drawn.length === 0 ? (
                <p className="legend__hint">
                    Ou escolha uma civilização na lista. Fixe várias e as hachuras se cruzam onde os domínios se
                    sobrepõem.
                </p>
            ) : detailed ? (
                <ul>
                    {drawn.map((civilization) => {
                        const style = palette.styleOf(civilization.key);

                        return (
                            <li key={civilization.key}>
                                <HatchSwatch style={style} scheme={scheme} size={18} />
                                <span className="legend__text">
                                    <strong>{civilization.name}</strong>
                                    <small>
                                        {REGION_NAMES[civilization.region]} ·{' '}
                                        {formatArea(civilization.territory.areaKm2)}
                                    </small>
                                </span>
                                {state.showAll ? null : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            remove(civilization.key);
                                        }}
                                        aria-label={`Tirar ${civilization.name} do mapa`}
                                    >
                                        <X size={13} aria-hidden />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <>
                    <p className="legend__hint">
                        A cor diz a região; o ângulo da hachura separa as civilizações dentro dela. Passe o mouse por
                        um marcador para nomear cada uma.
                    </p>
                    <ul className="legend__regions">
                        {REGION_KEYS.filter((region) => byRegion.has(region)).map((region) => (
                            <li key={region}>
                                <span
                                    className="legend__dot"
                                    style={{ background: palette.regionColour(region, scheme) }}
                                    aria-hidden
                                />
                                <span className="legend__text">
                                    <strong>{REGION_NAMES[region]}</strong>
                                    <small>{countIn(drawn, region)} no mapa</small>
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

function countIn(drawn: readonly Civilization[], region: RegionKey): number {
    return drawn.filter((civ) => civ.region === region).length;
}
