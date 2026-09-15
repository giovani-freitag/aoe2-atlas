import type { ReactNode } from 'react';
import { RadioGroup as Primitive } from 'radix-ui';

export interface OptionGroupProps<T extends string> {
    /** Accessible name for the group, since the choices carry no visible heading of their own. */
    label: string;
    value: T;
    onValueChange: (value: T) => void;
    children: ReactNode;
}

export interface OptionProps<T extends string> {
    value: T;
    /** What the choice is called. */
    name: string;
    /** A word on what the choice preserves, set beside the name. */
    hint?: ReactNode;
    /** What it costs, on a line of its own under the name. */
    caveat?: ReactNode;
}

/**
 * One choice out of a handful, each wide enough to say what it costs.
 *
 * Cards rather than a row of radios because the choices here are not interchangeable labels —
 * every projection trades one distortion for another, and the trade has to be readable before
 * the choice is made.
 */
export function OptionGroup<T extends string>({ label, value, onValueChange, children }: OptionGroupProps<T>) {
    return (
        <Primitive.Root
            className="options"
            aria-label={label}
            value={value}
            onValueChange={(chosen) => {
                onValueChange(chosen as T);
            }}
        >
            {children}
        </Primitive.Root>
    );
}

/** One card in an option group. */
export function Option<T extends string>({ value, name, hint, caveat }: OptionProps<T>) {
    return (
        <Primitive.Item value={value}>
            <span className="options__name">
                {name}
                {hint ? <small>{hint}</small> : null}
            </span>
            {caveat ? <span className="options__caveat">{caveat}</span> : null}
        </Primitive.Item>
    );
}
