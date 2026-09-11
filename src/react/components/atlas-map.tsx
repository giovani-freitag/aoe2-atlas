import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Layers, Minus, Plus } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { LAND_RINGS } from '@/data/dataset.ts';
import { AtlasProjection, SCALE_EXTENT, type Frame } from '@/services/geo/atlas-projection.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useElementSize } from '@/react/hooks/use-element-size.ts';
import { useMapZoom } from '@/react/hooks/use-map-zoom.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';
import { CompassRose } from './compass-rose.tsx';
import { HatchDefs } from './hatch-defs.tsx';
import { WonderMarker } from './wonder-marker.tsx';

/** How much of the foot of the map the legend covers on a narrow screen. */
const LEGEND_SHARE = 0.36;

/** Above this width the legend is a card in the corner and stops eating the map's height. */
const CARD_LEGEND_WIDTH = 720;

/** What the detail panel covers of the map once it stops sliding and lies over it, in pixels. */
const PANEL_WIDTH = 352;

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
    const { t } = useTranslation();
    const format = useFormat();
    const { palette, text } = useServices();
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

    /*
     * Carries the view across a change of viewport, so the map never appears to fall away.
     *
     * The projection fits the world into whatever box it is given, so when the sheet docks and
     * takes a third of the map's width, the same zoom draws a third smaller world: the coastline
     * went from 1492 pixels across to 1023 in a single frame, which reads as the map lurching out
     * before the flight has even begun. The zoom is rescaled by the ratio between the two
     * projections and re-centred on the same place, so the picture is identical either side of
     * the resize and the flight starts from where the reader was already looking.
     */
    const carried = useRef<{ projection: AtlasProjection; frame: Frame } | null>(null);
    useLayoutEffect(() => {
        const before = carried.current;
        if (projection) carried.current = { projection, frame };
        if (!projection || !before || before.projection === projection) return;

        const middle: [number, number] = [
            (before.projection.width / 2 - before.frame.x) / before.frame.k,
            (before.projection.height / 2 - before.frame.y) / before.frame.k,
        ];
        const place = before.projection.placeOf(middle);
        if (!place) return;

        const anchor = projection.pointOf(place);
        if (!anchor) return;

        const k = before.frame.k * (before.projection.baseScale / projection.baseScale);
        const next = {
            k,
            x: projection.width / 2 - k * anchor[0],
            y: projection.height / 2 - k * anchor[1],
        };

        carried.current = { projection, frame: next };
        flyTo(next, false);
    }, [projection, frame, flyTo]);

    /*
     * Opening a civilization brings its realm into the frame; closing the sheet pulls back out.
     *
     * The flight waits a frame first. Docking the sheet takes a third of the map's width away,
     * so opening one fires this twice: once against the old viewport and again once the resize
     * has landed. Flying immediately means the first flight sets off for a frame that is about
     * to stop existing and the second has to correct it in mid-air. Deferring by a frame lets
     * the last word win — whichever run is still standing when the browser next paints is the
     * only one that flies, and it flies to a frame that is already right.
     */
    const focus = state.focused;
    const wide = useWideScreen();
    useEffect(() => {
        if (!projection) return;

        const frame = requestAnimationFrame(() => {
            // Wide, the panel lies over the right of the map; a realm centred under it is hidden.
            const covered = { right: focus && wide ? PANEL_WIDTH : 0 };

            if (!focus) {
                flyTo(projection.wholeWorld(covered));

                return;
            }

            const border = borders.get(focus);
            if (!border) return;

            flyTo(projection.frameFor(border.rings, covered));
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [focus, projection, borders, flyTo, wide]);

    const roseRadius = Math.min(ROSE_MAX, Math.min(size.width, size.height) * ROSE_SHARE);

    const traceLabel = state.showAll
        ? t('map.untraceAll')
        : t('map.traceAll', { count: standing.length, year: format.year(state.year) });

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
                    aria-label={t('app.mapAlt')}
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
                                            <title>{text.civilization(civilization.key, false).monument}</title>
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
                    aria-label={traceLabel}
                    title={traceLabel}
                >
                    <Layers size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="iron"
                    onClick={() => {
                        zoomBy(1.6);
                    }}
                    aria-label={t('map.zoomIn')}
                >
                    <Plus size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="iron"
                    onClick={() => {
                        zoomBy(1 / 1.6);
                    }}
                    aria-label={t('map.zoomOut')}
                >
                    <Minus size={18} aria-hidden />
                </button>
                <button
                    type="button"
                    className="iron"
                    onClick={() => {
                        if (projection) flyTo(projection.wholeWorld());
                    }}
                    aria-label={t('map.wholeWorld')}
                >
                    <Compass size={18} aria-hidden />
                </button>
            </div>
        </div>
    );
}
