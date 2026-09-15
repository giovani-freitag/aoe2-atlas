import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { REGION_KEYS, type RegionKey } from '@/domain/enums/region.ts';
import { usePalette } from '@/react/hooks/services/use-palette.ts';
import { useText } from '@/react/hooks/services/use-text.ts';
import { LEGEND_DETAIL_LIMIT, useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { useWideScreen } from '@/react/hooks/dom/use-wide-screen.ts';
import { HatchSwatch } from './hatch-swatch.tsx';

export interface LegendPanelProps {
    /** The realms currently drawn, in draw order. */
    drawn: readonly Civilization[];
    borders: ReadonlyMap<string, RealmBorder>;
}

/**
 * What each hatch on the map means.
 *
 * Colour alone never carries identity: two realms of one region wear the same hue and are told
 * apart by the angle of their hatching. Naming all of them stops working somewhere around a
 * dozen, so past that the legend names the eight regions and lets the map answer "which one is
 * this" on tap. With nothing drawn there is no legend at all — the switch that traces every
 * realm of the century sits with the map controls, where a switch belongs.
 */
export function LegendPanel({ drawn, borders }: LegendPanelProps) {
    const { t } = useTranslation();
    const palette = usePalette();
    const text = useText();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const wide = useWideScreen();
    const [open, setOpen] = useState(false);

    /*
     * On a phone the legend is a pill until it is asked for.
     *
     * It is a caption, and a caption that covers a third of what it captions is worth less than
     * the ground it takes. Folded up it is the count and a dot per region — a legend in
     * miniature, and enough to see that five colours are in play and which they are. Where
     * there is room for it to sit in a corner and bother nobody, it stays open.
     */
    const shown = wide || open;

    const detailed = drawn.length <= LEGEND_DETAIL_LIMIT;
    const regionsOnMap = new Set(drawn.map((civ) => civ.region));

    const remove = (key: string): void => {
        if (state.pinned.includes(key)) dispatch({ type: 'toggle-pin', value: key });
        if (state.focused === key) dispatch({ type: 'focus', value: null });
    };

    if (drawn.length === 0) return null;

    return (
        <section
            className="legend leather"
            data-open={shown}
            aria-label={t('legend.onMap', { count: drawn.length })}
        >
            {/* On a phone the pill is the header: it folds the panel, and carries the way out. */}
            {wide ? null : (
                <div className="legend__pill">
                    <button
                        type="button"
                        className="legend__chip"
                        aria-expanded={open}
                        aria-label={t('legend.onMap', { count: drawn.length })}
                        onClick={() => {
                            setOpen((was) => !was);
                        }}
                    >
                        <Layers size={13} aria-hidden />
                        <b className="numeric">{drawn.length}</b>
                        <span className="legend__dots" aria-hidden>
                            {REGION_KEYS.filter((region) => regionsOnMap.has(region)).map((region) => (
                                <i key={region} style={{ background: palette.regionColour(region) }} />
                            ))}
                        </span>
                    </button>

                    {open ? (
                        <button
                            type="button"
                            className="legend__clear"
                            onClick={() => {
                                dispatch({ type: 'clear-map' });
                            }}
                        >
                            {t('legend.clear')}
                        </button>
                    ) : null}
                </div>
            )}

            {shown ? (
                <>
            {/*
             * A titled header, the way every other panel in the atlas is headed.
             *
             * The count used to be a line of small capitals floating over the list with a word
             * beside it, which reads as a caption rather than as the top of anything. Set on a
             * band of its own, in the title face, behind the same mark the trace control wears,
             * the card reads as a panel — and the header holds still while the list scrolls.
             */}
            {wide ? (
            <header className="legend__head">
                <Layers size={14} aria-hidden />
                <h2>{t('legend.onMap', { count: drawn.length })}</h2>
                <button
                    type="button"
                    className="legend__clear"
                    onClick={() => {
                        dispatch({ type: 'clear-map' });
                    }}
                >
                    {t('legend.clear')}
                </button>
            </header>
            ) : null}

            <div className="legend__body">
                {detailed ? (
                    <ul className="legend__civs">
                        {drawn.map((civilization) => {
                            const border = borders.get(civilization.key);
                            const words = text.civilization(civilization.key, false);

                            return (
                                <li key={civilization.key}>
                                    <HatchSwatch style={palette.styleOf(civilization.key)} size={18} />
                                    <span className="legend__text">
                                        <strong>{words.name}</strong>
                                        <small>{text.region(civilization.region)}</small>
                                    </span>
                                    {/*
                                     * The area stands in its own column rather than trailing the
                                     * region after a dot. On one line the two together ran past
                                     * the width of the card, and it was always the number that
                                     * got cut — "Mediterranean and Middle East · 155…".
                                     */}
                                    {border ? (
                                        <span className="legend__area numeric">{format.area(border.areaKm2)}</span>
                                    ) : null}
                                    {state.showAll ? null : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                remove(civilization.key);
                                            }}
                                            aria-label={t('legend.remove', { name: words.name })}
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
                        {/*
                         * Past a dozen realms the legend stops naming them and names the regions
                         * instead, as a row of tokens rather than a column of rows: eight lines
                         * of "N on the map" repeated the same three words eight times and pushed
                         * the card halfway up the map. What is left is a colour, a name and a
                         * numeral; the sentence stays where a screen reader can still read it.
                         */}
                        <ul className="legend__regions">
                            {REGION_KEYS.filter((region) => regionsOnMap.has(region)).map((region) => {
                                const count = countIn(drawn, region);

                                return (
                                    <li key={region}>
                                        <span
                                            className="legend__dot"
                                            style={{ background: palette.regionColour(region) }}
                                            aria-hidden
                                        />
                                        <span className="legend__region">{text.region(region)}</span>
                                        <b className="numeric">{count}</b>
                                        <span className="sr-only">{t('legend.onMap', { count })}</span>
                                    </li>
                                );
                            })}
                        </ul>
                        <p className="legend__hint">{t('legend.hint')}</p>
                    </>
                )}
            </div>
                </>
            ) : null}
        </section>
    );
}

function countIn(drawn: readonly Civilization[], region: RegionKey): number {
    return drawn.filter((civ) => civ.region === region).length;
}
