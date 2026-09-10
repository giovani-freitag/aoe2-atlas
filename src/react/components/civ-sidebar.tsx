import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { AtlasOrder } from '@/services/atlas/atlas-service.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useServices } from '@/react/providers/services-context.ts';
import type { ColourScheme } from '@/react/hooks/use-colour-scheme.ts';
import { formatYear } from '@/react/format.ts';
import { CivRow } from './civ-row.tsx';

const ORDERS: readonly { key: AtlasOrder; label: string }[] = [
    { key: 'name', label: 'Nome' },
    { key: 'area', label: 'Área' },
    { key: 'year', label: 'Época' },
    { key: 'expansion', label: 'DLC' },
];

export interface CivSidebarProps {
    /** The civilizations the current filters leave, already ordered. */
    civilizations: readonly Civilization[];
    scheme: ColourScheme;
}

/** Search, filters, and the list every other part of the atlas follows. */
export function CivSidebar({ civilizations, scheme }: CivSidebarProps) {
    const { atlas, palette } = useServices();
    const { state, dispatch } = useAtlas();

    const largest = useMemo(
        () => Math.max(1, ...civilizations.map((civ) => civ.territory.areaKm2)),
        [civilizations],
    );

    // The timeline dims rather than hides, so the count is the only place the year shows its work.
    const standingCount = useMemo(
        () => (state.year === null ? 0 : civilizations.filter((civ) => civ.standingIn(state.year ?? 0)).length),
        [civilizations, state.year],
    );

    return (
        <aside className="sidebar">
            <div className="sidebar__search">
                <Search size={15} aria-hidden />
                <input
                    type="search"
                    value={state.query}
                    placeholder="Civilização, monumento, cidade…"
                    aria-label="Buscar civilização"
                    onChange={(event) => {
                        dispatch({ type: 'query', value: event.target.value });
                    }}
                />
                {state.query ? (
                    <button
                        type="button"
                        onClick={() => {
                            dispatch({ type: 'query', value: '' });
                        }}
                        aria-label="Limpar busca"
                    >
                        <X size={14} aria-hidden />
                    </button>
                ) : null}
            </div>

            <div className="sidebar__orders" role="group" aria-label="Ordenar por">
                {ORDERS.map((order) => (
                    <button
                        key={order.key}
                        type="button"
                        data-active={state.order === order.key}
                        onClick={() => {
                            dispatch({ type: 'order', value: order.key });
                        }}
                    >
                        {order.label}
                    </button>
                ))}
            </div>

            <div className="sidebar__expansions">
                <div className="sidebar__expansions-head">
                    <span className="eyebrow">Expansão</span>
                    {state.expansions.length > 0 ? (
                        <button
                            type="button"
                            className="sidebar__clear"
                            onClick={() => {
                                dispatch({ type: 'clear-expansions' });
                            }}
                        >
                            limpar
                        </button>
                    ) : null}
                </div>
                <div className="chips">
                    {EXPANSION_RECORDS.map((expansion) => (
                        <button
                            key={expansion.key}
                            type="button"
                            className="chip"
                            data-active={state.expansions.includes(expansion.key)}
                            data-upcoming={!expansion.released}
                            title={`${expansion.name} · ${expansion.releasedOn.slice(0, 4)}${expansion.released ? '' : ' (a lançar)'}`}
                            aria-pressed={state.expansions.includes(expansion.key)}
                            onClick={() => {
                                dispatch({ type: 'toggle-expansion', value: expansion.key });
                            }}
                        >
                            {expansion.shortName}
                        </button>
                    ))}
                </div>
            </div>

            <p className="sidebar__count">
                {civilizations.length} de {atlas.all().length} civilizações
                {state.year !== null ? <> · {standingCount} em cena em {formatYear(state.year)}</> : null}
            </p>

            <ul className="sidebar__list">
                {civilizations.map((civilization) => (
                    <CivRow
                        key={civilization.key}
                        civilization={civilization}
                        style={palette.styleOf(civilization.key)}
                        scheme={scheme}
                        share={civilization.territory.areaKm2 / largest}
                        selected={state.selected === civilization.key}
                        pinned={state.pinned.includes(civilization.key)}
                        faded={state.year !== null && !civilization.standingIn(state.year)}
                        onSelect={(key) => {
                            dispatch({ type: 'select', value: state.selected === key ? null : key });
                        }}
                        onTogglePin={(key) => {
                            dispatch({ type: 'toggle-pin', value: key });
                        }}
                        onHover={(key) => {
                            dispatch({ type: 'hover', value: key });
                        }}
                    />
                ))}
            </ul>
        </aside>
    );
}
