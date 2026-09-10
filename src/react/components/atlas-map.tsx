import { useEffect, useMemo, useRef } from 'react';
import { Compass, Layers, Minus, Plus } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { LAND_RINGS } from '@/data/dataset.ts';
import { AtlasProjection, SCALE_EXTENT } from '@/services/geo/atlas-projection.ts';
import { formatYear } from '@/react/format.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useElementSize } from '@/react/hooks/use-element-size.ts';
import { useMapZoom } from '@/react/hooks/use-map-zoom.ts';
import { CompassRose } from './compass-rose.tsx';
import { HatchDefs } from './hatch-defs.tsx';
import { WonderMarker } from './wonder-marker.tsx';

/** How much of the foot of the map the legend covers on a narrow screen. */
const LEGEND_SHARE = 0.36;

/** Above this width the legend is a card in the corner and stops eating the map's height. */
const CARD_LEGEND_WIDTH = 720;

/** Where the wind rose sits and how big it is, as a share of the shorter side. */
const ROSE_SHARE = 0.11;
const ROSE_MAX = 46;

export interface AtlasMapProps {
    /** The civilizations the filters leave standing in the year on the rail; each gets a mark. */
    standing: readonly Civilization[];
    /** The realms whose border is drawn, in draw order. */
    drawn: readonly Civilization[];
    /** Borders for the century on screen, keyed by civilization. */
    borders: ReadonlyMap<string, RealmBorder>;
}

/**
 * The atlas: an equal-area world on parchment, with realms hatched over it.
 *
 * Panning and zooming move a single SVG group, so the projected paths are computed once per
 * viewport size rather than once per frame. The marks ride outside that group and are placed by
 * applying the same transform by hand, which is what keeps them a constant size.
 */
