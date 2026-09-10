/** Every release that added civilizations to Age of Empires II, oldest first. */
export const EXPANSION_KEYS = [
    'aok',
    'tc',
    'tf',
    'tak',
    'rotr',
    'tlk',
    'lotw',
    'dotd',
    'doi',
    'ror',
    'tmr',
    'ttk',
    'tlc',
    'tvs',
] as const;

export type ExpansionKey = (typeof EXPANSION_KEYS)[number];
