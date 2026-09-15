import type { ReactNode } from 'react';
import { HoverCard as Primitive } from 'radix-ui';

/** The tip, in pixels: wide enough to read as an arrow, shallow enough to stay a hint. */
const ARROW_WIDTH = 14;
const ARROW_HEIGHT = 7;

export interface HoverCardProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** How long a pointer must rest before the card is asked for. */
    openDelay?: number;
    closeDelay?: number;
    children: ReactNode;
}

export interface HoverCardPanelProps {
    className: string;
    /** Class for the tip, which is an SVG the primitive keeps pointed at the anchor. */
    arrowClassName: string;
    /**
     * Which way the card opens. It falls back to the other side on its own when there is no room.
     */
    side?: 'top' | 'bottom';
    /**
     * Where the card sits along the anchor: `start` hangs it from the anchor's leading edge, for
     * a line of text; `center` puts it over the middle, for a mark that is a point.
     */
    align?: 'start' | 'center' | 'end';
    /** The space between the thing the card came from and the tip of the card, in pixels. */
    gap?: number;
    /** How close to the edge of the screen the card may come, in pixels. */
    collisionPadding?: number;
    children: ReactNode;
}

/**
 * A card that appears beside whatever the pointer is resting on.
 *
 * Sliding back onto the screen, flipping to the other side when there is no room, and keeping
 * the tip over the thing the card came from are all the primitive's doing. They used to be
 * thirty lines of measuring in a layout effect, which had to run again on every scroll it did
 * not know about.
 */
export function HoverCard({ open, onOpenChange, openDelay, closeDelay, children }: HoverCardProps) {
    return (
        <Primitive.Root open={open} onOpenChange={onOpenChange} openDelay={openDelay} closeDelay={closeDelay}>
            {children}
        </Primitive.Root>
    );
}

/** The thing the card hangs off, when it is the element the reader points at. */
export function HoverCardTrigger({ children }: { children: ReactNode }) {
    return <Primitive.Trigger asChild>{children}</Primitive.Trigger>;
}

/**
 * The point the card hangs off, when that is not the element the reader points at.
 *
 * The primitive has no anchor separate from its trigger: what the card is measured against is
 * whatever opens it. A card told from outside whether it is open never asks its trigger
 * anything, so a marker of no size standing on the point serves as both.
 */
export function HoverCardAnchor({ children }: { children: ReactNode }) {
    return <Primitive.Trigger asChild>{children}</Primitive.Trigger>;
}

/**
 * The card itself.
 *
 * Not portalled: it keeps its place in the stacking order of the panel it belongs to. Nothing is
 * clipped by that panel's scroll anyway, because the primitive positions it against the viewport
 * rather than against the box it sits in.
 */
export function HoverCardPanel({
    className,
    arrowClassName,
    side = 'top',
    align = 'center',
    gap = 8,
    collisionPadding = 8,
    children,
}: HoverCardPanelProps) {
    return (
        <Primitive.Content
            className={className}
            side={side}
            align={align}
            /*
             * The primitive adds the tip's height to whatever offset it is given, so what is
             * asked for here is the gap less the tip — otherwise a card asked to stand eight
             * pixels off its anchor stands fifteen.
             */
            sideOffset={gap - ARROW_HEIGHT}
            collisionPadding={collisionPadding}
        >
            {children}
            <Primitive.Arrow className={arrowClassName} width={ARROW_WIDTH} height={ARROW_HEIGHT} />
        </Primitive.Content>
    );
}
