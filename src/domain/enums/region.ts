/** The eight stretches of the world the atlas colours its realms by. */
export const REGION_KEYS = ['weur', 'ceur', 'med', 'step', 'sasia', 'easia', 'afr', 'amer'] as const;

export type RegionKey = (typeof REGION_KEYS)[number];

export const REGION_NAMES: Readonly<Record<RegionKey, string>> = {
    weur: 'Europa Ocidental',
    ceur: 'Europa Central e Oriental',
    med: 'Mediterrâneo e Oriente Médio',
    step: 'Estepe e Ásia Central',
    sasia: 'Sul e Sudeste da Ásia',
    easia: 'Ásia Oriental',
    afr: 'África',
    amer: 'Américas',
};
