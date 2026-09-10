import type { ExpansionKey } from '@/domain/enums/expansion.ts';

export interface ExpansionRecord {
    key: ExpansionKey;
    name: string;
    shortName: string;
    /** Store release date, ISO 8601. Dates before the Definitive Edition belong to the original release. */
    releasedOn: string;
    /** False while the expansion is announced but not yet on sale. */
    released: boolean;
}

/**
 * The expansions, in the order they reached players.
 *
 * The release date matters here because the atlas lets a reader sweep the civilizations by the
 * date they were added to the game, which is a different story from the date they existed in.
 */
export const EXPANSION_RECORDS: readonly ExpansionRecord[] = [
    { key: 'aok', name: 'The Age of Kings', shortName: 'AoK', releasedOn: '1999-09-30', released: true },
    { key: 'tc', name: 'The Conquerors', shortName: 'TC', releasedOn: '2000-08-24', released: true },
    { key: 'tf', name: 'The Forgotten', shortName: 'TF', releasedOn: '2013-11-07', released: true },
    { key: 'tak', name: 'The African Kingdoms', shortName: 'TAK', releasedOn: '2015-11-05', released: true },
    { key: 'rotr', name: 'Rise of the Rajas', shortName: 'RotR', releasedOn: '2016-12-19', released: true },
    { key: 'tlk', name: 'The Last Khans', shortName: 'TLK', releasedOn: '2019-11-14', released: true },
    { key: 'lotw', name: 'Lords of the West', shortName: 'LotW', releasedOn: '2021-01-26', released: true },
    { key: 'dotd', name: 'Dawn of the Dukes', shortName: 'DotD', releasedOn: '2021-08-10', released: true },
    { key: 'doi', name: 'Dynasties of India', shortName: 'DoI', releasedOn: '2022-04-28', released: true },
    { key: 'ror', name: 'Return of Rome', shortName: 'RoR', releasedOn: '2023-05-16', released: true },
    { key: 'tmr', name: 'The Mountain Royals', shortName: 'TMR', releasedOn: '2023-11-14', released: true },
    { key: 'ttk', name: 'The Three Kingdoms', shortName: 'TTK', releasedOn: '2024-08-07', released: true },
    { key: 'tlc', name: 'The Last Chieftains', shortName: 'TLC', releasedOn: '2026-02-17', released: true },
    { key: 'tvs', name: 'The Viking Sagas', shortName: 'TVS', releasedOn: '2026-09-22', released: false },
];
