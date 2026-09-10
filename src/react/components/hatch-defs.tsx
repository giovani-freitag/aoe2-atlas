import type { CivilizationStyle } from '@/services/palette/palette-service.ts';
import type { ColourScheme } from '@/react/hooks/use-colour-scheme.ts';

/** Distance between hatch lines, in screen pixels, before the zoom is compensated for. */
const SPACING = 7;

export interface HatchDefsProps {
    styles: readonly CivilizationStyle[];
    scheme: ColourScheme;
    /** Current map scale, so the hatching keeps its width on screen however far the reader zooms. */
    scale: number;
}

/**
 * One SVG pattern per drawn realm: parallel lines over a translucent wash.
 *
 * The gaps between the lines are what makes overlapping realms readable. Two solid fills stacked
 * on each other show only the top one; two hatches at different angles weave, and the reader
 * sees both colours in the same square kilometre without the atlas having to compute a single
 * intersection at runtime.
 */
export function HatchDefs({ styles, scheme, scale }: HatchDefsProps) {
    return (
        <defs>
            {styles.map((style) => {
                const colour = scheme === 'dark' ? style.dark : style.light;

                return (
                    <pattern
                        key={style.patternId}
                        id={style.patternId}
                        width={SPACING}
                        height={SPACING}
                        patternUnits="userSpaceOnUse"
                        patternTransform={`rotate(${style.angle}) scale(${1 / scale})`}
                    >
                        <rect width={SPACING} height={SPACING} fill={colour} fillOpacity={0.16} />
                        <line
                            x1={0}
                            y1={0}
                            x2={0}
                            y2={SPACING}
                            stroke={colour}
                            strokeWidth={style.weight}
                            strokeOpacity={0.85}
                        />
                    </pattern>
                );
            })}
        </defs>
    );
}
