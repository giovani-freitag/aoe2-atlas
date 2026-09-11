import { useCallback, useEffect, useRef, useState } from 'react';
import { interpolate } from 'd3-interpolate';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from 'd3-zoom';
// Selection.transition() is bolted on by this module; importing it is what makes flights glide.
import 'd3-transition';
import type { Frame } from '@/services/geo/atlas-projection.ts';

/** How long the map takes to glide to a realm, in milliseconds. */
const FLIGHT_MS = 640;

/** How long a button-driven zoom step takes. */
const STEP_MS = 220;

export interface MapZoom {
    /** The current pan and scale, to hang on the SVG group. */
    frame: Frame;
    /** Glides the map to a frame; pass `false` to jump there instead. */
    flyTo: (frame: Frame, animated?: boolean) => void;
    /** Multiplies the current scale, keeping the centre of the viewport fixed. */
    zoomBy: (factor: number) => void;
}

export interface MapZoomOptions {
    width: number;
    height: number;
    scaleExtent: readonly [number, number];
}

/** The element and the behaviour bound to it, held together so a flight needs only one lookup. */
interface Bound {
    element: SVGSVGElement;
    behaviour: ZoomBehavior<SVGSVGElement, unknown>;
}

/**
 * Wires d3-zoom to an SVG element and mirrors its transform into React state.
 *
 * d3 owns the gesture because it already handles wheel, pinch, drag and momentum together;
 * React owns the resulting numbers because the wonder markers are laid out in screen space and
 * have to move with the map without being scaled by it.
 *
 * @param svg - The element the gestures are read from.
 * @param options - Viewport size and the scale limits the map allows.
 */
export function useMapZoom(svg: React.RefObject<SVGSVGElement | null>, options: MapZoomOptions): MapZoom {
    // The compiler cannot memoize a hook whose whole job is to reach into a live DOM node, and
    // its inferred dependency on `svg.current` would rebind the gesture on every render.
    'use no memo';

    const [frame, setFrame] = useState<Frame>({ k: 1, x: 0, y: 0 });
    const bound = useRef<Bound | null>(null);
    const { width, height, scaleExtent } = options;

    useEffect(() => {
        const element = svg.current;
        if (!element || width === 0 || height === 0) return;

        const behaviour = zoom<SVGSVGElement, unknown>()
            /*
             * A straight flight instead of d3's default arc.
             *
             * The default interpolator is Van Wijk and Nuij's: between two views far apart it
             * pulls the camera up and away before coming back down, which is optimal for a long
             * traverse and reads as a fault on a short one. Going from Byzantium to the Mongols
             * it dropped the scale from 10.5 to 4.3 before settling at 5.4 — the map appeared to
             * fall out to the whole world and then recover. Interpolating the transform directly
             * gives a plain pan and scale from wherever the reader is.
             */
            .interpolate(interpolate)
            .scaleExtent([scaleExtent[0], scaleExtent[1]])
            .translateExtent([
                [0, 0],
                [width, height],
            ])
            .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
                setFrame({ k: event.transform.k, x: event.transform.x, y: event.transform.y });
            });

        bound.current = { element, behaviour };
        select(element).call(behaviour);

        return () => {
            select(element).on('.zoom', null);
            bound.current = null;
        };
    }, [svg, width, height, scaleExtent]);

    const flyTo = useCallback((target: Frame, animated = true): void => {
        const current = bound.current;
        if (!current) return;

        const selection = select(current.element);
        const transform = zoomIdentity.translate(target.x, target.y).scale(target.k);

        if (animated) {
            current.behaviour.transform(selection.transition().duration(FLIGHT_MS), transform);
            return;
        }

        current.behaviour.transform(selection, transform);
    }, []);

    const zoomBy = useCallback((factor: number): void => {
        const current = bound.current;
        if (!current) return;

        current.behaviour.scaleBy(select(current.element).transition().duration(STEP_MS), factor);
    }, []);

    return { frame, flyTo, zoomBy };
}
