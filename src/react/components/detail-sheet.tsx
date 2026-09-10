import { useTranslation } from 'react-i18next';
import { AlertTriangle, ExternalLink, MapPin, MoveRight, PencilRuler, Pin, PinOff, Swords } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useCivilizationText } from '@/react/hooks/use-civilization-text.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { BottomSheet } from './bottom-sheet.tsx';

/** How many neighbours the frontier list shows before it stops being a list. */
const MAX_FRONTIERS = 6;

export interface DetailSheetProps {
    civilization: Civilization;
    /** Its border in the century on screen, or null when it held none. */
    border: RealmBorder | null;
    /** Ground it shared with contemporaries in this century. */
    frontiers: readonly Frontier[];
    onClose: () => void;
}

/**
 * One civilization, in the century the rail is parked on.
 *
 * Everything here is dated. The area is the area it held *then*, the neighbours are the ones it
 * actually had *then*, and when the line on the map was borrowed from another century the
 * panel says which — a reader should never have to wonder what year they are looking at.
 */
export function DetailSheet({ civilization, border, frontiers, onClose }: DetailSheetProps) {
    const { t } = useTranslation();
    const { catalogue, palette, text } = useServices();
    const { state, dispatch } = useAtlas();
    const words = useCivilizationText(civilization);
    const format = useFormat();
    const style = palette.styleOf(civilization.key);
    const expansion = EXPANSION_RECORDS.find((entry) => entry.key === civilization.expansion);
    const pinned = state.pinned.includes(civilization.key);
    const year = format.year(state.year);
    const { peakYear, peakAreaKm2 } = civilization.reach;

    const neighbours = frontiers
        .filter((frontier) => frontier.otherThan(civilization.key) !== null)
        .sort((left, right) => right.shareOf(civilization.key) - left.shareOf(civilization.key))
        .slice(0, MAX_FRONTIERS);

    return (
        <BottomSheet
            label={t('sheet.details', { name: words.name })}
            open
            onClose={onClose}
            wide="dock"
            head={
                <div className="sheet__head--titled" style={{ borderColor: style.colour }}>
                    <img
                        src={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                        alt=""
                        width={44}
                        height={44}
                    />
                    <div>
                        <h2>{words.name}</h2>
                        <p className="sheet__region">{text.region(civilization.region)}</p>
                    </div>
                </div>
            }
        >
            <>
                {/*
                 * Opening the sheet already previews the realm; this button is what makes the hatch
                 * stay behind when the sheet closes. With no border in this century there is nothing
                 * to trace, and the button says so instead of sitting there greyed out.
                 */}
                <button
                    type="button"
                    className="button iron"
                    data-active={pinned}
                    disabled={border === null}
                    onClick={() => {
                        dispatch({ type: 'toggle-pin', value: civilization.key });
                    }}
                >
                    {pinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
                    {border === null ? t('detail.noBorder', { year }) : pinned ? t('detail.untrace') : t('detail.trace')}
                </button>

                <section className="card parchment singed">
                    <h3 className="eyebrow">{t('detail.in', { year })}</h3>
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
                                    <dd className="numeric">{format.span(civilization.span.from, civilization.span.to)}</dd>
                                </div>
                            </dl>

                            {border.isHandDrawn ? (
                                <p className="card__note">
                                    <PencilRuler size={14} aria-hidden /> {t('detail.handDrawn')}
                                </p>
                            ) : (
                                <p className="card__source">
                                    {t('detail.dissolved', {
                                        sources: border.sourceNames.join(', '),
                                        year: format.year(border.from),
                                    })}
                                </p>
                            )}

                            {border.isOfItsCentury ? null : (
                                <p className="card__note">
                                    <AlertTriangle size={14} aria-hidden />{' '}
                                    {t('detail.carried', {
                                        year,
                                        from: format.year(border.from),
                                        years: border.carriedYears,
                                    })}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="card__note">
                            <AlertTriangle size={14} aria-hidden />{' '}
                            {t('detail.absent')}
                        </p>
                    )}

                    <p className="card__source">
                        {t('detail.peak', { year: format.year(peakYear), area: format.area(peakAreaKm2) })}
                    </p>

                    {/*
                     * Telling a reader that a realm was bigger somewhere else in time and leaving them
                     * to find the year by hand is half an answer. The rail is the whole atlas, so the
                     * sheet moves it.
                     */}
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

                    {/* The Wonder is the pin on the map; here it is one line, not a card of its own. */}
                    <p className="card__source">
                        <MapPin size={12} aria-hidden /> {words.monument}, {words.place} ·{' '}
                        <a
                            className="card__link"
                            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(civilization.wonder.wikipedia)}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {t('detail.wikipedia')} <ExternalLink size={11} aria-hidden />
                        </a>
                    </p>
                    {words.anachronism ? (
                        <p className="card__note">
                            <AlertTriangle size={14} aria-hidden /> {words.anachronism}
                        </p>
                    ) : null}
                </section>

                {expansion ? (
                    <section className="card parchment singed">
                        <h3 className="eyebrow">{t('detail.expansion')}</h3>
                        <p className="card__lead">{expansion.name}</p>
                        <p className="card__line">
                            {t(expansion.released ? 'detail.releasedOn' : 'detail.plannedFor', {
                                date: format.date(expansion.releasedOn),
                            })}
                        </p>
                    </section>
                ) : null}

                {neighbours.length > 0 ? (
                    <section className="card parchment singed">
                        <h3 className="eyebrow">
                            <Swords size={13} aria-hidden /> {t('detail.shared', { year })}
                        </h3>
                        <p className="card__hint">
                            {t('detail.sharedHint')} <abbr title={t('detail.sharedAbbr')}>≈</abbr>{' '}
                            {t('detail.sharedHintTail')}
                        </p>
                        <ul className="frontiers">
                            {neighbours.map((frontier) => {
                                const otherKey = frontier.otherThan(civilization.key);
                                const other = otherKey ? catalogue.find(otherKey) : null;
                                if (!other) return null;

                                const otherStyle = palette.styleOf(other.key);
                                const otherName = text.civilization(other.key, false).name;

                                return (
                                    <li key={other.key}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                dispatch({ type: 'toggle-pin', value: other.key });
                                            }}
                                            title={t('detail.overlay', { name: otherName })}
                                        >
                                            <span
                                                className="frontiers__dot"
                                                style={{ background: otherStyle.colour }}
                                                aria-hidden
                                            />
                                            <span className="frontiers__name">{otherName}</span>
                                            <span className="frontiers__meter" aria-hidden>
                                                <span
                                                    style={{
                                                        width: `${Math.min(1, frontier.shareOf(civilization.key)) * 100}%`,
                                                        background: otherStyle.colour,
                                                    }}
                                                />
                                            </span>
                                            <span className="frontiers__share numeric" data-soft={frontier.carried}>
                                                {frontier.carried ? '≈' : ''}
                                                {format.share(frontier.shareOf(civilization.key))}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ) : null}
            </>
        </BottomSheet>
    );
}
