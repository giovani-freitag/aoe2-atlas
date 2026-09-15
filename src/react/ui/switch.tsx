import type { ReactNode } from 'react';
import { Switch as Primitive } from 'radix-ui';

export interface SwitchProps {
    /** The label beside the track; it names what the switch turns on, not its state. */
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    /** A mark set before the label, for a setting that has one. */
    icon?: ReactNode;
}

/**
 * A two-state setting, drawn as a track the knob slides along.
 *
 * The track and the knob are the atlas's own brass and parchment rather than the platform's, so
 * the control has to earn the behaviour a checkbox gives away: Space toggles it, it reports
 * `role="switch"` with its state, and a form would read it. That is what the primitive
 * underneath carries.
 */
export function Switch({ label, checked, onCheckedChange, icon }: SwitchProps) {
    return (
        <Primitive.Root className="switch" checked={checked} onCheckedChange={onCheckedChange}>
            {icon}
            <span className="switch__label">{label}</span>
            <span className="switch__track" aria-hidden>
                <Primitive.Thumb className="switch__knob" />
            </span>
        </Primitive.Root>
    );
}
