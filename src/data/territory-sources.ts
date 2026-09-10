/**
 * Where each civilization's border comes from, century by century.
 *
 * The atlas draws one border per time slice rather than a single "peak", because overlaying
 * realms from different centuries and calling the result a shared frontier is simply wrong: the
 * Mongols of 1279 never met the Sasanians of 600. Historical atlases answer this with a
 * sequence of maps, one per period, and so does this one.
 *
 * The source, aourednik/historical-basemaps, publishes a world GeoJSON per century and renames
 * polities as they change — Franks, then Frankish Kingdom, then Carolingian Empire. So a
 * civilization is described by the *set of names its realm ever goes by*, and the builder works
 * out which of them exist in each slice. The years drawn are then bounded by the span in
 * `civilizations.ts`: "Kingdom of France" matches 1600, but the Franks stop at 987, so no slice
 * is cut for them there.
 */

/** A ring drawn by hand, as [lon, lat] pairs; the closing point is added by the builder. */
export type DrawnRings = readonly (readonly (readonly [number, number])[])[];

export interface DrawnOutline {
    /** Why the source could not supply this, so the next reader does not have to guess. */
    reason: string;
    rings: DrawnRings;
}

/** A box that swallows whole sub-polygons the source wrongly attached to a realm. */
export interface DropBox {
    reason: string;
    west: number;
    south: number;
    east: number;
    north: number;
}

export interface TerritorySpec {
    /** Every name the realm goes by in the source, across the centuries. */
    aliases: readonly string[];
    /** Names that replace the alias match for one year; an empty list draws nothing that year. */
    overrides?: Readonly<Record<number, readonly string[]>>;
    /** Outlines drawn by hand, keyed by the year they stand for. */
    drawn?: Readonly<Record<number, DrawnOutline>>;
    /** An outline merged into every slice, for ground the source leaves out of all of them. */
    patch?: DrawnOutline;
    /** Sub-polygons to discard, matched by where their centre falls. */
    drop?: readonly DropBox[];
}

/**
 * Wonders that genuinely stand outside their civilization's realm, and why.
 *
 * The build refuses any other case. A monument the atlas cannot reach from its own borders is
 * almost always a mistake in the coordinate or in the source names; these two are not.
 */
export const WONDERS_OUTSIDE_THE_REALM: Readonly<Record<string, string>> = {
    huns: 'O Arco de Constantino é uma obra romana em Roma, e os hunos nunca chegaram à cidade.',
    slavs: 'O pogost de Kizhi é do século XVII, na Carélia — fora de qualquer recorte eslavo medieval.',
};

/**
 * The Sixteen Prefectures, held by the Liao from 938 and missing from the source's Liao polygon.
 *
 * Without them the Khitan Wonder — the Fogong pagoda at Yingxian, in northern Shanxi — falls a
 * hundred and fifty kilometres outside the dynasty that built it.
 */
const SIXTEEN_PREFECTURES: DrawnOutline = {
    reason: 'O polígono Liao da fonte exclui as Dezesseis Prefeituras, que a dinastia detinha desde 938.',
    rings: [
        [
            [112.0, 38.9],
            [112.3, 40.4],
            [114.0, 41.3],
            [116.0, 41.5],
            [118.0, 41.0],
            [119.5, 40.2],
            [118.5, 39.4],
            [116.5, 39.1],
            [114.5, 38.8],
            [113.0, 38.6],
        ],
    ],
};

/** The Kingdom of Bohemia at its widest under Charles IV: Moravia, Silesia and Lusatia. */
const BOHEMIA: DrawnOutline = {
    reason: 'A fonte dissolve a Boêmia dentro do Sacro Império e nunca a desenha em separado.',
    rings: [
        [
            [12.1, 50.3],
            [12.3, 51.0],
            [13.4, 51.4],
            [14.5, 51.5],
            [15.5, 51.3],
            [16.8, 51.2],
            [18.0, 50.8],
            [18.9, 50.2],
            [18.6, 49.5],
            [18.0, 48.9],
            [17.2, 48.6],
            [16.5, 48.7],
            [15.2, 48.6],
            [14.4, 48.6],
            [13.5, 48.9],
            [12.6, 49.5],
        ],
    ],
};

