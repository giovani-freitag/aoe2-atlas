import { useEffect, useRef } from 'react';
import { AlertTriangle, ExternalLink, MapPin, PencilRuler, Pin, PinOff, Swords, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { REGION_NAMES } from '@/domain/enums/region.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';
import { useSheetDrag } from '@/react/hooks/use-sheet-drag.ts';
import { formatArea, formatDate, formatShare, formatSpan, formatYardstick, formatYear } from '@/react/format.ts';

/** How many neighbours the frontier list shows before it stops being a list. */
const MAX_FRONTIERS = 6;

/** What the source calls each level of confidence in a border. */
const PRECISION_WORDS = {
    approximate: 'aproximada',
    moderate: 'moderadamente precisa',
    surveyed: 'demarcada',
} as const;

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
    const { catalogue, palette } = useServices();
    const { state, dispatch } = useAtlas();
    const wide = useWideScreen();
    const drag = useSheetDrag();
    const sheet = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = sheet.current;
        if (!element || wide) return;

        element.showPopover();

        return () => {
            if (element.matches(':popover-open')) element.hidePopover();
        };
    }, [wide]);

    const style = palette.styleOf(civilization.key);
    const expansion = EXPANSION_RECORDS.find((entry) => entry.key === civilization.expansion);
    const pinned = state.pinned.includes(civilization.key);
    const { wonder } = civilization;

    const neighbours = frontiers
        .filter((frontier) => frontier.otherThan(civilization.key) !== null)
        .sort((left, right) => right.shareOf(civilization.key) - left.shareOf(civilization.key))
        .slice(0, MAX_FRONTIERS);

    return (
        <div
            className="sheet leather"
            ref={sheet}
            popover={wide ? undefined : 'manual'}
            aria-label={`Detalhes de ${civilization.name}`}
            data-dragging={drag.dragging}
            style={wide ? undefined : { height: `${drag.height * 100}dvh` }}
        >
            <button
                type="button"
                className="sheet__grip"
                onPointerDown={drag.onPointerDown}
                aria-label="Mudar a altura do painel"
            >
                <span aria-hidden />
            </button>

            <header className="sheet__head" style={{ borderColor: style.colour }}>
                <img
                    src={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                    alt=""
                    width={44}
                    height={44}
                />
                <div>
                    <h2>{civilization.name}</h2>
                    <p className="sheet__region">{REGION_NAMES[civilization.region]}</p>
                </div>
                <button type="button" className="bar__button iron" onClick={onClose} aria-label="Fechar">
                    <X size={18} aria-hidden />
                </button>
            </header>

            <div className="sheet__body">
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
                    {pinned ? 'Tirar do mapa' : 'Traçar no mapa'}
                </button>

                <section className="card parchment singed">
                    <h3 className="eyebrow">Maravilha</h3>
                    <p className="card__lead">{wonder.monument}</p>
                    <p className="card__line">
                        <MapPin size={14} aria-hidden /> {wonder.place}, {wonder.country}
                    </p>
                    <p className="card__line numeric">
                        {wonder.at.lat.toFixed(4)}°, {wonder.at.lon.toFixed(4)}°
                    </p>
                    {wonder.anachronism ? (
                        <p className="card__note">
                            <AlertTriangle size={14} aria-hidden /> {wonder.anachronism}
                        </p>
                    ) : null}
                    <a
                        className="card__link"
                        href={`https://en.wikipedia.org/wiki/${encodeURIComponent(wonder.wikipedia)}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Wikipédia <ExternalLink size={13} aria-hidden />
                    </a>
                </section>

                <section className="card parchment singed">
                    <h3 className="eyebrow">Em {formatYear(state.year)}</h3>
                    <p className="card__lead">{civilization.realmLabel}</p>

                    {border ? (
                        <>
                            <dl className="stats">
                                <div>
                                    <dt>Área</dt>
                                    <dd className="numeric">{formatArea(border.areaKm2)}</dd>
                                </div>
                                <div>
                                    <dt>Equivale a</dt>
                                    <dd>{formatYardstick(border.areaKm2)}</dd>
                                </div>
                                <div>
                                    <dt>Fronteira</dt>
                                    <dd>{PRECISION_WORDS[border.precision]}</dd>
                                </div>
                                <div>
                                    <dt>Em cena</dt>
                                    <dd className="numeric">
                                        {formatSpan(civilization.span.from, civilization.span.to)}
                                    </dd>
                                </div>
                            </dl>

                            {border.isHandDrawn ? (
                                <p className="card__note">
                                    <PencilRuler size={14} aria-hidden /> Contorno desenhado à mão para este atlas: a
                                    fonte não traz este reino.
                                </p>
                            ) : (
                                <p className="card__source">
                                    Dissolvido de {border.sourceNames.join(', ')} no mapa de {formatYear(border.from)}.
                                </p>
                            )}

                            {border.isOfItsCentury ? null : (
                                <p className="card__note">
                                    <AlertTriangle size={14} aria-hidden /> A fonte não mapeia este reino em{' '}
                                    {formatYear(state.year)}; a linha vem de {formatYear(border.from)},{' '}
                                    {border.carriedYears} anos de distância.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="card__note">
                            <AlertTriangle size={14} aria-hidden /> Nenhuma fronteira mapeada neste século. Arraste o
                            ano para {formatYear(civilization.reach.peakYear)}, o auge desta civilização.
                        </p>
                    )}

                    <p className="card__source">
                        Auge em {formatYear(civilization.reach.peakYear)}, com{' '}
                        {formatArea(civilization.reach.peakAreaKm2)}.
                    </p>
                </section>

                {expansion ? (
                    <section className="card parchment singed">
                        <h3 className="eyebrow">Expansão</h3>
                        <p className="card__lead">{expansion.name}</p>
                        <p className="card__line">
                            {expansion.released ? 'Lançada em' : 'Prevista para'} {formatDate(expansion.releasedOn)}
                        </p>
                    </section>
                ) : null}

                {neighbours.length > 0 ? (
                    <section className="card parchment singed">
                        <h3 className="eyebrow">
                            <Swords size={13} aria-hidden /> Terreno dividido em {formatYear(state.year)}
                        </h3>
                        <p className="card__hint">
                            Só contemporâneos entram aqui: quem dividiu chão com esta civilização neste mesmo século.
                        </p>
                        <ul className="frontiers">
                            {neighbours.map((frontier) => {
                                const otherKey = frontier.otherThan(civilization.key);
                                const other = otherKey ? catalogue.find(otherKey) : null;
                                if (!other) return null;

                                const otherStyle = palette.styleOf(other.key);

                                return (
                                    <li key={other.key}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                dispatch({ type: 'toggle-pin', value: other.key });
                                            }}
                                            title={`Sobrepor ${other.name} no mapa`}
                                        >
                                            <span
                                                className="frontiers__dot"
                                                style={{ background: otherStyle.colour }}
                                                aria-hidden
                                            />
                                            <span className="frontiers__name">{other.name}</span>
                                            <span className="frontiers__meter" aria-hidden>
                                                <span
                                                    style={{
                                                        width: `${Math.min(1, frontier.shareOf(civilization.key)) * 100}%`,
                                                        background: otherStyle.colour,
                                                    }}
                                                />
                                            </span>
                                            <span className="frontiers__share numeric">
                                                {formatShare(frontier.shareOf(civilization.key))}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ) : null}
            </div>
        </div>
    );
}
