import type { i18n } from 'i18next';
import { CIVILIZATIONS, REGION_MEMBERSHIP, SLICE_YEARS } from './data/dataset.ts';
import { EXPANSION_RECORDS } from './data/expansions.ts';
import { CatalogueService } from './services/atlas/catalogue-service.ts';
import { SliceService } from './services/atlas/slice-service.ts';
import { PaletteService } from './services/palette/palette-service.ts';
import { TextService } from './services/text/text-service.ts';
import { AGE_COLUMN, AGE_REGION_SLOT } from './skins/age/palette.ts';

export interface AtlasServices {
    catalogue: CatalogueService;
    slices: SliceService;
    palette: PaletteService;
    text: TextService;
}

/**
 * Builds the services the interface talks to.
 *
 * The catalogue and the palette are pure and bundled; the slice service is the only one that
 * touches the network, and it reads the centuries out of `public/data` relative to wherever
 * the application happens to be served from. The translator is wrapped here, once, so that
 * nothing below this file knows which library it is.
 *
 * @param translator - The booted i18next instance.
 */
export function createServices(translator: i18n): AtlasServices {
    const text = new TextService({
        translate: (key) => translator.t(key),
        language: () => translator.language,
    });

    return {
        catalogue: new CatalogueService({
            civilizations: CIVILIZATIONS,
            expansionOrder: EXPANSION_RECORDS.map((expansion) => expansion.key),
            text,
        }),
        slices: new SliceService({ baseUrl: `${import.meta.env.BASE_URL}data/`, years: SLICE_YEARS }),
        palette: new PaletteService({ membership: REGION_MEMBERSHIP, column: AGE_COLUMN, regionSlot: AGE_REGION_SLOT }),
        text,
    };
}
