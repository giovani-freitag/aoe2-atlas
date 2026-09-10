import type { CivilizationStyle } from '@/services/palette/palette-service.ts';

export interface HatchSwatchProps {
    style: CivilizationStyle;
    /** Side of the square, in pixels. */
    size: number;
}

/**
 * The exact fill a realm wears on the map, shrunk to a chip.
 *
 * Roster and legend both need it, and both need it to match the map precisely — a swatch that
 * showed only the hue would hide the very channel that separates two realms of one region.
 */
export function HatchSwatch({ style, size }: HatchSwatchProps) {
    const middle = size / 2;

    return (
        <svg className="swatch" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <rect width={size} height={size} rx={2} fill={style.colour} fillOpacity={0.18} stroke={style.colour} />
            <g transform={`rotate(${style.angle} ${middle} ${middle})`}>
                {[0.2, 0.5, 0.8].map((fraction) => (
                    <line
                        key={fraction}
                        x1={size * fraction}
                        y1={-size}
                        x2={size * fraction}
                        y2={size * 2}
                        stroke={style.colour}
                        strokeWidth={style.weight}
                    />
                ))}
            </g>
        </svg>
    );
}
