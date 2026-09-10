import { Layers, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { REGION_KEYS, REGION_NAMES, type RegionKey } from '@/domain/enums/region.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { LEGEND_DETAIL_LIMIT, useAtlas } from '@/react/providers/atlas-context.ts';
import { formatArea, formatYear } from '@/react/format.ts';
import { HatchSwatch } from './hatch-swatch.tsx';

export interface LegendPanelProps {
    /** The realms currently drawn, in draw order. */
    drawn: readonly Civilization[];
    borders: ReadonlyMap<string, RealmBorder>;
    /** How many realms stood in this century, which is what "draw everything" would show. */
    standingCount: number;
}

/**
 * What each hatch on the map means, and the switch that puts every realm of the century on it.
 *
 * Colour alone never carries identity: two realms of one region wear the same hue and are told
 * apart by the angle of their hatching. Naming all of them stops working somewhere around a
 * dozen, so past that the legend names the eight regions and lets the map answer "which one is
 * this" on tap.
 */
export function LegendPanel({ drawn, borders, standingCount }: LegendPanelProps) {
    const { palette } = useServices();
    const { state, dispatch } = useAtlas();

    const detailed = drawn.length <= LEGEND_DETAIL_LIMIT;
    const regionsOnMap = new Set(drawn.map((civ) => civ.region));

    const remove = (key: string): void => {
        if (state.pinned.includes(key)) dispatch({ type: 'toggle-pin', value: key });
        if (state.focused === key) dispatch({ type: 'focus', value: null });
    };

    // With nothing drawn the panel is one button: a header and a paragraph explaining an empty
    // list would cover a quarter of a phone screen to say nothing.
    if (drawn.length === 0) {
        return (
            <div className="legend legend--bare leather stitched">
                <button
                    type="button"
                    className="legend__all iron"
                    onClick={() => {
                        dispatch({ type: 'toggle-show-all' });
                    }}
                >
                    <Layers size={15} aria-hidden />
                    Traçar os {standingCount} de {formatYear(state.year)}
                </button>
            </div>
        );
    }

    return (
        <div className="legend leather stitched">
            <div className="legend__head">
                <span className="eyebrow">{drawn.length} no mapa</span>
                <button
                    type="button"
                    onClick={() => {
                        dispatch({ type: 'clear-map' });
                    }}
                >
                    limpar
                </button>
            </div>

            <button
                type="button"
                className="legend__all iron"
                data-active={state.showAll}
                aria-pressed={state.showAll}
                onClick={() => {
                    dispatch({ type: 'toggle-show-all' });
                }}
            >
                <Layers size={15} aria-hidden />
                {state.showAll ? 'Mostrando todos' : `Traçar os ${standingCount} de ${formatYear(state.year)}`}
            </button>

            {detailed ? (
                <ul>
                    {drawn.map((civilization) => {
                        const border = borders.get(civilization.key);

                        return (
                            <li key={civilization.key}>
                                <HatchSwatch style={palette.styleOf(civilization.key)} size={18} />
                                <span className="legend__text">
                                    <strong>{civilization.name}</strong>
                                    <small>
                                        {REGION_NAMES[civilization.region]}
                                        {border ? ` · ${formatArea(border.areaKm2)}` : ''}
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
                                        <X size={14} aria-hidden />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <>
                    <p className="legend__hint">
                        A cor diz a região; o ângulo da hachura separa as civilizações dentro dela.
                    </p>
                    <ul className="legend__regions">
                        {REGION_KEYS.filter((region) => regionsOnMap.has(region)).map((region) => (
                            <li key={region}>
                                <span
                                    className="legend__dot"
                                    style={{ background: palette.regionColour(region) }}
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
