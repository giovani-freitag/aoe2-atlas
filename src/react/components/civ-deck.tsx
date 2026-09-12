import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Landmark, MoveRight, Package, Scroll, Swords, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useCivilizationText } from '@/react/hooks/use-civilization-text.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { WikiLink } from './wiki-link.tsx';

/** How many neighbours the list shows before it stops being a list. */
const MAX_FRONTIERS = 6;

/** The height of the bar alone, in pixels, which is what the map has to keep clear. */
export const DECK_BAR = 52;

type Drawerful = 'realm' | 'rivals' | 'wonder' | 'expansion';

export interface CivDeckProps {
    civilization: Civilization;
    border: RealmBorder | null;
    frontiers: readonly Frontier[];
    onClose: () => void;
}

/**
 * The civilization as a bar over the year rail, with one panel out at a time.
 *
 * A spike on the shape Excalidraw uses on a phone: nothing takes the screen. What is always
 * there is a strip naming what is open and a row of categories, each the size of a thumb; a tap
 * lifts that category's panel over the map and a second tap puts it away. The reader is never
 * more than one tap from the whole map, and never has to remember what was underneath.
 *
 * The sheet it replaces answered every question at once and covered the map to do it. This
 * answers one at a time, and the one being asked is the one on screen.
 */
export function CivDeck({ civilization, border, frontiers, onClose }: CivDeckProps) {
    const { t } = useTranslation();
    const { catalogue, palette, text } = useServices();
    const { state, dispatch } = useAtlas();
    const words = useCivilizationText(civilization);
    const format = useFormat();
    const [open, setOpen] = useState<Drawerful | null>(null);

    const style = palette.styleOf(civilization.key);
    const expansion = EXPANSION_RECORDS.find((entry) => entry.key === civilization.expansion);
    const year = format.year(state.year);
    const { peakYear, peakAreaKm2 } = civilization.reach;

    const neighbours = frontiers
        .filter((frontier) => frontier.otherThan(civilization.key) !== null)
        .sort((left, right) => right.shareOf(civilization.key) - left.shareOf(civilization.key))
        .slice(0, MAX_FRONTIERS);

    /** A category with nothing behind it is not offered; an empty panel is a broken promise. */
    const tabs: { key: Drawerful; icon: typeof Scroll; label: string }[] = [
        { key: 'realm', icon: Scroll, label: t('detail.in', { year }) },
        ...(neighbours.length > 0
            ? [{ key: 'rivals' as const, icon: Swords, label: t('detail.shared', { year }) }]
            : []),
        { key: 'wonder', icon: Landmark, label: words.monument },
        ...(expansion ? [{ key: 'expansion' as const, icon: Package, label: t('detail.expansion') }] : []),
    ];

    return (
        <div className="deck">
            {open ? (
                <div className="deck__panel leather" role="group" aria-label={tabs.find((tab) => tab.key === open)?.label}>
                    {open === 'realm' ? (
                        <div className="deck__card parchment singed">
                            <p className="card__lead">{words.realm}</p>
                            {border ? (
                                <>
                                    <dl className="stats">
                                        <div>
                                            <dt>{t('detail.area')}</dt>
                                            <dd className="numeric">{format.area(border.areaKm2)}</dd>
                                        </div>
                                        <div>
                                            <dt>{t('detail.border')}</dt>
                                            <dd>{t(`detail.precision.${border.precision}`)}</dd>
                                        </div>
                                        <div>
                                            <dt>{t('detail.onStage')}</dt>
                                            <dd className="numeric">
                                                {format.span(civilization.span.from, civilization.span.to)}
                                            </dd>
                                        </div>
                                    </dl>
                                    <p className="card__source">
                                        {border.isHandDrawn
                                            ? t('detail.handDrawn')
                                            : t('detail.dissolved', {
                                                  sources: border.sourceNames.join(', '),
                                                  year: format.year(border.from),
                                              })}
                                    </p>
                                </>
                            ) : (
                                <p className="card__note">
                                    <AlertTriangle size={14} aria-hidden /> {t('detail.absent')}
                                </p>
                            )}
                            <p className="card__source">
                                {t('detail.peak', { year: format.year(peakYear), area: format.area(peakAreaKm2) })}
                            </p>
                            {state.year === peakYear ? null : (
                                <button
                                    type="button"
                                    className="card__jump"
                                    onClick={() => {
                                        dispatch({ type: 'year', value: peakYear });
                                    }}
                                >
                                    {t('detail.goToPeak', { year: format.year(peakYear) })}
                                    <MoveRight size={13} aria-hidden />
                                </button>
                            )}
                        </div>
                    ) : null}

                    {open === 'rivals' ? (
                        <ul className="deck__rivals">
                            {neighbours.map((frontier) => {
                                const otherKey = frontier.otherThan(civilization.key);
                                const other = otherKey ? catalogue.find(otherKey) : null;
                                if (!other) return null;

                                const name = text.civilization(other.key, false).name;

                                return (
                                    <li key={other.key}>
                                        <button
                                            type="button"
                                            data-active={state.pinned.includes(other.key)}
                                            onClick={() => {
                                                dispatch({ type: 'toggle-pin', value: other.key });
                                                setOpen(null);
                                            }}
                                        >
                                            <img
                                                src={`${import.meta.env.BASE_URL}img/civs/${other.icon}.png`}
                                                alt=""
                                                width={26}
                                                height={26}
                                                style={{ borderColor: palette.styleOf(other.key).colour }}
                                            />
                                            <span>{name}</span>
                                            <b className="numeric">
                                                {frontier.carried ? '≈' : ''}
                                                {format.share(frontier.shareOf(civilization.key))}
                                            </b>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : null}

                    {open === 'wonder' ? (
                        <div className="deck__card parchment singed">
                            <p className="card__lead">{words.monument}</p>
                            <p className="card__line">{words.place}</p>
                            <WikiLink language={civilization.wonder.wikipediaLang} title={civilization.wonder.wikipedia}>
                                {t('detail.wikipedia')}
                            </WikiLink>
                            {words.anachronism ? (
                                <p className="card__note">
                                    <AlertTriangle size={14} aria-hidden /> {words.anachronism}
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {open === 'expansion' && expansion ? (
                        <div className="deck__card parchment singed">
                            <p className="card__lead">{expansion.name}</p>
                            <p className="card__line">
                                {t(expansion.released ? 'detail.releasedOn' : 'detail.plannedFor', {
                                    date: format.date(expansion.releasedOn),
                                })}
                            </p>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="deck__bar leather" style={{ borderColor: style.colour }}>
                <img
                    src={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                    alt=""
                    width={30}
                    height={30}
                />
                <span className="deck__name">{words.name}</span>

                <nav>
                    {tabs.map(({ key, icon: Icon, label }) => (
                        <button
                            key={key}
                            type="button"
                            className="iron"
                            data-active={open === key}
                            aria-expanded={open === key}
                            aria-label={label}
                            title={label}
                            onClick={() => {
                                setOpen((current) => (current === key ? null : key));
                            }}
                        >
                            <Icon size={17} aria-hidden />
                        </button>
                    ))}
                </nav>

                <button type="button" className="deck__close iron" aria-label={t('sheet.details', { name: words.name })} onClick={onClose}>
                    <X size={17} aria-hidden />
                </button>
            </div>
        </div>
    );
}