/** The Valois Burgundian state around 1470: the two Burgundies plus the Low Countries. */
const BURGUNDY: DrawnOutline = {
    reason: 'A fonte só traz o ducado antigo, sem os Países Baixos onde fica a maravilha da civ.',
    rings: [
        [
            [2.4, 50.9],
            [3.0, 51.3],
            [4.0, 51.6],
            [4.6, 51.9],
            [5.4, 52.4],
            [6.1, 52.6],
            [6.9, 52.4],
            [6.4, 51.6],
            [6.2, 50.8],
            [6.4, 50.1],
            [6.5, 49.5],
            [5.8, 49.4],
            [5.2, 49.6],
            [4.2, 50.0],
            [3.4, 50.3],
        ],
        [
            [3.0, 47.6],
            [3.6, 47.9],
            [4.4, 48.1],
            [5.2, 47.9],
            [6.1, 47.8],
            [7.0, 47.5],
            [6.9, 46.9],
            [6.4, 46.5],
            [5.6, 46.6],
            [4.8, 46.4],
            [4.2, 46.6],
            [3.6, 47.0],
        ],
    ],
};

/** The Jurchen Jin around 1200: Manchuria and northern China down to the Huai river. */
const JIN: DrawnOutline = {
    reason: 'O arquivo de 1200 ainda rotula esse território como Liao, dinastia já derrubada em 1125.',
    rings: [
        [
            [106.5, 34.5],
            [108.0, 36.5],
            [110.0, 39.0],
            [112.0, 41.0],
            [115.0, 42.5],
            [119.0, 44.0],
            [122.0, 46.5],
            [125.0, 48.5],
            [128.0, 49.5],
            [131.0, 47.5],
            [133.0, 45.0],
            [131.0, 43.0],
            [129.5, 41.0],
            [127.0, 41.5],
            [124.5, 40.2],
            [122.5, 39.2],
            [120.0, 38.0],
            [119.5, 35.0],
            [118.5, 33.5],
            [116.0, 33.0],
            [113.0, 33.3],
            [110.5, 33.6],
            [108.0, 34.0],
        ],
    ],
};

const THREE_KINGDOMS = 'A fonte salta dos Han (220) para Han Zhao (300) e nunca desenha os Três Reinos.';

/** Cao Wei around 250: the Yellow River basin from Gansu to Liaodong. */
const CAO_WEI: DrawnOutline = {
    reason: THREE_KINGDOMS,
    rings: [
        [
            [103.5, 36.5],
            [106.0, 38.5],
            [110.0, 40.5],
            [114.0, 41.5],
            [118.0, 42.0],
            [122.0, 41.5],
            [124.0, 40.5],
            [122.0, 39.0],
            [119.5, 37.5],
            [120.5, 36.0],
            [119.0, 34.0],
            [116.5, 32.8],
            [113.5, 32.5],
            [110.5, 32.5],
            [108.5, 33.5],
            [106.0, 34.0],
        ],
    ],
};

/** Shu Han around 250: the Sichuan basin, Hanzhong and the reaches south of it. */
const SHU_HAN: DrawnOutline = {
    reason: THREE_KINGDOMS,
    rings: [
        [
            [101.5, 32.5],
            [104.0, 33.5],
            [107.0, 33.3],
            [109.5, 32.0],
            [110.0, 30.5],
            [108.5, 29.0],
            [107.5, 27.0],
            [106.0, 25.5],
            [104.0, 24.5],
            [101.5, 24.0],
            [99.5, 25.5],
            [99.0, 28.0],
            [100.0, 30.5],
        ],
    ],
};

