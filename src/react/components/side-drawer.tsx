import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';

export interface SideDrawerProps {
    /** Accessible name for the panel. */
    label: string;
    open: boolean;
    onClose: () => void;
    /** Which edge it comes in from. */
    side: 'left' | 'right';
    /** Stays open on a wide screen whatever `open` says, for a panel that docks into the layout. */
    pinnedWhenWide?: boolean;
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
 * It is a `dialog`, which is what buys the behaviour: modal on a phone so the focus cannot wander
 * onto the map behind it and Escape closes it, and without a modal where there is room, so the
 * map stays live beside it. A dialog does not close when its backdrop is clicked, so that is
 * worked out from where the click landed — which is what lets the drawer go without a close
 * button at all. Tap anywhere off it, or press Escape.
 */
export function SideDrawer({ label, open, onClose, side, pinnedWhenWide, className, children }: SideDrawerProps) {
    const wide = useWideScreen();
    const dialog = useRef<HTMLDialogElement>(null);
    const pinned = wide && pinnedWhenWide === true;

    /** Which of the two modes the panel is currently open in, so a change of width is noticed. */
    const openedWide = useRef<boolean | null>(null);

    /** Set while the panel is being reopened in the other mode, so that close is not reported. */
    const swapping = useRef(false);

    useEffect(() => {
        const element = dialog.current;
        if (!element) return;

        const shouldOpen = pinned || open;

        if (!shouldOpen) {
            if (element.open) element.close();
            openedWide.current = null;

            return;
        }

        /*
         * A dialog cannot change modality while it is open, and the two modes differ in the
         * things this layout depends on: a modal one rides the top layer, above every z-index on
         * the page, and makes the rest inert. Carrying the mode the panel was opened in across a
         * change of width left a panel opened on a desktop still non-modal on a phone, where the
         * header pill and the year rail are painted over it — the rail covering the very line
         * that credits where the borders came from.
         */
        if (element.open && openedWide.current === wide) return;
        if (element.open) {
            swapping.current = true;
            element.close();
        }

        openedWide.current = wide;
        if (wide) element.show();
        else element.showModal();
    }, [wide, pinned, open]);

    const reportClose = (): void => {
        if (swapping.current) {
            swapping.current = false;

            return;
        }

        openedWide.current = null;
        onClose();
    };

    const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>): void => {
        if (pinned || event.target !== event.currentTarget) return;

        const box = event.currentTarget.getBoundingClientRect();
        const inside =
            event.clientX >= box.left &&
            event.clientX <= box.right &&
            event.clientY >= box.top &&
            event.clientY <= box.bottom;

        if (!inside) onClose();
    };

    return (
        <dialog
            className={`drawer drawer--${side} leather ${className ?? ''}`.trim()}
            ref={dialog}
            aria-label={label}
            onCancel={onClose}
            onClose={reportClose}
            onClick={closeOnBackdrop}
        >
            {children}
        </dialog>
    );
}
