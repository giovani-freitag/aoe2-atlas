import { type ReactNode } from 'react';
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

    /*
     * An ordinary panel rather than a popover, on purpose.
     *
     * The popover API puts an element in the top layer, where nothing on the page can be painted
     * over it — so a sheet rising from the foot of the screen swept straight across the year
     * rail on its way up, and back across it on the way down. The rail is the axis the whole
     * atlas is read against and it should never be covered, least of all by an animation. As a
     * plain fixed panel the sheet takes a place in the stacking order: over the map, under the
     * furniture, disappearing behind the rail instead of across it.
     */
    return (
        <div
            className={`sheet leather sheet--${wide}`}
            role="dialog"
            aria-label={label}
            aria-hidden={open ? undefined : true}
            data-open={open}
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
