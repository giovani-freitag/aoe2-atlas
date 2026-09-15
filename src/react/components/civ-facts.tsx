import { useTranslation } from 'react-i18next';
import { AlertTriangle, MapPin, MoveRight, PencilRuler } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { expansionOf } from '@/data/expansions.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useCivilizationText } from '@/react/hooks/view/use-civilization-text.ts';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { WikiLink } from './wiki-link.tsx';

/*
 * What the atlas has to say about one civilization, in pieces.
 *
 * There are two panels describing the same thing — a column docked at the side of a desktop and
 * a deck of drawers over the foot of a phone — and they were two copies of every line. A copy
 * is a promise to change both, and the second one is the one that gets forgotten: the phone's
 * had already lost the hand-drawn note and the carried-border warning by the time this was
 * written. The panels arrange these; they no longer word them.
 */

export interface RealmFactsProps {
    civilization: Civilization;
    /** Its border in the century on screen, or null when it held none. */
    border: RealmBorder | null;
}

/** The realm as it stood in the year on the rail: how much ground, how well known, and whence. */
export function RealmFacts({ civilization, border }: RealmFactsProps) {
    const { t } = useTranslation();
    const { state, dispatch } = useAtlas();
    const words = useCivilizationText(civilization);
    const format = useFormat();
    const year = format.year(state.year);
    const { peakYear, peakAreaKm2 } = civilization.reach;

    return (
        <>
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
                            {t('detail.carried', { year, from: format.year(border.from), years: border.carriedYears })}
                        </p>
                    )}
                </>
            ) : (
                <p className="card__note">
                    <AlertTriangle size={14} aria-hidden /> {t('detail.absent')}
                </p>
            )}

            <p className="card__source">
                {t('detail.peak', { year: format.year(peakYear), area: format.area(peakAreaKm2) })}
            </p>

            {/*
             * Telling a reader that a realm was bigger somewhere else in time and leaving them to
             * find the year by hand is half an answer. The rail is the whole atlas, so this moves it.
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
        </>
    );
}

export interface WonderFactsProps {
    civilization: Civilization;
    /** Sets the monument's own name as the lead rather than running it into one line. */
    titled?: boolean;
}

/** The Wonder: what it is, where it stands, and where to read about it. */
export function WonderFacts({ civilization, titled }: WonderFactsProps) {
    const { t } = useTranslation();
    const words = useCivilizationText(civilization);

    const link = (
        <WikiLink language={civilization.wonder.wikipediaLang} title={civilization.wonder.wikipedia}>
            {t('detail.wikipedia')}
        </WikiLink>
    );

    return (
        <>
            {titled ? (
                <>
                    <p className="card__lead">{words.monument}</p>
                    <p className="card__line">{words.place}</p>
                    {link}
                </>
            ) : (
                <p className="card__source">
                    <MapPin size={12} aria-hidden /> {words.monument}, {words.place} · {link}
                </p>
            )}

            {words.anachronism ? (
                <p className="card__note">
                    <AlertTriangle size={14} aria-hidden /> {words.anachronism}
                </p>
            ) : null}
        </>
    );
}

export interface ExpansionFactsProps {
    civilization: Civilization;
}

/** Which release the civilization arrived in, and when — or nothing, for the ones that shipped. */
export function ExpansionFacts({ civilization }: ExpansionFactsProps) {
    const { t } = useTranslation();
    const format = useFormat();
    const expansion = expansionOf(civilization);

    if (!expansion) return null;

    return (
        <>
            <p className="card__lead">{expansion.name}</p>
            <p className="card__line">
                {t(expansion.released ? 'detail.releasedOn' : 'detail.plannedFor', {
                    date: format.date(expansion.releasedOn),
                })}
            </p>
        </>
    );
}
