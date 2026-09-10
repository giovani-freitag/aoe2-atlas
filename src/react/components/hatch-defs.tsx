import type { CivilizationStyle } from '@/services/palette/palette-service.ts';

/** Distance between hatch lines, in screen pixels, before the zoom is compensated for. */
const SPACING = 7;

/** How far an approximate border is smeared, in screen pixels. */
const HAZE = 2.2;

export interface HatchDefsProps {
    styles: readonly CivilizationStyle[];
    /** Current map scale, so the hatching keeps its width on screen however far the reader zooms. */
    scale: number;
}

/**
 * One SVG pattern per drawn realm, plus the blur that softens an uncertain border.
 *
 * The gaps between the hatch lines are what makes overlapping realms readable: two solid fills
 * stacked show only the top one, while two hatches at different angles weave and the reader
 * sees both colours in the same square kilometre.
 *
 * The blur is the other convention this map owes the reader. Historical borders were frontier
 * zones, not surveyed lines, and the source says how well it knows each one — so the ones it
 * admits are approximate are drawn soft rather than pretending to a precision nobody has.
 */
export function HatchDefs({ styles, scale }: HatchDefsProps) {
    return (
        <defs>
            <filter id="frontier-haze" x="-8%" y="-8%" width="116%" height="116%">
                <feGaussianBlur stdDeviation={HAZE / scale} />
            </filter>

            {styles.map((style) => (
                <pattern
                    key={style.patternId}
                    id={style.patternId}
                    width={SPACING}
                    height={SPACING}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`rotate(${style.angle}) scale(${1 / scale})`}
                >
                    <rect width={SPACING} height={SPACING} fill={style.colour} fillOpacity={0.14} />
                    <line
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={SPACING}
                        stroke={style.colour}
                        strokeWidth={style.weight}
                        strokeOpacity={0.9}
                    />
                </pattern>
            ))}
        </defs>
    );
}
