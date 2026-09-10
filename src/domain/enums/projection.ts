/** The projections the atlas can draw itself in. */
export const PROJECTION_KEYS = ['equal-earth', 'natural-earth', 'mercator'] as const;

export type ProjectionKey = (typeof PROJECTION_KEYS)[number];

export interface ProjectionProfile {
    key: ProjectionKey;
    name: string;
    /** What the projection keeps true, in one word. */
    preserves: string;
    /** Whether a reader may compare two shapes on it by eye. */
    equalArea: boolean;
    /** The trade-off, said plainly, shown wherever the reader picks one. */
    caveat: string;
}

/**
 * What each projection is honest about, and what it is not.
 *
 * No projection is neutral, so the atlas says which lie each one tells rather than picking one
 * and hoping nobody notices. The measured areas in the panels never change with this choice:
 * they are computed on the sphere when the data is built, not read off the drawing.
 */
export const PROJECTIONS: Readonly<Record<ProjectionKey, ProjectionProfile>> = {
    'equal-earth': {
        key: 'equal-earth',
        name: 'Equal Earth',
        preserves: 'área',
        equalArea: true,
        caveat: 'Áreas comparáveis a olho. As formas próximas às bordas ficam inclinadas.',
    },
    'natural-earth': {
        key: 'natural-earth',
        name: 'Natural Earth',
        preserves: 'aparência',
        equalArea: false,
        caveat: 'Um meio-termo agradável: não preserva nem área nem ângulo, erra pouco em ambos.',
    },
    mercator: {
        key: 'mercator',
        name: 'Mercator',
        preserves: 'ângulo',
        equalArea: false,
        caveat: 'Familiar, mas infla o que está longe do equador. Compare tamanhos pelos números.',
    },
};
