import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import type { CatalogueOrder } from '@/services/atlas/catalogue-service.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { usePalette } from '@/react/hooks/services/use-palette.ts';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { FALLBACK_LOCALE, toSupportedLocale } from '@/i18n/locales.ts';
import { useWideScreen } from '@/react/hooks/dom/use-wide-screen.ts';
import { Collapsible } from '@/react/ui/collapsible.tsx';
import { MultiToggleGroup, ToggleGroup, ToggleGroupItem } from '@/react/ui/toggle-group.tsx';
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
    const { t, i18n } = useTranslation();
    const palette = usePalette();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const wide = useWideScreen();
    const [unfolded, setUnfolded] = useState(false);

    const largest = useMemo(
        () => Math.max(1, ...[...borders.values()].map((border) => border.areaKm2)),
        [borders],
    );

    // The table is written in every language the atlas speaks, and English keeps the bare
    // address because that is the one already indexed under it.
    const language = toSupportedLocale(i18n.language);
    const tableAddress = `${import.meta.env.BASE_URL}civilizations/${
        language === FALLBACK_LOCALE ? '' : `${language}/`
    }`;

    const standingCount = civilizations.filter((civ) => borders.has(civ.key)).length;

    const chips = (
        <MultiToggleGroup
            label={t('roster.order.expansion')}
            className="chips"
            value={state.expansions}
            onValueChange={(value) => {
                dispatch({ type: 'expansions', value });
            }}
        >
            {EXPANSION_RECORDS.map((expansion) => (
                <ToggleGroupItem
                    key={expansion.key}
                    value={expansion.key}
                    className="chip"
                    data-upcoming={!expansion.released}
                    title={`${expansion.name} · ${expansion.releasedOn.slice(0, 4)}`}
                >
                    {expansion.shortName}
                </ToggleGroupItem>
            ))}
        </MultiToggleGroup>
    );

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

                <ToggleGroup
                    label={t('roster.orderBy')}
                    className="segmented oak"
                    value={state.order}
                    onValueChange={(value) => {
                        // Pressing the order already in force would otherwise sort the list by nothing.
                        if (value) dispatch({ type: 'order', value });
                    }}
                >
                    {ORDERS.map((order) => (
                        <ToggleGroupItem key={order} value={order}>
                            {t(`roster.order.${order}`)}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>

                {/*
                 * Fourteen expansion chips are three rows on a phone, and three rows of chips
                 * left the list they filter three hundred pixels to show fifty-six rows in. On a
                 * narrow screen they fold behind one chip that says how many are on; a reader
                 * who has set a filter finds it open, so the thing shaping the list is never out
                 * of sight. Where there is room, they are simply there.
                 */}
                {wide ? (
                    chips
                ) : (
                    <Collapsible
                        className="chips__fold"
                        /* A reader who has set a filter finds it open, and cannot shut it on itself. */
                        open={unfolded || state.expansions.length > 0}
                        onOpenChange={setUnfolded}
                        triggerClassName="chip"
                        active={state.expansions.length > 0}
                        trigger={
                            <>
                                {t('roster.order.expansion')}
                                {state.expansions.length > 0 ? ` · ${state.expansions.length}` : ''}
                            </>
                        }
                    >
                        {chips}
                    </Collapsible>
                )}

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
             * has a page, built from these same files and written in all seventeen languages, so
             * the link goes to the reader's own. English keeps the bare address because it is the
             * one already indexed under it. The address goes through BASE_URL because the page is
             * a build artefact and does not exist under `npm run dev`.
             */}
            <a className="roster__more" href={tableAddress} hrefLang={language}>
                {t('roster.everyCivilization')}
            </a>
        </SideDrawer>
    );
}
