import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import type { CatalogueOrder } from '@/services/atlas/catalogue-service.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';
import { CivRow } from './civ-row.tsx';
import { SideDrawer } from './side-drawer.tsx';

const ORDERS: readonly CatalogueOrder[] = ['name', 'area', 'year', 'expansion'];

export interface RosterDrawerProps {
    /** Every civilization the filters leave, whether or not it stood in the year on the rail. */
    civilizations: readonly Civilization[];
    borders: ReadonlyMap<string, RealmBorder>;
    /** Which edge it comes in from; it follows the button that opens it. */
    side: 'left' | 'right';
    open: boolean;
    onClose: () => void;
}

/**
 * The roster: what is on the map, offcanvas from the left and docked as a column where there is
 * room for one.
 *
 * It is the left half of a pair. Everything about choosing *what* is drawn lives here — the
 * search, the sort, the expansions, the fifty-six of them — and everything about *how* it is
 * drawn comes in from the other side.
 */
export function RosterDrawer({ civilizations, borders, side, open, onClose }: RosterDrawerProps) {
    const { t } = useTranslation();
    const { palette } = useServices();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const wide = useWideScreen();

    const largest = useMemo(
        () => Math.max(1, ...[...borders.values()].map((border) => border.areaKm2)),
        [borders],
    );

    const standingCount = civilizations.filter((civ) => borders.has(civ.key)).length;

    return (
        <SideDrawer label={t('roster.title')} open={open} onClose={onClose} side={side} pinnedWhenWide className="roster">
            <div className="drawer__head">
                <h2>{t('roster.title')}</h2>
            </div>

            <div className="roster__filters">
                <div className="field iron">
                    <Search size={16} aria-hidden />
                    <input
                        type="search"
                        value={state.query}
                        placeholder={t('roster.placeholder')}
                        aria-label={t('roster.search')}
                        onChange={(event) => {
                            dispatch({ type: 'query', value: event.target.value });
                        }}
                    />
                </div>

                <div className="segmented oak" role="group" aria-label={t('roster.orderBy')}>
                    {ORDERS.map((order) => (
                        <button
                            key={order}
                            type="button"
                            data-active={state.order === order}
                            onClick={() => {
                                dispatch({ type: 'order', value: order });
                            }}
                        >
                            {t(`roster.order.${order}`)}
                        </button>
                    ))}
                </div>

                <div className="chips">
                    {EXPANSION_RECORDS.map((expansion) => (
                        <button
                            key={expansion.key}
                            type="button"
                            className="chip"
                            data-active={state.expansions.includes(expansion.key)}
                            data-upcoming={!expansion.released}
                            title={`${expansion.name} · ${expansion.releasedOn.slice(0, 4)}`}
                            aria-pressed={state.expansions.includes(expansion.key)}
                            onClick={() => {
                                dispatch({ type: 'toggle-expansion', value: expansion.key });
                            }}
                        >
                            {expansion.shortName}
                        </button>
                    ))}
                </div>

                <p className="roster__count">
                    {t('roster.count', {
                        standing: standingCount,
                        year: format.year(state.year),
                        listed: civilizations.length,
                    })}
                </p>
            </div>

            <ul className="roster__list">
                {civilizations.map((civilization) => (
                    <CivRow
                        key={civilization.key}
                        civilization={civilization}
                        style={palette.styleOf(civilization.key)}
                        border={borders.get(civilization.key) ?? null}
                        share={(borders.get(civilization.key)?.areaKm2 ?? 0) / largest}
                        focused={state.focused === civilization.key}
                        pinned={state.pinned.includes(civilization.key)}
                        onOpen={(key) => {
                            dispatch({ type: 'focus', value: state.focused === key ? null : key });
                            if (!wide) onClose();
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

            {/*
             * The way out of the map and into the table.
             *
             * The atlas answers "where was this realm in 1200" and refuses to answer "which
             * centuries is it drawn in at all" without nineteen drags of the rail. That question
             * has a page, built from these same files; it is written in English only, which the
             * label says in the other sixteen languages rather than leaving as a surprise. The
             * address goes through BASE_URL because the page is a build artefact and does not
             * exist under `npm run dev`.
             */}
            <a className="roster__more" href={`${import.meta.env.BASE_URL}civilizations/`} hrefLang="en">
                {t('roster.everyCivilization')}
            </a>
        </SideDrawer>
    );
}
