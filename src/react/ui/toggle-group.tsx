import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ToggleGroup as Primitive } from 'radix-ui';

export interface ToggleGroupProps<T extends string> {
    /** Accessible name for the group. */
    label: string;
    className: string;
    value: T | null;
    /** Null when the choice already taken is pressed again; what that means is the caller's. */
    onValueChange: (value: T | null) => void;
    children: ReactNode;
}

export interface MultiToggleGroupProps<T extends string> {
    /** Accessible name for the group. */
    label: string;
    className: string;
    value: readonly T[];
    onValueChange: (value: T[]) => void;
    children: ReactNode;
}

/**
 * A row of choices where at most one is taken.
 *
 * The arrows walk the row and only the chosen one is in the tab order, which is what a row of
 * plain buttons could not do: fourteen of them meant fourteen stops on the way past.
 */
export function ToggleGroup<T extends string>({
    label,
    className,
    value,
    onValueChange,
    children,
}: ToggleGroupProps<T>) {
    return (
        <Primitive.Root
            type="single"
            className={className}
            aria-label={label}
            value={value ?? ''}
            onValueChange={(chosen) => {
                onValueChange(chosen === '' ? null : (chosen as T));
            }}
        >
            {children}
        </Primitive.Root>
    );
}

/** A row of choices where any number may be taken at once. */
export function MultiToggleGroup<T extends string>({
    label,
    className,
    value,
    onValueChange,
    children,
}: MultiToggleGroupProps<T>) {
    return (
        <Primitive.Root
            type="multiple"
            className={className}
            aria-label={label}
            value={[...value]}
            onValueChange={(chosen) => {
                onValueChange(chosen as T[]);
            }}
        >
            {children}
        </Primitive.Root>
    );
}

export interface ToggleGroupItemProps<T extends string> extends ComponentPropsWithoutRef<'button'> {
    value: T;
}

/** One choice in either kind of group. */
export function ToggleGroupItem<T extends string>({ value, ...rest }: ToggleGroupItemProps<T>) {
    return <Primitive.Item value={value} {...rest} />;
}
