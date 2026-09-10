import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
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
        <div className="legend leather stitched">
            <div className="legend__head">
                <span className="eyebrow">{t('legend.onMap', { count: drawn.length })}</span>
                <button
                    type="button"
                    onClick={() => {
                        dispatch({ type: 'clear-map' });
                    }}
                >
                    {t('legend.clear')}
                </button>
            </div>

            {detailed ? (
                <ul>
                    {drawn.map((civilization) => {
                        const border = borders.get(civilization.key);
                        const words = text.civilization(civilization.key, false);

                        return (
                            <li key={civilization.key}>
                                <HatchSwatch style={palette.styleOf(civilization.key)} size={18} />
                                <span className="legend__text">
                                    <strong>{words.name}</strong>
                                    <small>
                                        {text.region(civilization.region)}
                                        {border ? ` · ${format.area(border.areaKm2)}` : ''}
                                    </small>
                                </span>
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
                    <p className="legend__hint">{t('legend.hint')}</p>
                    <ul className="legend__regions">
                        {REGION_KEYS.filter((region) => regionsOnMap.has(region)).map((region) => (
                            <li key={region}>
                                <span
                                    className="legend__dot"
                                    style={{ background: palette.regionColour(region) }}
                                    aria-hidden
                                />
                                <span className="legend__text">
                                    <strong>{text.region(region)}</strong>
                                    <small>{t('legend.onMap', { count: countIn(drawn, region) })}</small>
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
