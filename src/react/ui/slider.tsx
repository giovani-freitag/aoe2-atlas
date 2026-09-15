import { Slider as Primitive } from 'radix-ui';

export interface SliderProps {
    /** Accessible name for the handle. */
    label: string;
    /** How the current stop should be read aloud, when the number alone would not say it. */
    valueText?: string;
    /** The stop the handle is on, as an index into whatever the caller is stepping through. */
    value: number;
    /** The highest index the handle can reach. */
    max: number;
    onValueChange: (value: number) => void;
    /** Class for the handle, so the caller can draw it in its own materials. */
    thumbClassName?: string;
    className?: string;
}

/**
 * A handle that runs along a line of stops.
 *
 * Only the handle and its hit area: whatever the handle runs along is drawn by the caller, which
 * is what lets the rail put nineteen columns and a length of rope behind it. The handle is held
 * inside the ends of its own box the way a native range control holds it, so a track laid out
 * against those ends lines up with the stops without being told the handle's width.
 */
export function Slider({ label, valueText, value, max, onValueChange, thumbClassName, className }: SliderProps) {
    return (
        <Primitive.Root
            className={className}
            min={0}
            max={max}
            step={1}
            value={[value]}
            onValueChange={([chosen]) => {
                if (chosen !== undefined) onValueChange(chosen);
            }}
        >
            <Primitive.Thumb className={thumbClassName} aria-label={label} aria-valuetext={valueText} />
        </Primitive.Root>
    );
}
