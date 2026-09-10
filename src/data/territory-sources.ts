/**
 * Where each civilization's border comes from.
 *
 * Most borders are lifted from aourednik/historical-basemaps, which publishes one world GeoJSON
 * per century: `pick` names the year file and the polities to dissolve together. A handful of
 * realms the dataset simply does not carry — the Three Kingdoms, the Jurchen Jin, Bohemia and the
 * Valois Burgundian state — are drawn here by hand from historical atlases, coarse on purpose,
 * because a rough outline that is honest about being rough beats a missing one.
 */

/** A pull from one year file of the source dataset. */
export interface PickSource {
    kind: 'pick';
    /** Year file to read, matching a `world_<year>.geojson` in the source repository. */
    year: number;
    /** Exact NAME values to dissolve into the civilization's border. */
    names: readonly string[];
}

/** A ring drawn by hand, as [lon, lat] pairs; the closing point is added by the builder. */
export interface DrawnSource {
    kind: 'drawn';
    /** Why this realm is not taken from the dataset, so the next reader does not have to guess. */
    reason: string;
    rings: readonly (readonly (readonly [number, number])[])[];
}

export type TerritorySource = PickSource | DrawnSource;

const pick = (year: number, ...names: string[]): PickSource => ({ kind: 'pick', year, names });

/**
 * The Kingdom of Bohemia at its widest under Charles IV, holding Moravia, Silesia and Lusatia.
 *
 * The source dataset folds Bohemia into the Holy Roman Empire from 1000 onward and never draws
 * it as a realm of its own.
 */
const BOHEMIA: DrawnSource = {
    kind: 'drawn',
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

/**
 * The Valois Burgundian state around 1470: the two Burgundies plus the Low Countries.
 *
 * The dataset's "Burgandy" is the older duchy in eastern France alone, which leaves out exactly
 * the half — Flanders, Brabant, Holland — that the civilization's Wonder in Brussels stands in.
 */
const BURGUNDY: DrawnSource = {
    kind: 'drawn',
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

/**
 * The Jurchen Jin dynasty around 1200: Manchuria and northern China down to the Huai river.
 *
 * The dataset's 1200 file still labels this ground "Liao", a dynasty the Jurchens had ended
 * seventy-five years earlier, so the Jin have to be drawn rather than picked.
 */
const JIN: DrawnSource = {
    kind: 'drawn',
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

/** Cao Wei around 250: the Yellow River basin from Gansu to Liaodong. */
const CAO_WEI: DrawnSource = {
    kind: 'drawn',
    reason: 'A fonte salta dos Han (220) para Han Zhao (300) e nunca desenha os Três Reinos.',
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
const SHU_HAN: DrawnSource = {
    kind: 'drawn',
    reason: 'A fonte salta dos Han (220) para Han Zhao (300) e nunca desenha os Três Reinos.',
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
const EASTERN_WU: DrawnSource = {
    kind: 'drawn',
    reason: 'A fonte salta dos Han (220) para Han Zhao (300) e nunca desenha os Três Reinos.',
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

/** Civilization key to the border the atlas draws for it. */
export const TERRITORY_SOURCES: Readonly<Record<string, TerritorySource>> = {
    britons: pick(1200, 'Angevin Empire'),
    byzantines: pick(600, 'Eastern Roman Empire'),
    celts: pick(1200, 'Celtic kingdoms', 'Scotland'),
    chinese: pick(800, 'Tang Empire'),
    franks: pick(800, 'Carolingian Empire'),
    goths: pick(500, 'Visigoths', 'Ostrogoths'),
    japanese: pick(1300, 'Shogun Japan (Kamakura)'),
    mongols: pick(1279, 'Great Khanate', 'Chagatai Khanate', 'Ilkhanate', 'Khanate of the Golden Horde'),
    persians: pick(600, 'Sasanian Empire', 'Sasanian dependencies'),
    saracens: pick(800, 'Abbasid Caliphate'),
    teutons: pick(1200, 'Holy Roman Empire'),
    turks: pick(1530, 'Ottoman Empire'),
    vikings: pick(1100, 'Norway', 'Sweden', 'Denmark'),

    aztecs: pick(1500, 'Aztec Empire'),
    huns: pick(400, 'Hunnic Empire'),
    koreans: pick(1200, 'Goryeo'),
    maya: pick(800, 'Maya city-states'),
    spanish: pick(1530, 'Spain'),

    inca: pick(1500, 'Inca Empire'),
    italians: pick(1530, 'Venice', 'Genoa', 'Milan', 'Papal States', 'Naples', 'Savoy'),
    magyars: pick(1400, 'Kingdom of Hungary'),
    slavs: pick(900, 'Slavic tribes'),

    berbers: pick(1200, 'Almohad Caliphate'),
    ethiopians: pick(1400, 'Ethiopia'),
    malians: pick(1300, 'Mali'),
    portuguese: pick(1500, 'Portugal'),

    burmese: pick(1200, 'Bagan'),
    khmer: pick(1200, 'Khmer Empire'),
    malay: pick(1400, 'Srivijaya Empire'),
    vietnamese: pick(1400, 'Đại Việt'),

    bulgarians: pick(900, 'Bulgars'),
    cumans: pick(1200, 'Cuman Khanates'),
    lithuanians: pick(1300, 'Lithuania'),
    tatars: pick(1400, 'Timurid Empire'),

    burgundians: BURGUNDY,
    sicilians: pick(1279, 'Sicily'),

    bohemians: BOHEMIA,
    poles: pick(1300, 'Poland'),

    bengalis: pick(800, 'Palas'),
    dravidians: pick(1100, 'Cholas'),
    gurjaras: pick(900, 'Gurjara Pratihara'),
    hindustanis: pick(1300, 'Sultanate of Delhi'),

    romans: pick(200, 'Roman Empire'),

    armenians: pick(1000, 'Armenia'),
    georgians: pick(1200, 'Georgia'),

    jurchens: JIN,
    khitans: pick(1100, 'Liao'),
    shu: SHU_HAN,
    wei: CAO_WEI,
    wu: EASTERN_WU,

    mapuche: pick(1492, 'Wallmapu (Mapuche)'),
    muisca: pick(1492, 'Muisca'),
    tupi: pick(1492, 'Tupinambá', 'Tekohá (Guarani)'),

    danes: pick(1100, 'Denmark', 'Norway', 'England'),
    saxons: pick(1000, 'England'),
    varangians: pick(1000, 'Kyivan Rus'),
};
