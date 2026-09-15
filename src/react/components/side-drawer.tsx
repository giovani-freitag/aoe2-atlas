import type { ReactNode } from 'react';
import { Dialog, VisuallyHidden } from 'radix-ui';
import { useAtLeast } from '@/react/hooks/dom/use-breakpoint.ts';

export interface SideDrawerProps {
    /** Accessible name for the panel. */
    label: string;
    open: boolean;
    onClose: () => void;
    /** Which edge it comes in from. */
    side: 'left' | 'right';
    /** Class names for the panel itself, on top of the shared drawer ones. */
    className?: string;
    children: ReactNode;
}

/**
 * A panel that comes in from the side of the screen, and the behaviour that has to come with it.
 *
 * The roster and the preferences are the two halves of a pair — what is on the map comes in from
 * the left, how it is drawn comes in from the right — so they are the same panel mirrored, and
 * writing the mechanics twice would be writing two chances to drift apart.
 *
 * Modal on a phone, so focus cannot wander onto the map behind it and the rest of the page goes
 * inert; not modal where there is room, so the map stays live beside it. Modality is a prop here
 * rather than a mode the panel has to be closed and reopened to change, which is what a native
 * dialog demanded — a panel opened on a desktop and carried down to a phone width used to stay
 * non-modal, with the header and the year rail painted over it.
 *
 * It is deliberately not portalled, so that it keeps its place in the shell's own stacking order
 * rather than being lifted out of it.
 */
export function SideDrawer({ label, open, onClose, side, className, children }: SideDrawerProps) {
    /*
     * Below this the panel has nowhere to go but over everything, so it takes the whole side and
     * makes the rest inert. Above it there is map to spare: it stops at the year rail, and the
     * map and the rail stay live behind it.
     */
    const roomBeside = useAtLeast('sm');
    const modal = !roomBeside;

    return (
        <Dialog.Root
            open={open}
            modal={modal}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            {/* There is only a scrim to dim where the panel is modal; docked, it dims nothing. */}
            {modal ? <Dialog.Overlay className="drawer__scrim" /> : null}

            <Dialog.Content
                className={`drawer drawer--${side} leather ${className ?? ''}`.trim()}
                aria-label={label}
                aria-describedby={undefined}
                /*
                 * A modal panel has to be painted over the furniture as well as make it inert.
                 * The platform's own modal dialog did both at once by riding a layer above every
                 * z-index on the page; a panel that is an ordinary element has to be told, or the
                 * year rail shows through the one thing that is covering the map.
                 */
                data-modal={modal}
                onInteractOutside={(event) => {
                    /*
                     * Where the panel is a column of the layout rather than something laid over
                     * it, a click on the map beside it is a click on the map — not a dismissal.
                     */
                    if (!modal) event.preventDefault();
                }}
            >
                {/*
                 * The panel already carries a heading of its own, so this one is for the screen
                 * reader alone: the primitive names the dialog by it, and two visible titles
                 * would be the same words said twice.
                 */}
                <VisuallyHidden.Root asChild>
                    <Dialog.Title>{label}</Dialog.Title>
                </VisuallyHidden.Root>

                {children}
            </Dialog.Content>
        </Dialog.Root>
    );
}