/** Eastern Wu around 250: the lower Yangtze, Jiangnan and the coast down to Tonkin. */
const EASTERN_WU: DrawnOutline = {
    reason: THREE_KINGDOMS,
    rings: [
        [
            [110.0, 32.0],
            [113.0, 32.3],
            [116.5, 32.6],
            [119.5, 33.5],
            [121.5, 32.0],
            [122.0, 30.0],
            [121.0, 27.5],
            [119.5, 25.5],
            [117.0, 23.5],
            [114.0, 22.3],
            [111.0, 21.3],
            [108.5, 21.5],
            [106.5, 20.5],
            [105.5, 19.0],
            [104.5, 20.5],
            [105.5, 22.5],
            [106.5, 24.5],
            [108.5, 26.0],
            [109.5, 28.0],
            [109.0, 30.0],
        ],
    ],
};

/**
 * Norse Greenland, which the source hangs off Denmark-Norway.
 *
 * The colony was real, but two million square kilometres of ice would make the Vikings the
 * third largest realm in the game, and that is not a fact about the Vikings.
 */
const GREENLAND: DropBox = {
    reason: 'A colônia nórdica existiu, mas 2,1 milhões de km² de gelo distorcem a comparação de área.',
    west: -75,
    south: 58,
    east: -30,
    north: 85,
};

