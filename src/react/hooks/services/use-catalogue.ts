import type { CatalogueService } from '@/services/atlas/catalogue-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

/** The roster, for asking which civilizations are being talked about. */
export function useCatalogue(): CatalogueService {
    return useServices().catalogue;
}
