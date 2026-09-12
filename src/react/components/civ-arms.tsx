import type { Civilization } from '@/domain/entities/civilization.ts';
import { armsUrl } from '@/react/assets.ts';

export interface CivArmsProps {
    civilization: Civilization;
    /** Side of the square, in pixels. */
    size: number;
    /** Names the arms for a reader who cannot see them; leave out where the name is next to it. */
    label?: string;
    /** Rings the arms in the civilization's own colour, for a row that has no other hue. */
    colour?: string;
}

/**
 * A civilization's arms, at whatever size the place calls for.
 *
 * Arms are how a civilization is known throughout the atlas — on the map, in the roster, at the
 * head of its panel, in the row of its neighbours — so they are worth one component rather than
 * five spellings of the same `img` tag.
 */
export function CivArms({ civilization, size, label, colour }: CivArmsProps) {
    return (
        <img
            className="arms"
            src={armsUrl(civilization)}
            alt={label ?? ''}
            title={label}
            width={size}
            height={size}
            style={colour ? { borderColor: colour, borderStyle: 'solid', borderWidth: 1 } : undefined}
        />
    );
}
