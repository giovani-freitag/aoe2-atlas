import type { PaletteService } from '@/services/palette/palette-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

/**
 * How each realm is painted.
 *
 * Colour follows the region and the hatch angle carries the civilization, and neither depends on
 * the language or on the century, so there is nothing here to subscribe to.
 */
export function usePalette(): PaletteService {
    return useServices().palette;
}
