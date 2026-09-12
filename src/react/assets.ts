import type { Civilization } from '@/domain/entities/civilization.ts';

/**
 * Where a civilization's arms are served from.
 *
 * The path was written out at five places, each with its own idea of how to build it, and the
 * marker on the map needs it as an SVG href rather than as an element — so it is a function
 * rather than only a component.
 *
 * @param civilization - The civilization whose arms are wanted.
 */
export function armsUrl(civilization: Civilization): string {
    return `${import.meta.env.BASE_URL}img/civs/${civilization.icon}.webp`;
}
