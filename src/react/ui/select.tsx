import type { ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Select as Primitive } from 'radix-ui';

export interface SelectProps<T extends string> {
    /** Accessible name for the control, spoken in place of the value it is showing. */
    label: string;
    value: T;
    onValueChange: (value: T) => void;
    /** What the closed control shows: usually a mark and the name of the current choice. */
    trigger: ReactNode;
    children: ReactNode;
}

export interface SelectOptionProps<T extends string> {
    value: T;
    /** The language the entry is written in, when it differs from the page's. */
    lang?: string;
    /** What the entry is called, for the type-ahead, since the label may carry more than text. */
    textValue: string;
    /** A mark set before the label. */
    icon?: ReactNode;
    children: ReactNode;
}

/**
 * A single-choice list built out of the same materials as the panel around it.
 *
 * The one control the page could not style was the native select: on Windows it arrives as a
 * grey system rectangle in the middle of parchment and brass, and the list it drops belongs to
 * the operating system. This is that control drawn here, and the arrows, Home, End, Enter,
 * Escape and type-ahead that were free before come back with the primitive rather than by hand.
 *
 * The list is not portalled. It drops inside the panel it belongs to, which is what keeps it
 * inside the dialog that panel is, and painted in that panel's own stacking order.
 */
export function Select<T extends string>({ label, value, onValueChange, trigger, children }: SelectProps<T>) {
    return (
        <Primitive.Root
            value={value}
            onValueChange={(chosen) => {
                onValueChange(chosen as T);
            }}
        >
            <Primitive.Trigger className="picker__button" aria-label={label}>
                {trigger}
                <Primitive.Icon asChild>
                    <ChevronDown className="picker__caret" size={15} aria-hidden />
                </Primitive.Icon>
            </Primitive.Trigger>

            <Primitive.Content className="picker__list parchment" position="popper" sideOffset={4}>
                <Primitive.Viewport className="picker__viewport">{children}</Primitive.Viewport>
            </Primitive.Content>
        </Primitive.Root>
    );
}

/** One entry in a select, with the tick the chosen one wears. */
export function SelectOption<T extends string>({ value, lang, textValue, icon, children }: SelectOptionProps<T>) {
    return (
        <Primitive.Item className="picker__option" value={value} lang={lang} textValue={textValue}>
            {icon}
            <Primitive.ItemText asChild>
                <span className="picker__label">{children}</span>
            </Primitive.ItemText>
            <Primitive.ItemIndicator asChild>
                <Check size={14} aria-hidden />
            </Primitive.ItemIndicator>
        </Primitive.Item>
    );
}
