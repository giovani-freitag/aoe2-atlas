import { useEffect, useMemo, useRef } from 'react';
import { Minus, Plus, Shrink } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { LAND_RINGS } from '@/data/dataset.ts';
import { AtlasProjection } from '@/services/geo/atlas-projection.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useElementSize } from '@/react/hooks/use-element-size.ts';
import { useMapZoom } from '@/react/hooks/use-map-zoom.ts';
import type { ColourScheme } from '@/react/hooks/use-colour-scheme.ts';
import { HatchDefs } from './hatch-defs.tsx';
import { WonderMarker } from './wonder-marker.tsx';

export interface AtlasMapProps {
    /** The civilizations the current filters leave, which is what gets a marker. */
    visible: readonly Civilization[];
    /** The realms whose border is drawn, in draw order. */
    drawn: readonly Civilization[];
    scheme: ColourScheme;
}

/**
 * The atlas: an equal-area world with realms hatched over it and Wonders standing on their sites.
 *
 * Panning and zooming move a single SVG group, so the projected paths are computed once per
 * viewport size rather than once per frame. The markers ride outside that group and are placed
 * by applying the same transform by hand, which is what keeps them a constant size.
 */
export function AtlasMap({ visible, drawn, scheme }: AtlasMapProps) {
    const { atlas, palette } = useServices();
    const { state, dispatch } = useAtlas();
    const [holder, size] = useElementSize<HTMLDivElement>();
    const svg = useRef<SVGSVGElement>(null);

    const projection = useMemo(
        () => (size.width > 0 && size.height > 0 ? new AtlasProjection({ width: size.width, height: size.height }) : null),
        [size.width, size.height],
    );

    const { frame, flyTo, zoomBy } = useMapZoom(svg, {
        width: size.width,
        height: size.height,
        scaleExtent: AtlasProjection.scaleExtent,
    });

    const base = useMemo(() => {
        if (!projection) return null;

        return {
            sphere: projection.spherePath(),
            graticule: projection.graticulePath(),
            land: projection.pathOf(LAND_RINGS),
        };
    }, [projection]);

    const territories = useMemo(() => {
        if (!projection) return [];

        return drawn.map((civilization) => ({
            civilization,
            path: projection.pathOf(civilization.territory.rings),
        }));
    }, [projection, drawn]);

    const drawnStyles = useMemo(
        () => territories.map((entry) => palette.styleOf(entry.civilization.key)),
        [territories, palette],
    );

    // Choosing a civilization brings its realm into the frame; clearing the choice pulls back out.
    const focus = state.selected;
    useEffect(() => {
        if (!projection) return;

        if (!focus) {
            flyTo(projection.wholeWorld());
            return;
        }

        const civilization = atlas.find(focus);
        if (!civilization) return;

        flyTo(projection.frameFor(civilization.territory.rings));
    }, [focus, projection, atlas, flyTo]);

    const markers = useMemo(() => {
        if (!projection) return [];

        return visible.flatMap((civilization) => {
            const point = projection.pointOf(civilization.markerAt);
            if (!point) return [];

            return [{ civilization, point }];
        });
    }, [projection, visible]);

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
                    <HatchDefs styles={drawnStyles} scheme={scheme} scale={frame.k} />

                    <g transform={`translate(${frame.x},${frame.y}) scale(${frame.k})`}>
                        <path className="atlas__sea" d={base.sphere} />
                        <path className="atlas__graticule" d={base.graticule} vectorEffect="non-scaling-stroke" />
                        <path className="atlas__land" d={base.land} vectorEffect="non-scaling-stroke" />
                        <path className="atlas__rim" d={base.sphere} vectorEffect="non-scaling-stroke" />

                        {territories.map(({ civilization, path }) => {
                            const style = palette.styleOf(civilization.key);
                            const colour = scheme === 'dark' ? style.dark : style.light;

                            return (
                                <path
                                    key={civilization.key}
                                    className="atlas__realm"
                                    data-highlighted={state.hovered === civilization.key}
                                    data-selected={state.selected === civilization.key}
                                    d={path}
                                    fill={`url(#${style.patternId})`}
                                    stroke={colour}
                                    vectorEffect="non-scaling-stroke"
                                />
                            );
                        })}
                    </g>

                    <g className="atlas__markers">
                        {markers.map(({ civilization, point }) => {
                            const style = palette.styleOf(civilization.key);

                            return (
                                <WonderMarker
                                    key={civilization.key}
                                    civilization={civilization}
                                    at={[frame.k * point[0] + frame.x, frame.k * point[1] + frame.y]}
                                    colour={scheme === 'dark' ? style.dark : style.light}
                                    faded={state.year !== null && !civilization.standingIn(state.year)}
                                    active={state.selected === civilization.key}
                                    highlighted={state.hovered === civilization.key}
                                    onSelect={(key) => {
                                        dispatch({ type: 'select', value: state.selected === key ? null : key });
                                    }}
                                    onHover={(key) => {
                                        dispatch({ type: 'hover', value: key });
                                    }}
                                />
                            );
                        })}
                    </g>
                </svg>
            ) : null}

            <div className="atlas__controls">
                <button
                    type="button"
                    onClick={() => {
                        zoomBy(1.6);
                    }}
                    aria-label="Aproximar"
                >
                    <Plus size={16} aria-hidden />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        zoomBy(1 / 1.6);
                    }}
                    aria-label="Afastar"
                >
                    <Minus size={16} aria-hidden />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (projection) flyTo(projection.wholeWorld());
                    }}
                    aria-label="Ver o mundo inteiro"
                >
                    <Shrink size={16} aria-hidden />
                </button>
            </div>

            <p className="atlas__projection">Projeção Equal Earth · áreas comparáveis</p>
        </div>
    );
}
