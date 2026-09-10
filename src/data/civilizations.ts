import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { RegionKey } from '@/domain/enums/region.ts';

export interface WonderRecord {
    lat: number;
    lon: number;
    /** Article slug on the English Wikipedia, for the "read more" link. */
    wikipedia: string;
    /**
     * Set when the in-game model is centuries younger than the civilization it stands for, or
     * stands somewhere the civilization never did. The explanation itself is in the locale
     * bundles, under `civs.<key>.anachronism`.
     */
    anachronistic?: true;
}

export interface RealmRecord {
    /** First year the atlas counts the civilization as standing. */
    from: number;
    /** Last year the atlas counts the civilization as standing. */
    to: number;
}

export interface CivilizationRecord {
    key: string;
    /** File name under public/img/civs, without the extension. */
    icon: string;
    expansion: ExpansionKey;
    /** Which stretch of the world the atlas colours the realm by. */
    region: RegionKey;
    wonder: WonderRecord;
    realm: RealmRecord;
}

/**
 * Every civilization the game ships, with where its Wonder stands and the years its realm stood.
 *
 * Nothing here is in any language. The name, the monument, where it is and what the realm was
 * called live in `src/i18n/locales/<locale>/atlas.json`, one bundle per language the game is
 * sold in, keyed by the civilization key; this file keeps only what is true in every language.
 *
 * The realm carries only the years it stood. Its borders are not here: they are cut per century
 * from the source in `territory-sources.ts`, and the year a realm was at its widest is measured
 * from those cuts rather than declared by hand — a figure nobody has to keep in step with the
 * geometry.
 */
