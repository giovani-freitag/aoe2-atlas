import { useTranslation } from 'react-i18next';
import { Swords } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { useSheet } from '@/react/providers/sheet-context.ts';

export interface RivalStripProps {
    /** The civilization whose neighbours these are. */
    civilization: Civilization;
    /** Ground it shared with contemporaries this century, widest share first. */
    frontiers: readonly Frontier[];
}

/**
 * Who else was standing on this ground, as a row of their arms.
 *
 * This used to be the last card in the sheet, under the expansion and the Wonder, which is a
 * strange place for the one thing here that is about the map rather than about the panel: a
 * reader had to scroll past everything to find it, and by then the sheet covered the map the
 * numbers were describing. It sits in the head now, so it is the second thing seen and stays
 * there at every height the sheet is dragged to.
 *
 * Tapping one traces that realm and gets the sheet out of the way, because "they shared forty
 * per cent of your ground" is a claim about a shape, and the shape is the answer.
 */
export function RivalStrip({ civilization, frontiers }: RivalStripProps) {
    const { t } = useTranslation();
    const { catalogue, palette, text } = useServices();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const sheet = useSheet();

    if (frontiers.length === 0) return null;

    return (
        <div className="rivals">
            <span className="rivals__label" title={t('detail.sharedHint')}>
                <Swords size={12} aria-hidden /> {t('detail.shared', { year: format.year(state.year) })}
            </span>

            <ul>
                {frontiers.map((frontier) => {
                    const otherKey = frontier.otherThan(civilization.key);
                    const other = otherKey ? catalogue.find(otherKey) : null;
                    if (!other) return null;

                    const name = text.civilization(other.key, false).name;
                    const share = frontier.shareOf(civilization.key);

                    return (
                        <li key={other.key}>
                            <button
                                type="button"
                                data-active={state.pinned.includes(other.key)}
                                title={t('detail.overlay', { name })}
                                aria-label={t('detail.overlay', { name })}
                                onClick={() => {
                                    dispatch({ type: 'toggle-pin', value: other.key });
                                    sheet.collapse();
                                }}
                                onPointerEnter={() => {
                                    dispatch({ type: 'hover', value: other.key });
                                }}
                                onPointerLeave={() => {
                                    dispatch({ type: 'hover', value: null });
                                }}
                            >
                                <img
                                    src={`${import.meta.env.BASE_URL}img/civs/${other.icon}.png`}
                                    alt=""
                                    width={26}
                                    height={26}
                                    style={{ borderColor: palette.styleOf(other.key).colour }}
                                />
                                <span className="numeric">
                                    {frontier.carried ? <abbr title={t('detail.sharedAbbr')}>≈</abbr> : null}
                                    {format.share(share)}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
