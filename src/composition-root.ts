import type { i18n } from 'i18next';
import { CIVILIZATIONS, OPENING_YEAR, REGION_MEMBERSHIP, SLICE_YEARS } from './data/dataset.ts';
import { EXPANSION_RECORDS } from './data/expansions.ts';
import { CatalogueService } from './services/atlas/catalogue-service.ts';
import { SliceService } from './services/atlas/slice-service.ts';
import { CoastlineService } from './services/geo/coastline-service.ts';
import { PaletteService } from './services/palette/palette-service.ts';
import { TextService } from './services/text/text-service.ts';
import { AddressService } from './services/address/address-service.ts';
import { WikiService } from './services/wiki/wiki-service.ts';
import { AGE_COLUMN, AGE_REGION_SLOT } from './skins/age/palette.ts';

export interface AtlasServices {
    address: AddressService;
    catalogue: CatalogueService;
    slices: SliceService;
    coastline: CoastlineService;
    palette: PaletteService;
    text: TextService;
    wiki: WikiService;
}

/**
 * Builds the services the interface talks to.
 *
 * The catalogue and the palette are pure and bundled; the slice service and the coastline are
 * the ones that touch the network, and they read out of `public/data` relative to wherever the
 * application happens to be served from. The translator is wrapped here, once, so that nothing
 * below this file knows which library it is.
 *
 * @param translator - The booted i18next instance.
 */
export function createServices(translator: i18n): AtlasServices {
    const text = new TextService({
        translate: (key) => translator.t(key),
        language: () => translator.language,
    });

    return {
        address: new AddressService({
            years: SLICE_YEARS,
            keys: new Set(CIVILIZATIONS.map((civilization) => civilization.key)),
            openingYear: OPENING_YEAR,
        }),
        catalogue: new CatalogueService({
            civilizations: CIVILIZATIONS,
            expansionOrder: EXPANSION_RECORDS.map((expansion) => expansion.key),
            text,
        }),
        slices: new SliceService({ baseUrl: `${import.meta.env.BASE_URL}data/`, years: SLICE_YEARS }),
        coastline: new CoastlineService({ url: `${import.meta.env.BASE_URL}data/land.json` }),
        palette: new PaletteService({ membership: REGION_MEMBERSHIP, column: AGE_COLUMN, regionSlot: AGE_REGION_SLOT }),
        text,
        wiki: new WikiService({ agent: `aoe2-atlas (${__APP_REPOSITORY__})` }),
    };
}
