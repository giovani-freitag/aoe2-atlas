import { useTranslation } from 'react-i18next';
import { Layers, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { REGION_KEYS, type RegionKey } from '@/domain/enums/region.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { LEGEND_DETAIL_LIMIT, useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
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
    const { palette, text } = useServices();
    const { state, dispatch } = useAtlas();
    const format = useFormat();

    const detailed = drawn.length <= LEGEND_DETAIL_LIMIT;
    const regionsOnMap = new Set(drawn.map((civ) => civ.region));

    const remove = (key: string): void => {
        if (state.pinned.includes(key)) dispatch({ type: 'toggle-pin', value: key });
        if (state.focused === key) dispatch({ type: 'focus', value: null });
    };

    if (drawn.length === 0) return null;

    return (
        <section className="legend leather" aria-label={t('legend.onMap', { count: drawn.length })}>
            {/*
             * A titled header, the way every other panel in the atlas is headed.
             *
             * The count used to be a line of small capitals floating over the list with a word
             * beside it, which reads as a caption rather than as the top of anything. Set on a
             * band of its own, in the title face, behind the same mark the trace control wears,
             * the card reads as a panel — and the header holds still while the list scrolls.
             */}
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
        </section>
    );
}

function countIn(drawn: readonly Civilization[], region: RegionKey): number {
    return drawn.filter((civ) => civ.region === region).length;
}
