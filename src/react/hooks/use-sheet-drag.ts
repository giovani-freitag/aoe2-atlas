import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/** How much of the screen the sheet covers at each stop, tallest last. */
const STOPS = [0.42, 0.62, 0.88] as const;

/** How far a drag must travel before it counts as a drag rather than a tap. */
const SLOP = 6;

export interface SheetDrag {
    /** The share of the viewport the sheet currently covers. */
    height: number;
    /** True while a finger is on the grip, so the sheet can drop its transition. */
    dragging: boolean;
    /** Handlers for the grip. */
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    /** Steps to the next stop, wrapping round; this is what a tap or the keyboard does. */
    cycle: () => void;
}

/**
 * Lets the detail sheet be dragged between three heights.
 *
 * A grip that looks draggable and is not is worse than no grip at all, so this is the real
 * thing: the sheet follows the finger, snaps to the nearest stop on release, and a tap or the
 * Enter key steps to the next one for anyone not using a touchscreen.
 */
export function useSheetDrag(): SheetDrag {
    const [stop, setStop] = useState(1);
    const [height, setHeight] = useState<number>(STOPS[1]);
    const [dragging, setDragging] = useState(false);
    const origin = useRef<{ y: number; height: number; moved: boolean } | null>(null);

    const cycle = useCallback(() => {
        setStop((current) => {
            const next = (current + 1) % STOPS.length;
            setHeight(STOPS[next]);

            return next;
        });
    }, []);

    const onPointerDown = useCallback(
        (event: ReactPointerEvent<HTMLElement>): void => {
            const grip = event.currentTarget;
            origin.current = { y: event.clientY, height: STOPS[stop], moved: false };
            grip.setPointerCapture(event.pointerId);
            setDragging(true);

            const move = (moving: globalThis.PointerEvent): void => {
                const start = origin.current;
                if (!start) return;

                const travelled = start.y - moving.clientY;
                if (Math.abs(travelled) > SLOP) start.moved = true;

                setHeight(clamp(start.height + travelled / window.innerHeight));
            };

            const release = (): void => {
                const start = origin.current;
                grip.releasePointerCapture(event.pointerId);
                grip.removeEventListener('pointermove', move);
                grip.removeEventListener('pointerup', release);
                grip.removeEventListener('pointercancel', release);
                origin.current = null;
                setDragging(false);

                if (!start?.moved) {
                    cycle();

                    return;
                }

                setHeight((current) => {
                    const nearest = STOPS.reduce((best, candidate) =>
                        Math.abs(candidate - current) < Math.abs(best - current) ? candidate : best,
                    );
                    setStop(STOPS.indexOf(nearest));

                    return nearest;
                });
            };

            grip.addEventListener('pointermove', move);
            grip.addEventListener('pointerup', release);
            grip.addEventListener('pointercancel', release);
        },
        [stop, cycle],
    );

    return { height, dragging, onPointerDown, cycle };
}

function clamp(share: number): number {
    return Math.min(STOPS[STOPS.length - 1], Math.max(STOPS[0], share));
}
