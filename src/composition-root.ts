import { CIVILIZATIONS, REGION_MEMBERSHIP, SLICE_YEARS } from './data/dataset.ts';
import { EXPANSION_RECORDS } from './data/expansions.ts';
import { CatalogueService } from './services/atlas/catalogue-service.ts';
import { SliceService } from './services/atlas/slice-service.ts';
import { PaletteService } from './services/palette/palette-service.ts';

export interface AtlasServices {
    catalogue: CatalogueService;
    slices: SliceService;
    palette: PaletteService;
}

/**
 * Builds the services the interface talks to.
 *
 * The catalogue and the palette are pure and bundled; the slice service is the only one that
 * touches the network, and it reads the centuries out of `public/data` relative to wherever
 * the application happens to be served from.
 */
export function createServices(): AtlasServices {
    return {
        catalogue: new CatalogueService({
            civilizations: CIVILIZATIONS,
            expansionOrder: EXPANSION_RECORDS.map((expansion) => expansion.key),
        }),
        slices: new SliceService({ baseUrl: `${import.meta.env.BASE_URL}data/`, years: SLICE_YEARS }),
        palette: new PaletteService({ membership: REGION_MEMBERSHIP }),
    };
}
