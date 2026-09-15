import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Toggle as Primitive } from 'radix-ui';

export interface ToggleProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
    /** Spoken name, and what is shown on hover. */
    label: string;
    pressed: boolean;
    onPressedChange: (pressed: boolean) => void;
    children: ReactNode;
}

/** A button that stays held down, for a setting whose state is the button's own appearance. */
export function Toggle({ label, pressed, onPressedChange, children, ...rest }: ToggleProps) {
    return (
        <Primitive.Root {...rest} pressed={pressed} onPressedChange={onPressedChange} aria-label={label} title={label}>
            {children}
        </Primitive.Root>
    );
}
