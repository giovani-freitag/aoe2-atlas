import { REGION_KEYS, type RegionKey } from '@/domain/enums/region.ts';

/** One civilization's whole visual identity on the map. */
export interface CivilizationStyle {
    region: RegionKey;
    /** Fill and stroke for the light surface. */
    light: string;
    /** Fill and stroke for the dark surface. */
    dark: string;
    /** Hatch angle in degrees, the channel that separates two realms sharing a region. */
    angle: number;
    /** Hatch stroke width in device pixels, the second half of that separation. */
    weight: number;
    /** Stable id for the SVG pattern this style is painted with. */
    patternId: string;
}

interface PaletteSlot {
    light: string;
    dark: string;
}

/**
 * The eight categorical slots, in the fixed order the reference palette validates them in.
 *
 * These are never cycled: a ninth hue is not generated, because the atlas colours by region and
 * there are exactly eight regions.
 */
const SLOTS: readonly PaletteSlot[] = [
    { light: '#2a78d6', dark: '#3987e5' },
    { light: '#eb6834', dark: '#d95926' },
    { light: '#1baf7a', dark: '#199e70' },
    { light: '#eda100', dark: '#c98500' },
    { light: '#e87ba4', dark: '#d55181' },
    { light: '#008300', dark: '#008300' },
    { light: '#4a3aa7', dark: '#9085e9' },
    { light: '#e34948', dark: '#e66767' },
];

/**
 * Which slot each region wears.
 *
 * The mapping is not alphabetical or arbitrary: it is the assignment, searched over every
 * ordering of the eight slots, that keeps the worst pair of regions *that can share a border on
 * the map* furthest apart. It clears the hard normal-vision floor at delta E 19.3 and lands the
 * worst colour-blind pair at 6.9, inside the band that is allowed only alongside a second
 * channel — which is what the hatch angle and the always-present legend are for.
 */
const REGION_SLOT: Readonly<Record<RegionKey, number>> = {
    weur: 0,
    amer: 1,
    afr: 2,
    med: 3,
    ceur: 4,
    step: 5,
    sasia: 6,
    easia: 7,
};

/** Six angles thirty degrees apart, doubled by stroke weight, give twelve tellable hatches. */
const HATCH_ANGLES = [0, 30, 60, 90, 120, 150];
const HATCH_WEIGHTS = [1.1, 2.4];

/** How wide the region colour is allowed to be off before a civilization repeats a hatch. */
const HATCH_VARIANTS = HATCH_ANGLES.length * HATCH_WEIGHTS.length;

export interface PaletteServiceConfig {
    /** Civilization keys grouped by region, in the order the atlas lists them. */
    membership: Readonly<Record<RegionKey, readonly string[]>>;
}

/**
 * Hands every civilization the colour and texture it is drawn with, everywhere, forever.
 *
 * Colour carries the region and texture carries the civilization, so a filter that changes how
 * many realms are on screen never repaints the ones that stayed — the reader's memory of "the
 * yellow one with steep hatching is the Byzantines" survives every interaction.
 */
export class PaletteService {
    private readonly styles: ReadonlyMap<string, CivilizationStyle>;

    constructor(config: PaletteServiceConfig) {
        this.styles = buildStyles(config.membership);
    }

    /**
     * The style a civilization is drawn with.
     *
     * @param key - The civilization key.
     * @returns Its colour, hatch and pattern id.
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
     * @param mode - Which surface the colour is going on.
     */
    public regionColour(region: RegionKey, mode: 'light' | 'dark'): string {
        return SLOTS[REGION_SLOT[region]][mode];
    }
}

function buildStyles(membership: Readonly<Record<RegionKey, readonly string[]>>): Map<string, CivilizationStyle> {
    const styles = new Map<string, CivilizationStyle>();

    for (const region of REGION_KEYS) {
        const slot = SLOTS[REGION_SLOT[region]];

        membership[region].forEach((key, index) => {
            const variant = index % HATCH_VARIANTS;

            styles.set(key, {
                region,
                light: slot.light,
                dark: slot.dark,
                angle: HATCH_ANGLES[variant % HATCH_ANGLES.length],
                weight: HATCH_WEIGHTS[Math.floor(variant / HATCH_ANGLES.length)],
                patternId: `hatch-${key}`,
            });
        });
    }

    return styles;
}