export function AtlasMap({ standing, drawn, borders }: AtlasMapProps) {
    const { palette } = useServices();
    const { state, dispatch } = useAtlas();
    const [holder, size] = useElementSize<HTMLDivElement>();
    const svg = useRef<SVGSVGElement>(null);

    const projection = useMemo(() => {
        if (size.width === 0 || size.height === 0) return null;

        const bottomInset = size.width < CARD_LEGEND_WIDTH ? size.height * LEGEND_SHARE : 0;

        return new AtlasProjection({ width: size.width, height: size.height, bottomInset, kind: state.projection });
    }, [size.width, size.height, state.projection]);

    const { frame, flyTo, zoomBy } = useMapZoom(svg, {
        width: size.width,
        height: size.height,
        scaleExtent: SCALE_EXTENT,
    });

    const base = useMemo(() => {
        if (!projection) return null;

        const { equator, tropics } = projection.referenceLines();

        return {
            sphere: projection.spherePath(),
            graticule: projection.graticulePath(),
            land: projection.pathOf(LAND_RINGS),
            equator,
            tropics,
        };
    }, [projection]);

    const shapes = useMemo(() => {
        if (!projection) return [];

        return drawn.flatMap((civilization) => {
            const border = borders.get(civilization.key);
            if (!border) return [];

            return [{ civilization, border, path: projection.pathOf(border.rings) }];
        });
    }, [projection, drawn, borders]);

    const styles = useMemo(
        () => shapes.map((entry) => palette.styleOf(entry.civilization.key)),
        [shapes, palette],
    );

    // Opening a civilization brings its realm into the frame; closing the sheet pulls back out.
    const focus = state.focused;
    useEffect(() => {
        if (!projection) return;

        if (!focus) {
            flyTo(projection.wholeWorld());

            return;
        }

        const border = borders.get(focus);
        if (!border) return;

        flyTo(projection.frameFor(border.rings));
    }, [focus, projection, borders, flyTo]);

    const roseRadius = Math.min(ROSE_MAX, Math.min(size.width, size.height) * ROSE_SHARE);

    /*
     * The shield hangs inside the realm, on a point the build guarantees is dry land, so it moves
     * with the border century by century. The Wonder itself is a fixed place and stays a pin; a
     * leader joins the two when they are apart.
     */
    const marks = useMemo(() => {
        if (!projection) return [];

        return standing.flatMap((civilization) => {
            const wonder = projection.pointOf(civilization.markerAt);
            if (!wonder) return [];

            const border = borders.get(civilization.key);
            const anchor = border ? projection.pointOf(border.anchor) ?? wonder : wonder;

            return [{ civilization, anchor, wonder }];
        });
    }, [projection, standing, borders]);

    return (
        <div className="atlas" ref={holder}>
            {projection && base ? (
                <svg
                    ref={svg}
                    className="atlas__canvas"
                    width={size.width}
                    height={size.height}
                    viewBox={`0 0 ${size.width} ${size.height}`}
                    role="img"
                    aria-label="Mapa-múndi de área equivalente com os territórios e maravilhas das civilizações."
                >
                    <HatchDefs styles={styles} scale={frame.k} />

                    <g transform={`translate(${frame.x},${frame.y}) scale(${frame.k})`}>
                        <path className="atlas__sea" d={base.sphere} />
                        <path className="atlas__land" d={base.land} vectorEffect="non-scaling-stroke" />

                        {/* The ruled lines an old chart is laid out on, heaviest at the equator. */}
                        {state.ruled ? (
                            <>
                                <path
                                    className="atlas__graticule"
                                    d={base.graticule}
                                    vectorEffect="non-scaling-stroke"
                                />
                                <path className="atlas__tropics" d={base.tropics} vectorEffect="non-scaling-stroke" />
                                <path className="atlas__equator" d={base.equator} vectorEffect="non-scaling-stroke" />
                            </>
                        ) : null}

                        <path className="atlas__rim" d={base.sphere} vectorEffect="non-scaling-stroke" />

                        {shapes.map(({ civilization, border, path }) => {
                            const style = palette.styleOf(civilization.key);

                            /*
                             * Opening a sheet only previews the realm — a wash of its colour inside
                             * the border. The hatch is what "trace on the map" adds, and what stays
                             * behind when the sheet closes; the two have to look different or the
                             * button appears to do nothing.
                             */
                            const preview =
                                !state.showAll &&
                                state.focused === civilization.key &&
                                !state.pinned.includes(civilization.key);

                            return (
                                <path
                                    key={civilization.key}
                                    className="atlas__realm"
                                    data-precision={border.precision}
                                    data-carried={!border.isOfItsCentury}
                                    data-highlighted={state.hovered === civilization.key}
                                    data-focused={state.focused === civilization.key}
                                    data-preview={preview}
                                    d={path}
                                    fill={preview ? style.colour : `url(#${style.patternId})`}
                                    stroke={style.colour}
                                    filter={border.precision === 'approximate' ? 'url(#frontier-haze)' : undefined}
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })}
                    </g>

                    {state.ruled ? (
                        <CompassRose
                            at={[size.width - roseRadius - 18, roseRadius + 26]}
                            radius={roseRadius}
                        />
                    ) : null}

                    <g className="atlas__marks">
                        {marks.map(({ civilization, anchor, wonder }) => {
                            const at: [number, number] = [frame.k * anchor[0] + frame.x, frame.k * anchor[1] + frame.y];
                            const pin: [number, number] = [frame.k * wonder[0] + frame.x, frame.k * wonder[1] + frame.y];
                            const apart = Math.hypot(at[0] - pin[0], at[1] - pin[1]) > 6;
                            const lit = state.focused === civilization.key || state.hovered === civilization.key;
                            const colour = palette.styleOf(civilization.key).colour;

                            return (
                                <g key={civilization.key}>
                                    {apart && lit ? (
                                        <line className="leader" x1={at[0]} y1={at[1]} x2={pin[0]} y2={pin[1]} />
                                    ) : null}
                                    {apart ? (
                                        <g
                                            className="pin"
                                            transform={`translate(${pin[0]}, ${pin[1]})`}
                                            onClick={() => {
                                                dispatch({ type: 'focus', value: civilization.key });
                                            }}
                                        >
                                            <title>{civilization.wonder.monument}</title>
                                            <circle className="pin__dot" r={5} stroke={colour} />
                                            <circle className="pin__core" r={1.8} />
                                        </g>
                                    ) : null}
                                    <WonderMarker
                                        civilization={civilization}
                                        at={at}
                                        colour={colour}
                                        standing={borders.has(civilization.key)}
                                        focused={state.focused === civilization.key}
                                        highlighted={state.hovered === civilization.key}
                                        onOpen={(key) => {
                                            dispatch({ type: 'focus', value: state.focused === key ? null : key });
                                        }}
                                        onHover={(key) => {
                                            dispatch({ type: 'hover', value: key });
                                        }}
                                    />
                                </g>
                            );
                        })}
                    </g>
                </svg>
            ) : null}

            <div className="atlas__controls">
                <button
                    type="button"
                    className="iron"
                    aria-pressed={state.showAll}
                    onClick={() => {
                        dispatch({ type: 'toggle-show-all' });
                    }}
                    aria-label={
                        state.showAll
                            ? 'Deixar de traçar todos os reinos'
                            : `Traçar os ${standing.length} reinos de ${formatYear(state.year)}`
                    }
                    title={
                        state.showAll
                            ? 'Deixar de traçar todos os reinos'
                            : `Traçar os ${standing.length} reinos de ${formatYear(state.year)}`
                    }
                >
                    <Layers size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="iron"
                    onClick={() => {
                        zoomBy(1.6);
                    }}
                    aria-label="Aproximar"
                >
                    <Plus size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="iron"
                    onClick={() => {
                        zoomBy(1 / 1.6);
                    }}
                    aria-label="Afastar"
                >
                    <Minus size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="iron"
                    onClick={() => {
                        if (projection) flyTo(projection.wholeWorld());
                    }}
                    aria-label="Ver o mundo inteiro"
                >
                    <Compass size={18} aria-hidden />
                </button>
            </div>
        </div>
    );
}
