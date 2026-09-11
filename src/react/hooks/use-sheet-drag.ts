import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * How much of the screen the sheet covers at each stop, tallest last.
 *
 * It opens at the first of them. A civilization is opened to see its ground on the map, and a
 * panel that takes two thirds of a phone the moment you tap answers the question by hiding the
 * answer: the name, the region and the area are enough to start with, and the rest is a drag
 * away. The map is told about this one and frames the realm in what is left.
 */
const STOPS = [0.34, 0.62, 0.88] as const;

/** What the sheet covers when it first arrives, as a share of the screen. */
export const SHEET_PEEK = STOPS[0];

/** How far a drag must travel before it counts as a drag rather than a tap. */
const SLOP = 6;

/**
 * Dragged below this share of the viewport, the sheet is being thrown away rather than resized.
 *
 * Well under the first stop, or the peek the sheet opens at would be a hair's breadth from
 * being dismissed by the smallest wobble of a thumb.
 */
const DISMISS_BELOW = 0.22;

export interface SheetDragConfig {
    /** Whether the sheet is on screen; coming back resets it to the peek. */
    open: boolean;
    /** Called when the sheet is thrown past the bottom stop. */
    onDismiss: () => void;
}

export interface SheetDrag {
    /** The share of the viewport the sheet currently covers. */
    height: number;
    /** True while a finger is on the grip, so the sheet can drop its transition. */
    dragging: boolean;
    /** Handlers for the grip. */
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    /** Steps to the next stop, wrapping round; this is what a tap or the keyboard does. */
    cycle: () => void;
    /** Drops the sheet back to the peek, for anything inside it that has business on the map. */
    collapse: () => void;
}

/**
 * Lets the detail sheet be dragged between three heights.
 *
 * A grip that looks draggable and is not is worse than no grip at all, so this is the real
 * thing: the sheet follows the finger, snaps to the nearest stop on release, and a tap or the
 * Enter key steps to the next one for anyone not using a touchscreen. Dragged far enough down
 * it is dismissed, which is why the sheet carries no close button of its own.
 *
 * @param config - Whether the sheet is open, and what to do when it is thrown away.
 */
export function useSheetDrag({ open, onDismiss }: SheetDragConfig): SheetDrag {
    const [stop, setStop] = useState(0);
    const [height, setHeight] = useState<number>(STOPS[0]);
    const [dragging, setDragging] = useState(false);
    const origin = useRef<{ y: number; height: number; moved: boolean } | null>(null);
    const [wasOpen, setWasOpen] = useState(open);

    /*
     * A dismissed sheet keeps the height the finger left it at, so the slide out starts from
     * where the reader let go instead of snapping back up first. That height has to be undone
     * before the sheet is seen again, and the render that reopens it is the only moment early
     * enough — an effect would run after the browser had already painted the wrong size.
     */
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setStop(0);
            setHeight(STOPS[0]);
        }
    }

    const collapse = useCallback(() => {
        setStop(0);
        setHeight(STOPS[0]);
    }, []);

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

                setHeight(Math.min(STOPS[STOPS.length - 1], start.height + travelled / window.innerHeight));
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
                    if (current < DISMISS_BELOW) {
                        onDismiss();

                        return current;
                    }

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
        [stop, cycle, onDismiss],
    );

    return { height, dragging, onPointerDown, cycle, collapse };
}