export const CIVILIZATION_RECORDS: readonly CivilizationRecord[] = [
    {
        key: 'britons',
        icon: 'britons',
        expansion: 'aok',
        region: 'weur',
        wonder: {
            lat: 50.836,
            lon: -0.7801,
            wikipedia: 'Chichester_Cathedral',
        },
        realm: { from: 800, to: 1500 },
    },
    {
        key: 'byzantines',
        icon: 'byzantines',
        expansion: 'aok',
        region: 'med',
        wonder: {
            lat: 41.0086,
            lon: 28.9802,
            wikipedia: 'Hagia_Sophia',
        },
        realm: { from: 395, to: 1453 },
    },
    {
        key: 'celts',
        icon: 'celts',
        expansion: 'aok',
        region: 'weur',
        wonder: {
            lat: 52.5197,
            lon: -7.8906,
            wikipedia: 'Rock_of_Cashel',
        },
        realm: { from: 400, to: 1500 },
    },
    {
        key: 'chinese',
        icon: 'chinese',
        expansion: 'aok',
        region: 'easia',
        wonder: {
            lat: 39.8822,
            lon: 116.4066,
            wikipedia: 'Temple_of_Heaven',
            anachronistic: true,
        },
        realm: { from: 618, to: 1600 },
    },
    {
        key: 'franks',
        icon: 'franks',
        expansion: 'aok',
        region: 'weur',
        wonder: {
            lat: 48.4477,
            lon: 1.4877,
            wikipedia: 'Chartres_Cathedral',
        },
        realm: { from: 481, to: 987 },
    },
    {
        key: 'goths',
        icon: 'goths',
        expansion: 'aok',
        region: 'weur',
        wonder: {
            lat: 44.4212,
            lon: 12.2091,
            wikipedia: 'Mausoleum_of_Theodoric',
        },
        realm: { from: 376, to: 711 },
    },
    {
        key: 'japanese',
        icon: 'japanese',
        expansion: 'aok',
        region: 'easia',
        wonder: {
            lat: 34.6889,
            lon: 135.8398,
            wikipedia: 'Tōdai-ji',
        },
        realm: { from: 550, to: 1600 },
    },
    {
        key: 'mongols',
        icon: 'mongols',
        expansion: 'aok',
        region: 'step',
        wonder: {
            lat: 47.1975,
            lon: 102.8419,
            wikipedia: 'Karakorum',
        },
        // From Temujin's election as khan of the Mongols, not the 1206 kurultai: the source draws
        // the steppe confederation he was welding together in 1200, and without it the empire
        // appears on the map at full size from nowhere.
        realm: { from: 1189, to: 1368 },
    },
    {
        key: 'persians',
        icon: 'persians',
        expansion: 'aok',
        region: 'med',
        wonder: {
            lat: 33.0961,
            lon: 44.5808,
            wikipedia: 'Taq_Kasra',
        },
        realm: { from: 224, to: 651 },
    },
    {
        key: 'saracens',
        icon: 'saracens',
        expansion: 'aok',
        region: 'med',
        wonder: {
            lat: 34.2033,
            lon: 43.8792,
            wikipedia: 'Great_Mosque_of_Samarra',
        },
        realm: { from: 632, to: 1258 },
    },
    {
        key: 'teutons',
        icon: 'teutons',
        expansion: 'aok',
        region: 'ceur',
        wonder: {
            lat: 50.4028,
            lon: 7.2528,
            wikipedia: 'Maria_Laach_Abbey',
        },
        realm: { from: 800, to: 1500 },
    },
    {
        key: 'turks',
        icon: 'turks',
        expansion: 'aok',
        region: 'med',
        wonder: {
            lat: 41.6781,
            lon: 26.5594,
            wikipedia: 'Selimiye_Mosque',
        },
        realm: { from: 1299, to: 1600 },
    },
    {
        key: 'vikings',
        icon: 'vikings',
        expansion: 'aok',
        region: 'weur',
        wonder: {
            lat: 61.0472,
            lon: 7.8125,
            wikipedia: 'Borgund_Stave_Church',
        },
        realm: { from: 793, to: 1100 },
    },
    {
        key: 'aztecs',
        icon: 'aztecs',
        expansion: 'tc',
        region: 'amer',
        wonder: {
            lat: 19.4347,
            lon: -99.1315,
            wikipedia: 'Templo_Mayor',
        },
        realm: { from: 1325, to: 1521 },
    },
    {
        key: 'huns',
        icon: 'huns',
        expansion: 'tc',
        region: 'step',
        wonder: {
            lat: 41.8898,
            lon: 12.4906,
            wikipedia: 'Arch_of_Constantine',
            anachronistic: true,
        },
        realm: { from: 370, to: 469 },
    },
    {
        key: 'koreans',
        icon: 'koreans',
        expansion: 'tc',
        region: 'easia',
        wonder: {
            lat: 35.8383,
            lon: 129.2422,
            wikipedia: 'Hwangnyongsa',
        },
        realm: { from: 918, to: 1600 },
    },
    {
        key: 'maya',
        icon: 'mayans',
        expansion: 'tc',
        region: 'amer',
        wonder: {
            lat: 17.222,
            lon: -89.6237,
            wikipedia: 'Tikal_Temple_I',
        },
        realm: { from: 250, to: 1500 },
    },
    {
        key: 'spanish',
        icon: 'spanish',
        expansion: 'tc',
        region: 'weur',
        wonder: {
            lat: 37.3826,
            lon: -5.9963,
            wikipedia: 'Torre_del_Oro',
            anachronistic: true,
        },
        realm: { from: 1000, to: 1600 },
    },
    {
        key: 'inca',
        icon: 'incas',
        expansion: 'tf',
        region: 'amer',
        wonder: {
            lat: -13.1633,
            lon: -72.5456,
            wikipedia: 'Machu_Picchu',
        },
        realm: { from: 1438, to: 1533 },
    },
    {
        key: 'italians',
        icon: 'italians',
        expansion: 'tf',
        region: 'weur',
        wonder: {
            lat: 44.4075,
            lon: 8.9317,
            wikipedia: 'Genoa_Cathedral',
        },
        realm: { from: 1000, to: 1600 },
    },
    {
        key: 'magyars',
        icon: 'magyars',
        expansion: 'tf',
        region: 'ceur',
        wonder: {
            lat: 45.7489,
            lon: 22.8878,
            wikipedia: 'Corvin_Castle',
        },
        realm: { from: 895, to: 1526 },
    },
    {
        key: 'slavs',
        icon: 'slavs',
        expansion: 'tf',
        region: 'ceur',
        wonder: {
            lat: 62.0681,
            lon: 35.2242,
            wikipedia: 'Kizhi_Pogost',
            anachronistic: true,
        },
        realm: { from: 500, to: 1500 },
    },
    {
        key: 'berbers',
        icon: 'berbers',
        expansion: 'tak',
        region: 'afr',
        wonder: {
            lat: 34.0242,
            lon: -6.8226,
            wikipedia: 'Hassan_Tower',
        },
        realm: { from: 700, to: 1500 },
    },
    {
        key: 'ethiopians',
        icon: 'ethiopians',
        expansion: 'tak',
        region: 'afr',
        wonder: {
            lat: 12.0317,
            lon: 39.043,
            wikipedia: 'Biete_Amanuel',
        },
        realm: { from: 100, to: 1600 },
    },
    {
        key: 'malians',
        icon: 'malians',
        expansion: 'tak',
        region: 'afr',
        wonder: {
            lat: 13.9053,
            lon: -4.5553,
            wikipedia: 'Great_Mosque_of_Djenné',
            anachronistic: true,
        },
        realm: { from: 1235, to: 1600 },
    },
    {
        key: 'portuguese',
        icon: 'portuguese',
        expansion: 'tak',
        region: 'weur',
        wonder: {
            lat: 38.6916,
            lon: -9.216,
            wikipedia: 'Belém_Tower',
        },
        realm: { from: 1139, to: 1600 },
    },
    {
        key: 'burmese',
        icon: 'burmese',
        expansion: 'rotr',
        region: 'sasia',
        wonder: {
            lat: 21.1917,
            lon: 94.8933,
            wikipedia: 'Shwezigon_Pagoda',
        },
        realm: { from: 849, to: 1600 },
    },
    {
        key: 'khmer',
        icon: 'khmer',
        expansion: 'rotr',
        region: 'sasia',
        wonder: {
            lat: 13.4125,
            lon: 103.867,
            wikipedia: 'Angkor_Wat',
        },
        realm: { from: 802, to: 1431 },
    },
    {
        key: 'malay',
        icon: 'malay',
        expansion: 'rotr',
        region: 'sasia',
        wonder: {
            lat: -7.7672,
            lon: 110.4681,
            wikipedia: 'Kalasan',
        },
        realm: { from: 671, to: 1500 },
    },
    {
        key: 'vietnamese',
        icon: 'vietnamese',
        expansion: 'rotr',
        region: 'sasia',
        wonder: {
            lat: 21.0489,
            lon: 106.08,
            wikipedia: 'Bút_Tháp_Temple',
        },
        realm: { from: 938, to: 1600 },
    },
    {
        key: 'bulgarians',
        icon: 'bulgarians',
        expansion: 'tlk',
        region: 'ceur',
        wonder: {
            lat: 43.1489,
            lon: 26.8125,
            wikipedia: 'Round_Church,_Preslav',
        },
        realm: { from: 681, to: 1396 },
    },
    {
        key: 'cumans',
        icon: 'cumans',
        expansion: 'tlk',
        region: 'step',
        wonder: {
            lat: 47.6167,
            lon: 42.1,
            wikipedia: 'Sarkel',
            anachronistic: true,
        },
        realm: { from: 1000, to: 1241 },
    },
    {
        key: 'lithuanians',
        icon: 'lithuanians',
        expansion: 'tlk',
        region: 'ceur',
        wonder: {
            lat: 54.6522,
            lon: 24.9336,
            wikipedia: 'Trakai_Island_Castle',
        },
        realm: { from: 1236, to: 1569 },
    },
    {
        key: 'tatars',
        icon: 'tatars',
        expansion: 'tlk',
        region: 'step',
        wonder: {
            lat: 39.6753,
            lon: 66.9889,
            wikipedia: 'Ulugh_Beg_Observatory',
        },
        realm: { from: 1240, to: 1507 },
    },
    {
        key: 'burgundians',
        icon: 'burgundians',
        expansion: 'lotw',
        region: 'weur',
        wonder: {
            lat: 50.8467,
            lon: 4.3524,
            wikipedia: 'Brussels_Town_Hall',
        },
        realm: { from: 1363, to: 1477 },
    },
    {
        key: 'sicilians',
        icon: 'sicilians',
        expansion: 'lotw',
        region: 'weur',
        wonder: {
            lat: 38.0817,
            lon: 13.2919,
            wikipedia: 'Monreale_Cathedral',
        },
        realm: { from: 1130, to: 1500 },
    },
    {
        key: 'bohemians',
        icon: 'bohemians',
        expansion: 'dotd',
        region: 'ceur',
        wonder: {
            lat: 50.0872,
            lon: 14.4278,
            wikipedia: 'Powder_Tower,_Prague',
        },
        realm: { from: 1198, to: 1526 },
    },
    {
        key: 'poles',
        icon: 'poles',
        expansion: 'dotd',
        region: 'ceur',
        wonder: {
            lat: 50.0543,
            lon: 19.9354,
            wikipedia: 'Wawel_Cathedral',
        },
        realm: { from: 966, to: 1569 },
    },
    {
        key: 'bengalis',
        icon: 'bengalis',
        expansion: 'doi',
        region: 'sasia',
        wonder: {
            lat: 25.0311,
            lon: 88.9775,
            wikipedia: 'Somapura_Mahavihara',
        },
        realm: { from: 750, to: 1200 },
    },
    {
        key: 'dravidians',
        icon: 'dravidians',
        expansion: 'doi',
        region: 'sasia',
        wonder: {
            lat: 10.7828,
            lon: 79.1317,
            wikipedia: 'Brihadisvara_Temple,_Thanjavur',
        },
        realm: { from: 300, to: 1279 },
    },
    {
        key: 'gurjaras',
        icon: 'gurjaras',
        expansion: 'doi',
        region: 'sasia',
        wonder: {
            lat: 20.888,
            lon: 70.4012,
            wikipedia: 'Somnath_temple',
        },
        realm: { from: 730, to: 1036 },
    },
    {
        key: 'hindustanis',
        icon: 'indians',
        expansion: 'doi',
        region: 'sasia',
        wonder: {
            lat: 28.5933,
            lon: 77.2507,
            wikipedia: "Humayun's_Tomb",
        },
        realm: { from: 1206, to: 1600 },
    },
    {
        key: 'romans',
        icon: 'romans',
        expansion: 'ror',
        region: 'med',
        wonder: {
            lat: 41.8902,
            lon: 12.4922,
            wikipedia: 'Colosseum',
        },
        realm: { from: -27, to: 476 },
    },
    {
        key: 'armenians',
        icon: 'armenians',
        expansion: 'tmr',
        region: 'med',
        wonder: {
            lat: 40.1619,
            lon: 44.2914,
            wikipedia: 'Etchmiadzin_Cathedral',
        },
        realm: { from: 885, to: 1375 },
    },
    {
        key: 'georgians',
        icon: 'georgians',
        expansion: 'tmr',
        region: 'med',
        wonder: {
            lat: 41.8422,
            lon: 44.7211,
            wikipedia: 'Svetitskhoveli_Cathedral',
        },
        realm: { from: 1008, to: 1490 },
    },
    {
        key: 'jurchens',
        icon: 'jurchens',
        expansion: 'ttk',
        region: 'easia',
        wonder: {
            lat: 40.1547,
            lon: 116.1367,
            wikipedia: 'Yinshan_Pagoda_Forest',
        },
        realm: { from: 1115, to: 1234 },
    },
    {
        key: 'khitans',
        icon: 'khitans',
        expansion: 'ttk',
        region: 'easia',
        wonder: {
            lat: 39.5653,
            lon: 113.1861,
            wikipedia: 'Pagoda_of_Fogong_Temple',
        },
        realm: { from: 907, to: 1125 },
    },
    {
        key: 'shu',
        icon: 'shu',
        expansion: 'ttk',
        region: 'easia',
        wonder: {
            lat: 30.6455,
            lon: 104.0472,
            wikipedia: 'Wuhou_Shrine',
        },
        realm: { from: 221, to: 263 },
    },
    {
        key: 'wei',
        icon: 'wei',
        expansion: 'ttk',
        region: 'easia',
        wonder: {
            lat: 34.515,
            lon: 113.0264,
            wikipedia: 'Songyue_Pagoda',
        },
        realm: { from: 220, to: 266 },
    },
    {
        key: 'wu',
        icon: 'wu',
        expansion: 'ttk',
        region: 'easia',
        wonder: {
            lat: 31.2239,
            lon: 121.4453,
            wikipedia: "Jing'an_Temple",
        },
        realm: { from: 222, to: 280 },
    },
    {
        key: 'mapuche',
        icon: 'mapuche',
        expansion: 'tlc',
        region: 'amer',
        wonder: {
            lat: -38.7359,
            lon: -72.5904,
            wikipedia: 'Mapuche',
        },
        realm: { from: 1000, to: 1600 },
    },
    {
        key: 'muisca',
        icon: 'muisca',
        expansion: 'tlc',
        region: 'amer',
        wonder: {
            lat: 5.7147,
            lon: -72.9339,
            wikipedia: 'Sun_Temple_(Sogamoso)',
        },
        realm: { from: 800, to: 1540 },
    },
    {
        key: 'tupi',
        icon: 'tupi',
        expansion: 'tlc',
        region: 'amer',
        wonder: {
            lat: -25.6953,
            lon: -54.4367,
            wikipedia: 'Iguazu_Falls',
        },
        realm: { from: 900, to: 1600 },
    },
    {
        key: 'danes',
        icon: 'danes',
        expansion: 'tvs',
        region: 'weur',
        wonder: {
            lat: 55.7561,
            lon: 9.42,
            wikipedia: 'Jelling_stones',
        },
        realm: { from: 800, to: 1100 },
    },
    {
        key: 'saxons',
        icon: 'saxons',
        expansion: 'tvs',
        region: 'weur',
        wonder: {
            lat: 52.2664,
            lon: -0.7517,
            wikipedia: "All_Saints'_Church,_Earls_Barton",
        },
        realm: { from: 500, to: 1066 },
    },
    {
        key: 'varangians',
        icon: 'varangians',
        expansion: 'tvs',
        region: 'ceur',
        wonder: {
            lat: 54.78,
            lon: 31.87,
            wikipedia: 'Gnyozdovo',
            anachronistic: true,
        },
        realm: { from: 862, to: 1240 },
    },
];
