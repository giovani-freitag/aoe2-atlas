import type { CivilizationStyle } from '@/services/palette/palette-service.ts';
import type { ColourScheme } from '@/react/hooks/use-colour-scheme.ts';

export interface HatchSwatchProps {
    style: CivilizationStyle;
    scheme: ColourScheme;
    /** Side of the square, in pixels. */
    size: number;
}

/**
 * The exact fill a realm wears on the map, shrunk to a chip.
 *
 * Legend and list both need it, and both need it to match the map precisely — a swatch that
 * shows only the hue would hide the channel that actually separates two realms of one region.
 */
export function HatchSwatch({ style, scheme, size }: HatchSwatchProps) {
    const colour = scheme === 'dark' ? style.dark : style.light;
    const middle = size / 2;
    const overhang = size;

    return (
        <svg className="swatch" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <rect width={size} height={size} rx={2} fill={colour} fillOpacity={0.18} stroke={colour} />
            <g transform={`rotate(${style.angle} ${middle} ${middle})`}>
                {[0.2, 0.5, 0.8].map((fraction) => (
                    <line
                        key={fraction}
                        x1={size * fraction}
                        y1={-overhang}
                        x2={size * fraction}
                        y2={size + overhang}
                        stroke={colour}
                        strokeWidth={style.weight}
                    />
                ))}
            </g>
        </svg>
    );
}
