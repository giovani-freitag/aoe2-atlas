/** The projections the atlas can draw itself in. */
export const PROJECTION_KEYS = ['equal-earth', 'natural-earth', 'mercator'] as const;

export type ProjectionKey = (typeof PROJECTION_KEYS)[number];

export interface ProjectionProfile {
    key: ProjectionKey;
    /** The projection's proper name, the same in every language. */
    name: string;
    /** Whether a reader may compare two shapes on it by eye. */
    equalArea: boolean;
}

/**
 * What each projection is honest about, and what it is not.
 *
 * No projection is neutral, so the atlas says which lie each one tells rather than picking one
 * and hoping nobody notices; the wording lives in the locale bundles under `projections`. The
 * measured areas in the panels never change with this choice: they are computed on the sphere
 * when the data is built, not read off the drawing.
 */
export const PROJECTIONS: Readonly<Record<ProjectionKey, ProjectionProfile>> = {
    'equal-earth': { key: 'equal-earth', name: 'Equal Earth', equalArea: true },
    'natural-earth': { key: 'natural-earth', name: 'Natural Earth', equalArea: false },
    mercator: { key: 'mercator', name: 'Mercator', equalArea: false },
};
