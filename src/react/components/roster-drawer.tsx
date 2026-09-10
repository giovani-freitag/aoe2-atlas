import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
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

const ORDERS: readonly CatalogueOrder[] = ['name', 'area', 'year', 'expansion'];

export interface RosterDrawerProps {
    /** Every civilization the filters leave, whether or not it stood in the year on the rail. */
    civilizations: readonly Civilization[];
    borders: ReadonlyMap<string, RealmBorder>;
    open: boolean;
    onClose: () => void;
}

/**
 * The roster, offcanvas from the left on a phone and docked as a column when there is room.
 *
 * It is one `dialog` either way. Narrow, it opens modally so the focus cannot wander onto the
 * map behind it and Escape closes it; wide, it opens without a modal and CSS pulls it back into
 * the grid. Two behaviours, one element, no duplicated markup.
 */
export function RosterDrawer({ civilizations, borders, open, onClose }: RosterDrawerProps) {
    const { t } = useTranslation();
    const { palette } = useServices();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const wide = useWideScreen();
    const dialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const element = dialog.current;
        if (!element) return;

        const shouldOpen = wide || open;
        if (shouldOpen === element.open) return;

        if (!shouldOpen) {
            element.close();

            return;
        }

        if (wide) element.show();
        else element.showModal();
    }, [wide, open]);

    const largest = useMemo(
        () => Math.max(1, ...[...borders.values()].map((border) => border.areaKm2)),
        [borders],
    );

    const standingCount = civilizations.filter((civ) => borders.has(civ.key)).length;

    /*
     * A dialog does not close when the backdrop is clicked, so the click lands on the dialog
     * element itself and the box tells us whether it was inside the panel. This is what lets
     * the drawer go without a close button: tap anywhere off it, or press Escape.
     */
    const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>): void => {
        if (wide || event.target !== event.currentTarget) return;

        const box = event.currentTarget.getBoundingClientRect();
        const inside =
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom;

        if (!inside) onClose();
    };

    return (
        <dialog className="roster leather" ref={dialog} onCancel={onClose} onClose={onClose} onClick={closeOnBackdrop}>
            <div className="roster__head">
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
        </dialog>
    );
}
