import type { ReactNode } from 'react';
import { Collapsible as Primitive } from 'radix-ui';

export interface CollapsibleProps {
    className: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** What the fold is called when it is shut, and what opens it. */
    trigger: ReactNode;
    /** Class for the control that opens it. */
    triggerClassName?: string;
    /** Marks the trigger as carrying something, whether the fold is open or not. */
    active?: boolean;
    children: ReactNode;
}

/**
 * A row of controls folded behind one of them.
 *
 * A `details` element did this for free, but it reports nothing about its state to anything
 * outside itself, and what it holds cannot be labelled as belonging to the control that opened
 * it. The primitive ties the two together and leaves the styling where it was.
 */
export function Collapsible({
    className,
    open,
    onOpenChange,
    trigger,
    triggerClassName,
    active,
    children,
}: CollapsibleProps) {
    return (
        <Primitive.Root className={className} open={open} onOpenChange={onOpenChange}>
            <Primitive.Trigger className={triggerClassName} data-active={active}>
                {trigger}
            </Primitive.Trigger>
            <Primitive.Content>{children}</Primitive.Content>
        </Primitive.Root>
    );
}
