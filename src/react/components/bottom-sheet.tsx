import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, VisuallyHidden } from 'radix-ui';
import { useSheetDrag } from '@/react/hooks/dom/use-sheet-drag.ts';
import { SheetProviderContext } from '@/react/providers/sheet-context.ts';
import { useAtLeast } from '@/react/hooks/dom/use-breakpoint.ts';

export interface BottomSheetProps {
    /** Accessible name for the panel. */
    label: string;
    open: boolean;
    onClose: () => void;
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
 *
 * It is not modal and not portalled, and both are the point. The map behind it stays live, and
 * the panel keeps its place in the shell's stacking order — over the map, under the furniture —
 * so a sheet on its way up disappears behind the year rail instead of sweeping across it. The
 * rail is the axis the whole atlas is read against and should never be covered, least of all by
 * an animation.
 */
export function BottomSheet({ label, open, onClose, head, children }: BottomSheetProps) {
    const { t } = useTranslation();
    const roomForPanel = useAtLeast('md');
    const drag = useSheetDrag({ open, onDismiss: onClose });
    const sheet = useMemo(() => ({ collapse: drag.collapse }), [drag.collapse]);

    return (
        <SheetProviderContext value={sheet}>
            <Dialog.Root
                open={open}
                modal={false}
                onOpenChange={(next) => {
                    if (!next) onClose();
                }}
            >
                <Dialog.Content
                    className="sheet sheet--dock leather"
                    aria-label={label}
                    aria-describedby={undefined}
                    data-dragging={drag.dragging}
                    style={roomForPanel ? undefined : { height: `${drag.height * 100}dvh` }}
                    /*
                     * A civilization is opened by pointing at the map, and the reader is still
                     * looking at the map. Pulling focus into the panel would scroll what they
                     * were reading out from under them.
                     */
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                    }}
                    /*
                     * The map, the year rail and the header are all live behind this panel, so a
                     * press on any of them is a press on that control — not a dismissal of this.
                     */
                    onInteractOutside={(event) => {
                        event.preventDefault();
                    }}
                >
                    <VisuallyHidden.Root asChild>
                        <Dialog.Title>{label}</Dialog.Title>
                    </VisuallyHidden.Root>

                    {/* The grip resizes a sheet that slides; wide, neither sheet slides, so it would be a lie. */}
                    {roomForPanel ? null : (
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
                </Dialog.Content>
            </Dialog.Root>
        </SheetProviderContext>
    );
}
