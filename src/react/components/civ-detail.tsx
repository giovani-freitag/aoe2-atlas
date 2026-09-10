import { AlertTriangle, ExternalLink, MapPin, PencilRuler, Pin, PinOff, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { REGION_NAMES } from '@/domain/enums/region.ts';
import { EXPANSION_RECORDS } from '@/data/expansions.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import type { ColourScheme } from '@/react/hooks/use-colour-scheme.ts';
import { formatArea, formatDate, formatShare, formatSpan, formatYardstick, formatYear } from '@/react/format.ts';

/** How many neighbours the conflict list shows before it stops being a list and becomes a wall. */
const MAX_CONFLICTS = 6;

export interface CivDetailProps {
    civilization: Civilization;
    scheme: ColourScheme;
}

/** Everything the atlas knows about one civilization: its Wonder, its ground, and its neighbours. */
export function CivDetail({ civilization, scheme }: CivDetailProps) {
    const { atlas, palette } = useServices();
    const { state, dispatch } = useAtlas();

    const style = palette.styleOf(civilization.key);
    const colour = scheme === 'dark' ? style.dark : style.light;
    const expansion = EXPANSION_RECORDS.find((entry) => entry.key === civilization.expansion);
    const conflicts = atlas.conflictsOf(civilization.key).slice(0, MAX_CONFLICTS);
    const pinned = state.pinned.includes(civilization.key);
    const { wonder, territory } = civilization;

    return (
        <section className="detail" aria-label={`Detalhes de ${civilization.name}`}>
            <header className="detail__head" style={{ borderColor: colour }}>
                <img
                    src={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                    alt=""
                    width={40}
                    height={40}
                />
                <div>
                    <h2>{civilization.name}</h2>
                    <p className="detail__region">{REGION_NAMES[civilization.region]}</p>
                </div>
                <button
                    type="button"
                    className="detail__close"
                    onClick={() => {
                        dispatch({ type: 'select', value: null });
                    }}
                    aria-label="Fechar detalhes"
                >
                    <X size={16} aria-hidden />
                </button>
            </header>

            <div className="detail__actions">
                <button
                    type="button"
                    className="button"
                    data-active={pinned}
                    onClick={() => {
                        dispatch({ type: 'toggle-pin', value: civilization.key });
                    }}
                >
                    {pinned ? <PinOff size={14} aria-hidden /> : <Pin size={14} aria-hidden />}
                    {pinned ? 'Tirar da comparação' : 'Fixar para comparar'}
                </button>
            </div>

            <div className="card">
                <h3 className="eyebrow">Maravilha</h3>
                <p className="card__lead">{wonder.monument}</p>
                <p className="card__line">
                    <MapPin size={13} aria-hidden /> {wonder.place}, {wonder.country}
                </p>
                <p className="card__line numeric">
                    {wonder.at.lat.toFixed(4)}°, {wonder.at.lon.toFixed(4)}°
                </p>
                {wonder.anachronism ? (
                    <p className="card__note">
                        <AlertTriangle size={13} aria-hidden /> {wonder.anachronism}
                    </p>
                ) : null}
                <a
                    className="card__link"
                    href={`https://en.wikipedia.org/wiki/${encodeURIComponent(wonder.wikipedia)}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Wikipédia <ExternalLink size={12} aria-hidden />
                </a>
            </div>

            <div className="card">
                <h3 className="eyebrow">Território</h3>
                <p className="card__lead">{civilization.realmLabel}</p>
                <dl className="stats">
                    <div>
                        <dt>Área</dt>
                        <dd className="numeric">{formatArea(territory.areaKm2)}</dd>
                    </div>
                    <div>
                        <dt>Equivale a</dt>
                        <dd>{formatYardstick(territory.areaKm2)}</dd>
                    </div>
                    <div>
                        <dt>Recorte</dt>
                        <dd className="numeric">{formatYear(territory.year)}</dd>
                    </div>
                    <div>
                        <dt>Em cena</dt>
                        <dd className="numeric">{formatSpan(civilization.span.from, civilization.span.to)}</dd>
                    </div>
                </dl>
                <p className="card__note">
                    {territory.isHandDrawn ? (
                        <>
                            <PencilRuler size={13} aria-hidden /> Contorno desenhado à mão para este atlas: a fonte não
                            traz este reino.
                        </>
                    ) : (
                        <>Dissolvido de {territory.sourceNames.join(', ')} no mapa de {formatYear(territory.year)}.</>
                    )}
                </p>
            </div>

            {expansion ? (
                <div className="card">
                    <h3 className="eyebrow">Expansão</h3>
                    <p className="card__lead">{expansion.name}</p>
                    <p className="card__line">
                        {expansion.released ? 'Lançada em' : 'Prevista para'} {formatDate(expansion.releasedOn)}
                    </p>
                </div>
            ) : null}

            {conflicts.length > 0 ? (
                <div className="card">
                    <h3 className="eyebrow">Terreno disputado</h3>
                    <p className="card__hint">
                        Quanto do território desta civilização outra também reivindica, no auge de cada uma.
                    </p>
                    <ul className="conflicts">
                        {conflicts.map((conflict) => {
                            const otherStyle = palette.styleOf(conflict.other.key);
                            const otherColour = scheme === 'dark' ? otherStyle.dark : otherStyle.light;

                            return (
                                <li key={conflict.other.key}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            dispatch({ type: 'toggle-pin', value: conflict.other.key });
                                        }}
                                        title={`Sobrepor ${conflict.other.name} no mapa`}
                                    >
                                        <span className="conflicts__dot" style={{ background: otherColour }} aria-hidden />
                                        <span className="conflicts__name">{conflict.other.name}</span>
                                        <span className="conflicts__meter" aria-hidden>
                                            <span
                                                style={{
                                                    width: `${Math.min(1, conflict.shareOfThis) * 100}%`,
                                                    background: otherColour,
                                                }}
                                            />
                                        </span>
                                        <span className="conflicts__share numeric">
                                            {formatShare(conflict.shareOfThis)}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null}
        </section>
    );
}
