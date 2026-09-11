import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { useWikiHover } from '@/react/hooks/use-wiki-hover.ts';
import { CompassRose } from './compass-rose.tsx';
import { HatchDefs, HAZE } from './hatch-defs.tsx';
import { WikiCard } from './wiki-card.tsx';
import { MARKER_SIZE, WonderMarker } from './wonder-marker.tsx';

/** How far apart the shield and its Wonder must land before the pin and its leader are drawn. */
const APART = 6;

/** What the detail panel covers of the map once it stops sliding and lies over it, in pixels. */
const PANEL_WIDTH = 352;

/** The two points of a mark the Wikipedia preview can hang from. */
const SHIELD = 'shield';
const PIN = 'pin';

/** How far above the point the preview's tip is held, so it clears the mark it came from. */
const CLEAR_SHIELD = MARKER_SIZE / 2;
const CLEAR_PIN = 6;

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

        return new AtlasProjection({ width: size.width, height: size.height, kind: state.projection });
    }, [size.width, size.height, state.projection]);

    /*
     * The frame is painted onto the nodes that move, rather than rendered through React.
     *
     * Everything on this map that is laid out in screen space — thirty-five shields, their pins,
     * their leaders, and the hatch that has to keep its width on screen — depends on the zoom.
     * Pushing each gesture frame through React meant re-rendering all of it sixty times a second,
     * and the map visibly trailed the pointer: the transform reached the DOM every 34 ms while
     * dragging, with stalls past 78. The same numbers written straight onto the handful of
     * attributes that actually change cost nothing, so the map now keeps up with the hand.
     *
     * React is told the frame when the gesture ends, and repaints after any ordinary render, so
     * what is on screen and what React believes never drift apart.
     */
    const zoomed = useRef<SVGGElement>(null);
    const marksLayer = useRef<SVGGElement>(null);
    const defs = useRef<SVGDefsElement>(null);
    const haze = useRef<SVGFEGaussianBlurElement | null>(null);
    const hatches = useRef<SVGPatternElement[]>([]);
    const placed = useRef<
        {
            anchor: [number, number];
            wonder: [number, number];
            shield: SVGGElement | null;
            pin: SVGGElement | null;
            leader: SVGLineElement | null;
        }[]
    >([]);
    const painted = useRef<Frame>({ k: 1, x: 0, y: 0 });

    const paint = useCallback((next: Frame): void => {
        /*
         * A pan leaves the hatching alone. The patterns and the blur only exist to hold their
         * width on screen as the zoom changes, and rewriting them forces the browser to
         * re-rasterise every hatched realm and re-run a Gaussian blur — the most expensive thing
         * on the map, for no visible difference when the scale has not moved.
         */
        const rescaled = painted.current.k !== next.k;

        painted.current = next;

        zoomed.current?.setAttribute('transform', `translate(${next.x},${next.y}) scale(${next.k})`);

        // The nodes are looked up once per render, not once per frame: searching the tree sixty
        // times a second for thirty-five marks costs more than the writing ever did.
        for (const mark of placed.current) {
            const sx = next.k * mark.anchor[0] + next.x;
            const sy = next.k * mark.anchor[1] + next.y;
            const px = next.k * mark.wonder[0] + next.x;
            const py = next.k * mark.wonder[1] + next.y;
            const apart = Math.hypot(sx - px, sy - py) > APART;

            mark.shield?.setAttribute('transform', `translate(${sx - MARKER_SIZE / 2}, ${sy - MARKER_SIZE / 2})`);

            if (mark.pin) {
                mark.pin.setAttribute('transform', `translate(${px}, ${py})`);
                mark.pin.style.display = apart ? '' : 'none';
            }

            if (mark.leader) {
                mark.leader.setAttribute('x1', String(sx));
                mark.leader.setAttribute('y1', String(sy));
                mark.leader.setAttribute('x2', String(px));
                mark.leader.setAttribute('y2', String(py));
                mark.leader.style.display = apart ? '' : 'none';
            }
        }

        if (!rescaled) return;

        haze.current?.setAttribute('stdDeviation', String(HAZE / next.k));

        for (const pattern of hatches.current) {
            pattern.setAttribute('patternTransform', `rotate(${pattern.dataset.angle}) scale(${1 / next.k})`);
        }
    }, []);

    /*
     * Hovering a Wonder brings up the same Wikipedia card the sheet's link does.
     *
     * The pin *is* the monument, so it is the one thing on the map a reader is most likely to
     * want to know about, and the card is already built and already cached. Moving the map takes
     * it away again: the card is pinned to a screen position, and a pan would leave it hanging
     * over ground the monument has left.
     */
    const wiki = useWikiHover();
    const dismiss = wiki.leave;
    const onFrame = useCallback(
        (next: Frame): void => {
            paint(next);
            dismiss();
        },
        [paint, dismiss],
    );

    const { frame, flyTo, zoomBy } = useMapZoom(svg, {
        width: size.width,
        height: size.height,
        scaleExtent: SCALE_EXTENT,
        onFrame,
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

    const lit = state.hovered ? shapes.find((entry) => entry.civilization.key === state.hovered) : undefined;

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

    /*
     * What the camera was last sent somewhere for.
     *
     * Moving the year rail replaces every border on the map, and the flight used to be rebuilt
     * along with them — so scrubbing through the centuries kept throwing the reader back out to
     * the whole world. The century is not a reason to move the camera: whoever has zoomed into
     * the Aegean and is walking it forward a hundred years at a time wants to stay in the
     * Aegean. Only opening or closing a civilization moves it, and so does a change of viewport
     * or projection, because after those the old frame no longer means the same thing.
     *
     * It is written when the flight actually sets off, not when it is scheduled. A flight can be
     * cancelled and rebuilt before its frame arrives — the borders for the century land a moment
     * after the sheet opens — and marking it as done too early lost the flight altogether.
     */
    const flown = useRef<{ focus: string | null; wide: boolean; projection: AtlasProjection } | null>(null);
    useEffect(() => {
        if (!projection) return;

        const was = flown.current;
        if (was && was.focus === focus && was.wide === wide && was.projection === projection) return;

        const frame = requestAnimationFrame(() => {
            // Wide, the panel lies over the right of the map; a realm centred under it is hidden.
            const covered = { right: focus && wide ? PANEL_WIDTH : 0 };

            if (!focus) {
                flown.current = { focus, wide, projection };
                flyTo(projection.wholeWorld(covered));

                return;
            }

            // No border yet means the century is still on its way; leave this unflown and let
            // the run that arrives with the geometry do it.
            const border = borders.get(focus);
            if (!border) return;

            flown.current = { focus, wide, projection };
            flyTo(projection.frameFor(border.rings, covered));
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [focus, projection, borders, flyTo, wide]);

    const roseRadius = Math.min(ROSE_MAX, Math.min(size.width, size.height) * ROSE_SHARE);

    // Which civilization is being previewed, and which of its two points the card hangs from.
    const [previewing, hungOn] = (wiki.shown?.key ?? '').split(':');

    /*
     * Where the map's own corner is on the screen.
     *
     * The preview card is laid out against the viewport, because it has to be free of the map's
     * clipping and to know how near the edge of the screen it has come. The Wonder's position is
     * in the map's coordinates, so the two are joined by this offset — held in state rather than
     * read in an effect, because the card measures itself before its parent gets a turn.
     */
    const [origin, setOrigin] = useState({ x: 0, y: 0 });
    useLayoutEffect(() => {
        const box = holder.current?.getBoundingClientRect();
        if (!box) return;

        setOrigin((was) => (was.x === box.left && was.y === box.top ? was : { x: box.left, y: box.top }));
    }, [holder, size.width, size.height]);

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

    /*
     * After any ordinary render, hand the painter the current marks and let it have the last
     * word on where they sit. React has just written positions from the frame it last heard
     * about, which during a gesture is older than what is on screen.
     */
    useLayoutEffect(() => {
        const layer = marksLayer.current;
        placed.current = marks.map(({ civilization, anchor, wonder }) => {
            const node = layer?.querySelector<SVGGElement>(`[data-civ="${civilization.key}"]`) ?? null;

            return {
                anchor,
                wonder,
                shield: node?.querySelector<SVGGElement>('.marker') ?? null,
                pin: node?.querySelector<SVGGElement>('.pin') ?? null,
                leader: node?.querySelector<SVGLineElement>('.leader') ?? null,
            };
        });

        haze.current = defs.current?.querySelector('feGaussianBlur') ?? null;
        hatches.current = [...(defs.current?.querySelectorAll<SVGPatternElement>('pattern[data-angle]') ?? [])];

        // React has just rebuilt these nodes, so the guard must not treat this as a pan.
        const { k, x, y } = painted.current;
        painted.current = { k: Number.NaN, x, y };
        paint({ k, x, y });
    });

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
                    <HatchDefs ref={defs} styles={styles} scale={frame.k} />

                    <g ref={zoomed} transform={`translate(${frame.x},${frame.y}) scale(${frame.k})`}>
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
                                    onPointerEnter={() => {
                                        dispatch({ type: 'hover', value: civilization.key });
                                    }}
                                    onPointerLeave={() => {
                                        dispatch({ type: 'hover', value: null });
                                    }}
                                />
                            );
                        })}

                        {/*
                         * The realm under the pointer, washed over in its own colour.
                         *
                         * A realm is one shape however many pieces it comes in, and the pieces are
                         * the problem: a hue shared with its neighbours in the same region and a
                         * hatch two degrees off theirs leaves a reader guessing which island in the
                         * Aegean belongs to which empire. Lighting all of it at once answers that,
                         * and it is drawn after every realm rather than in its own place in the
                         * order, so nothing traced later paints over the answer.
                         */}
                        {lit ? (
                            <>
                                {/*
                                 * A dark casing under the colour, because the colour is the very
                                 * thing that cannot be relied on here: the realms that are hardest
                                 * to tell apart are hardest precisely because they share a hue. Ink
                                 * around the edge reads against parchment, against sea and against
                                 * every hue in the palette.
                                 */}
                                <path className="atlas__lit__edge" d={lit.path} vectorEffect="non-scaling-stroke" />
                                <path
                                    className="atlas__lit"
                                    d={lit.path}
                                    fill={palette.styleOf(lit.civilization.key).colour}
                                    stroke={palette.styleOf(lit.civilization.key).colour}
                                    vectorEffect="non-scaling-stroke"
                                />
                            </>
                        ) : null}
                    </g>

                    {state.ruled ? (
                        <CompassRose
                            at={[size.width - roseRadius - 18, roseRadius + 26]}
                            radius={roseRadius}
                        />
                    ) : null}

                    <g className="atlas__marks" ref={marksLayer}>
                        {marks.map(({ civilization, anchor, wonder }) => {
                            const at: [number, number] = [frame.k * anchor[0] + frame.x, frame.k * anchor[1] + frame.y];
                            const pin: [number, number] = [frame.k * wonder[0] + frame.x, frame.k * wonder[1] + frame.y];
                            const apart = Math.hypot(at[0] - pin[0], at[1] - pin[1]) > 6;
                            const lit = state.focused === civilization.key || state.hovered === civilization.key;
                            const colour = palette.styleOf(civilization.key).colour;

                            return (
                                <g
                                    key={civilization.key}
                                    data-civ={civilization.key}
                                    onPointerOver={(event) => {
                                        // A tap opens the sheet, which carries the link itself.
                                        if (event.pointerType !== 'mouse') return;

                                        /*
                                         * The card hangs off whichever of the mark's two points
                                         * the pointer is actually on. Always hanging it off the
                                         * Wonder meant that resting on a shield in the middle of
                                         * a realm threw the card a hundred pixels away, over a
                                         * pin the reader was not pointing at.
                                         */
                                        const on = (event.target as Element).closest('.pin') ? PIN : SHIELD;

                                        wiki.enter(
                                            `${civilization.key}:${on}`,
                                            civilization.wonder.wikipediaLang,
                                            civilization.wonder.wikipedia,
                                        );
                                    }}
                                    onPointerLeave={dismiss}
                                >
                                    {lit ? (
                                        <line
                                            className="leader"
                                            x1={at[0]}
                                            y1={at[1]}
                                            x2={pin[0]}
                                            y2={pin[1]}
                                            style={{ display: apart ? '' : 'none' }}
                                        />
                                    ) : null}
                                    {
                                        <g
                                            className="pin"
                                            style={{ display: apart ? '' : 'none' }}
                                            transform={`translate(${pin[0]}, ${pin[1]})`}
                                            onClick={() => {
                                                dispatch({ type: 'focus', value: civilization.key });
                                            }}
                                        >
                                            <title>{text.civilization(civilization.key, false).monument}</title>
                                            <circle className="pin__dot" r={5} stroke={colour} />
                                            <circle className="pin__core" r={1.8} />
                                        </g>
                                    }
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

            {/*
             * The card hangs off a point rather than a line of text, so the anchor is a marker of
             * zero size sitting exactly on the Wonder. Everything else about the placement — the
             * slide back onto the screen, the flip below, the tip — is the card's own doing, and
             * is the same here as it is on the link in the sheet.
             */}
            {marks.map(({ civilization, anchor, wonder }) => {
                if (civilization.key !== previewing || !wiki.shown) return null;

                const on = hungOn === PIN ? wonder : anchor;
                const clear = hungOn === PIN ? CLEAR_PIN : CLEAR_SHIELD;

                return (
                    <div
                        key={civilization.key}
                        className="atlas__preview"
                        style={{
                            left: origin.x + frame.k * on[0] + frame.x,
                            top: origin.y + frame.k * on[1] + frame.y - clear,
                            // Tall as the mark, so the card clears it whether it opens above or below.
                            height: clear * 2,
                        }}
                    >
                        <WikiCard summary={wiki.shown.summary} />
                    </div>
                );
            })}

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
