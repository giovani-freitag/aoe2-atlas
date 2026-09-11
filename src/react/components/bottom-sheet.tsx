import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSheetDrag } from '@/react/hooks/use-sheet-drag.ts';
import { useWideScreen } from '@/react/hooks/use-wide-screen.ts';

export interface BottomSheetProps {
    /** Accessible name for the panel. */
    label: string;
    open: boolean;
    onClose: () => void;
    /**
     * Where the sheet goes once the screen is wide enough to stop sliding.
     *
     * `dock` pulls it into the layout grid as the right-hand column; `float` leaves it as a
     * card in the corner. Narrow, both are the same sheet from the bottom.
     */
    wide: 'dock' | 'float';
    /** What sits beside the grip: usually a title and a line under it. */
    head: ReactNode;
    children: ReactNode;
}

/**
 * The one offcanvas sheet every panel that rises from the bottom is made of.
 *
 * There is no close button. The grip drags the sheet between three heights and throws it away
 * past the lowest, a tap on it steps to the next height, and Escape or tapping the map closes
 * it — so a cross would be a fourth way to do what three already do. On a wide screen the
 * panel stops sliding up from the foot and comes in from the side or sits in a corner, over the
 * map rather than beside it, so the grip goes away rather than pretending to be draggable.
 */
export function BottomSheet({ label, open, onClose, wide, head, children }: BottomSheetProps) {
    const { t } = useTranslation();
    const isWide = useWideScreen();
    const drag = useSheetDrag({ open, onDismiss: onClose });
    const sheet = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = sheet.current;
        if (!element) return;

        const showing = element.matches(':popover-open');
        if (open === showing) return;

        if (open) element.showPopover();
        else element.hidePopover();
    }, [open]);

    return (
        <div
            className={`sheet leather sheet--${wide}`}
            ref={sheet}
            popover="manual"
            aria-label={label}
            data-dragging={drag.dragging}
            style={isWide ? undefined : { height: `${drag.height * 100}dvh` }}
        >
            {/* The grip resizes a sheet that slides; wide, neither sheet slides, so it would be a lie. */}
            {isWide ? null : (
                <button
                    type="button"
                    className="sheet__grip"
                    onPointerDown={drag.onPointerDown}
                    aria-label={t('sheet.grip')}
                >
                    <span aria-hidden />
                </button>
            )}

            <header className="sheet__head">{head}</header>

            <div className="sheet__body">{children}</div>
        </div>
    );
}