/** Civilization key to the names, patches and drawings its border is cut from. */
export const TERRITORY_SOURCES: Readonly<Record<string, TerritorySpec>> = {
    britons: { aliases: ['Mercia', 'Wessex', 'England', 'Angevin Empire', 'England and Ireland'] },
    byzantines: { aliases: ['Eastern Roman Empire', 'Byzantine Empire'] },
    celts: { aliases: ['Celtic kingdoms', 'Scotland'] },
    chinese: { aliases: ['Sui Empire', 'Tang Empire', 'Song Empire', 'Ming Empire', 'Ming Chinese Empire'] },
    franks: { aliases: ['Franks', 'Frankish Kingdom', 'Carolingian Empire', 'West Francia', 'East Francia'] },
    goths: { aliases: ['Visigoths', 'Ostrogoths', 'Goths', 'Visigothic Kingdom'] },
    japanese: {
        aliases: ['Yamato', 'Japan', 'Imperial Japan (Fujiwara)', 'Shogun Japan (Kamakura)', 'Japan (Warring States)'],
    },
    mongols: {
        aliases: [
            'Mongols',
            'Mongol Empire',
            'Great Khanate',
            'Chagatai Khanate',
            'Ilkhanate',
            'Khanate of the Golden Horde',
        ],
    },
    persians: { aliases: ['Persia', 'Sasanian Empire', 'Sasanian dependencies'] },
    saracens: { aliases: ['Umayyad Caliphate', 'Abbasid Caliphate', 'Fatimid Caliphate'] },
    teutons: { aliases: ['Holy Roman Empire', 'Teutonic Knights'] },
    turks: { aliases: ['Ottoman Empire'] },
    vikings: { aliases: ['Kingdom of Norway', 'Norway', 'Sweden', 'Denmark', 'Denmark-Norway'], drop: [GREENLAND] },

    aztecs: { aliases: ['Aztec Empire'] },
    huns: { aliases: ['Hunnic Empire'] },
    koreans: { aliases: ['Korea', 'Goryeo'] },
    maya: { aliases: ['Maya chiefdoms and states', 'Maya states', 'Maya city-states', 'Mayas'] },
    spanish: { aliases: ['Castilla', 'Castile', 'Castille', 'Aragón', 'Spain'] },

    inca: { aliases: ['Inca Empire'] },
    italians: { aliases: ['Venice', 'Genoa', 'Milan', 'Papal States', 'Naples', 'Savoy'] },
    magyars: { aliases: ['Magyars', 'Hungary', 'Kingdom of Hungary', 'Imperial Hungary'] },
    slavs: {
        aliases: ['Slavs', 'Proto-Slavs', 'Slavonic tribes', 'Slavic tribes', 'Principality of Novgorod', 'Novgorod'],
    },

    berbers: {
        aliases: [
            'Berbers',
            'Berber Tribes',
            'Idrisid Caliphate',
            'Almoravid dynasty',
            'Almohad Caliphate',
            'Hafsid Caliphate',
            'Zayyanid Caliphate',
            'Wattasid Caliphate',
        ],
    },
    ethiopians: { aliases: ['Axum', 'Ethiopia'] },
    malians: { aliases: ['Mali'] },
    portuguese: { aliases: ['Portugal'] },

    burmese: { aliases: ['Pyu state', 'Pagan', 'Kingdom of Pagan', 'Bagan', 'Mon state', 'Mon States'] },
    khmer: { aliases: ['Khmer Empire', 'Cambodia'] },
    malay: { aliases: ['Srivijaya Empire', 'Malay', 'Malays', 'East Java', 'Malaysian Islamic states'] },
    vietnamese: { aliases: ['Annam', 'Đại Việt'] },

    bulgarians: { aliases: ['Bulgars', 'Danube Bulgars', 'Bulgar Khanate'] },
    cumans: { aliases: ['Kimek-Kipchak khaganate', 'Cuman-Kipchak confederation', 'Cuman Khanates'] },
    lithuanians: { aliases: ['Lithuania', 'Poland-Lithuania'] },
    tatars: {
        aliases: [
            'Khanate of the Golden Horde',
            'Golden Horde',
            'Chagatai Khanate',
            'Timurid Empire',
            'Timurid Emirates',
            'Crimean Khanate',
        ],
    },

    burgundians: { aliases: [], drawn: { 1400: BURGUNDY } },
    sicilians: { aliases: ['Sicily'] },

    bohemians: { aliases: [], drawn: { 1300: BOHEMIA } },
    poles: { aliases: ['Poland', 'Poland-Lithuania'] },

    bengalis: { aliases: ['Palas', 'Senas'] },
    dravidians: { aliases: ['Chola', 'Cholas', 'Chola state', 'Pallavas', 'Pallava', 'Pallava state'] },
    gurjaras: { aliases: ['Gurjara Pratihara', 'Pratiharas', 'Rajput kingdoms', 'Rajput Clans and Small States'] },
    hindustanis: { aliases: ['Sultanate of Delhi', 'Mughal Empire'] },

    romans: { aliases: ['Roman Empire', 'Western Roman Empire'] },

    armenians: { aliases: ['Armenia'] },
    georgians: { aliases: ['Georgia', 'Kingdom of Georgia', 'Georgian Kingdom'] },

    jurchens: { aliases: [], drawn: { 1200: JIN } },
    khitans: { aliases: ['Khitans', 'Liao'], patch: SIXTEEN_PREFECTURES },
    shu: { aliases: [], drawn: { 250: SHU_HAN } },
    wei: { aliases: [], drawn: { 250: CAO_WEI } },
    wu: { aliases: [], drawn: { 250: EASTERN_WU } },

    mapuche: { aliases: ['Wallmapu (Mapuche)'] },
    muisca: { aliases: ['Muisca'] },
    tupi: { aliases: ['Tupis', 'Tupinambá', 'Tekohá (Guarani)'] },

    danes: { aliases: ['Denmark', 'Denmark-Norway', 'Norway', 'England'], drop: [GREENLAND] },
    saxons: { aliases: ['Anglo-Saxons', 'Mercia', 'Wessex', 'England'] },
    varangians: {
        aliases: [
            "Rus' Khaganate",
            'Kyivan Rus',
            'Kievan Rus',
            'Principality of Kyiv',
            'Principality of Novgorod',
            'Principality of Vladimir-Suzdal',
            'Other Rus Principalities',
        ],
    },
};
