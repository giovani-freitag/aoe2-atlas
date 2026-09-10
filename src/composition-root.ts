import { CIVILIZATIONS, CONFLICTS, REGION_MEMBERSHIP } from './data/dataset.ts';
import { EXPANSION_RECORDS } from './data/expansions.ts';
import { AtlasService } from './services/atlas/atlas-service.ts';
import { PaletteService } from './services/palette/palette-service.ts';

export interface AtlasServices {
    atlas: AtlasService;
    palette: PaletteService;
}

/**
 * Builds the services the interface talks to.
 *
 * Everything is stateless and derived from the shipped data, so one instance serves the whole
 * session and the React tree only ever reads from it.
 */
export function createServices(): AtlasServices {
    return {
        atlas: new AtlasService({
            civilizations: CIVILIZATIONS,
            conflicts: CONFLICTS,
            expansionOrder: EXPANSION_RECORDS.map((expansion) => expansion.key),
        }),
        palette: new PaletteService({ membership: REGION_MEMBERSHIP }),
    };
}
