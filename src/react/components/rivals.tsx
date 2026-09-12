import { useTranslation } from 'react-i18next';
import { Swords } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { useSheet } from '@/react/providers/sheet-context.ts';
import { CivArms } from './civ-arms.tsx';

export interface RivalsProps {
    /** The civilization whose neighbours these are. */
    civilization: Civilization;
    /** Ground it shared with contemporaries this century, widest share first. */
    frontiers: readonly Frontier[];
    /**
     * How much room there is to say it.
     *
     * `arms` is the row that rides under the civilization's name: the arms and the share, and
     * the name only in the label. `rows` names each one, for a panel that opened to show them.
     */
    layout: 'arms' | 'rows';
}

/**
 * Who else was standing on this ground, and a way to put them on the map.
 *
 * This used to be the last card in the panel, under the expansion and the Wonder, which is a
 * strange place for the one thing here that is about the map rather than about the panel: a
 * reader had to scroll past everything to find it, and by then the panel covered the map the
 * numbers were describing.
 *
 * Tapping one traces that realm and gets the panel out of the way, because "they shared forty
 * per cent of your ground" is a claim about a shape, and the shape is the answer. Hovering
 * lights the whole of it, every piece, the way the roster does.
 */
export function Rivals({ civilization, frontiers, layout }: RivalsProps) {
    const { t } = useTranslation();
    const { catalogue, palette, text } = useServices();
    const { state, dispatch } = useAtlas();
    const format = useFormat();
    const sheet = useSheet();

    if (frontiers.length === 0) return null;

    return (
        <div className="rivals" data-layout={layout}>
            {layout === 'arms' ? (
                <span className="rivals__label" title={t('detail.sharedHint')}>
                    <Swords size={12} aria-hidden /> {t('detail.shared', { year: format.year(state.year) })}
                </span>
            ) : null}

            <ul>
                {frontiers.map((frontier) => {
                    const otherKey = frontier.otherThan(civilization.key);
                    const other = otherKey ? catalogue.find(otherKey) : null;
                    if (!other) return null;

                    const name = text.civilization(other.key, false).name;
                    const share = format.share(frontier.shareOf(civilization.key));

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
                                <CivArms civilization={other} size={layout === 'arms' ? 26 : 20} colour={palette.styleOf(other.key).colour} />
                                {layout === 'rows' ? <span>{name}</span> : null}
                                <b className="numeric">
                                    {frontier.carried ? <abbr title={t('detail.sharedAbbr')}>≈</abbr> : null}
                                    {share}
                                </b>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
