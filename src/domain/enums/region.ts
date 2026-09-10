/** The eight stretches of the world the atlas colours its realms by; named in the locale bundles. */
export const REGION_KEYS = ['weur', 'ceur', 'med', 'step', 'sasia', 'easia', 'afr', 'amer'] as const;

export type RegionKey = (typeof REGION_KEYS)[number];
