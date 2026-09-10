import { REGION_KEYS, type RegionKey } from '@/domain/enums/region.ts';

/** One civilization's whole visual identity on the map. */
export interface CivilizationStyle {
    region: RegionKey;
    /** The step its region wears on the current surface. */
    colour: string;
    /** Hatch angle in degrees, the channel that separates two realms sharing a region. */
    angle: number;
    /** Hatch stroke width in device pixels, the second half of that separation. */
    weight: number;
    /** Stable id for the SVG pattern this style is painted with. */
    patternId: string;
}

/** Six angles thirty degrees apart, doubled by stroke weight, give twelve tellable hatches. */
const HATCH_ANGLES = [0, 30, 60, 90, 120, 150];
const HATCH_WEIGHTS = [1.1, 2.4];
const HATCH_VARIANTS = HATCH_ANGLES.length * HATCH_WEIGHTS.length;

export interface PaletteServiceConfig {
    /** Civilization keys grouped by region, in the order the atlas lists them. */
    membership: Readonly<Record<RegionKey, readonly string[]>>;
    /** The categorical steps of the current skin, validated against its own map surface. */
    column: readonly string[];
    /** Which step each region wears, chosen for maximum separation between map neighbours. */
    regionSlot: Readonly<Record<RegionKey, number>>;
}

/**
 * Hands every civilization the colour and texture it is drawn with, everywhere, forever.
 *
 * Colour carries the region and texture carries the civilization, so a filter that changes how
 * many realms are on screen never repaints the ones that stayed — the reader's memory of "the
 * blue one with steep hatching is the Byzantines" survives every interaction. The steps come
 * from the skin rather than from here, because a palette is only safe against the surface it
 * was measured on.
 */
export class PaletteService {
    private readonly styles: ReadonlyMap<string, CivilizationStyle>;
    private readonly column: readonly string[];
    private readonly regionSlot: Readonly<Record<RegionKey, number>>;

    constructor(config: PaletteServiceConfig) {
        this.column = config.column;
        this.regionSlot = config.regionSlot;
        this.styles = buildStyles(config);
    }

    /**
     * The style a civilization is drawn with.
     *
     * @param key - The civilization key.
     * @throws When the key belongs to no region, which means the membership table is incomplete.
     */
    public styleOf(key: string): CivilizationStyle {
        const style = this.styles.get(key);
        if (!style) throw new Error(`A civilização "${key}" não está em nenhuma região.`);

        return style;
    }

    /** Every style the atlas can draw, for emitting the SVG pattern definitions in one pass. */
    public all(): CivilizationStyle[] {
        return [...this.styles.values()];
    }

    /**
     * The colour a region is drawn in, for the legend that explains the palette.
     *
     * @param region - The region to look up.
     */
    public regionColour(region: RegionKey): string {
        return this.column[this.regionSlot[region]];
    }
}

function buildStyles(config: PaletteServiceConfig): Map<string, CivilizationStyle> {
    const styles = new Map<string, CivilizationStyle>();

    for (const region of REGION_KEYS) {
        const colour = config.column[config.regionSlot[region]];

        config.membership[region].forEach((key, index) => {
            const variant = index % HATCH_VARIANTS;

            styles.set(key, {
                region,
                colour,
                angle: HATCH_ANGLES[variant % HATCH_ANGLES.length],
                weight: HATCH_WEIGHTS[Math.floor(variant / HATCH_ANGLES.length)],
                patternId: `hatch-${key}`,
            });
        });
    }

    return styles;
}
