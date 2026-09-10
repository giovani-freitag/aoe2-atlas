import type { RegionKey } from '@/domain/enums/region.ts';

/**
 * The eight categorical steps the Age skin paints realms with.
 *
 * They are the reference palette's eight hues, each darkened until it clears three to one
 * against the parchment the map is drawn on. The undarkened steps were built for a white or a
 * near-black surface; on aged paper four of them washed out entirely. Hue and order are
 * untouched, so the separation the palette was chosen for survives the restep.
 */
export const AGE_COLUMN: readonly string[] = [
    '#2a78d6',
    '#d15c2d',
    '#149164',
    '#ac7400',
    '#bc6384',
    '#008300',
    '#4a3aa7',
    '#e24948',
];

/**
 * Which step each region wears.
 *
 * Searched over every ordering of the eight steps for the one that keeps the worst pair of
 * regions *that can share a border on the map* furthest apart. On this surface it clears the
 * hard normal-vision floor at delta E 15.5 and the colour-blind target at 8.7 — both gates
 * passed, with the hatch angle still carrying the individual civilization.
 */
export const AGE_REGION_SLOT: Readonly<Record<RegionKey, number>> = {
    weur: 4,
    ceur: 3,
    med: 0,
    step: 6,
    sasia: 1,
    easia: 2,
    afr: 5,
    amer: 7,
};
