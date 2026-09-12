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

/**
 * Whether the reader has asked for less movement.
 *
 * The stylesheet already cuts every transition and animation to nothing for them, but a flight
 * across the map is neither: it is d3 interpolating a transform sixty times a second, and it
 * went on gliding for anyone who had asked it not to. Asked each time rather than once, because
 * the setting can be changed while the atlas is open.
 */
function stillness(): boolean {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

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
    /**
     * Called for every frame of a gesture or a flight, before React hears about it.
     *
     * Dragging fires this sixty times a second, and re-rendering the whole map that often is
     * what made the map lag behind the pointer. The handler paints the frame straight onto the
     * nodes that move; React is told once the gesture settles.
     */
    onFrame?: (frame: Frame) => void;
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
    const { width, height, scaleExtent, onFrame } = options;

    // Read through a ref so a new handler each render does not rebind the gesture mid-drag.
    const paint = useRef(onFrame);
    useEffect(() => {
        paint.current = onFrame;
    }, [onFrame]);

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
                const next = { k: event.transform.k, x: event.transform.x, y: event.transform.y };

                if (paint.current) paint.current(next);
                else setFrame(next);
            })
            /*
             * React learns the frame when the movement stops, not while it is happening. Every
             * mark is laid out in screen space, so a frame in state means re-rendering all of
             * them — which is the work that made a drag trail behind the pointer. The painter
             * has already put the same numbers on the nodes; this only brings React level again
             * so the next ordinary render agrees with what is on screen.
             */
            .on('end', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
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

        if (animated && !stillness()) {
            current.behaviour.transform(selection.transition().duration(FLIGHT_MS), transform);
            return;
        }

        current.behaviour.transform(selection, transform);
    }, []);

    const zoomBy = useCallback((factor: number): void => {
        const current = bound.current;
        if (!current) return;

        const selection = select(current.element);

        if (stillness()) {
            current.behaviour.scaleBy(selection, factor);

            return;
        }

        current.behaviour.scaleBy(selection.transition().duration(STEP_MS), factor);
    }, []);

    return { frame, flyTo, zoomBy };
}
