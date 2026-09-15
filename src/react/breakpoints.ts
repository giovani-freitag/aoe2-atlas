/**
 * The widths the atlas changes shape at, in rem, and the only ones it may.
 *
 * Bootstrap's scale, because it is the one a reader of this stylesheet is most likely to already
 * know: 576, 768, 992, 1200 and 1400 pixels at a sixteen-pixel root. Stated in rem so the whole
 * ladder moves with a reader who has enlarged their text.
 *
 * The atlas used to turn at a single width, on the reasoning that if everything changes at the
 * same pixel then no two parts can disagree about which layout they are in. The reasoning was
 * sound and the result was not: between a phone and that one width the map sat in a phone's
 * arrangement with room for a great deal more, and at the width itself two columns arrived at
 * once and left the map narrower than either of them. Parts of the atlas now change at different
 * widths on purpose — and cannot do so by accident, because these are the only widths there are
 * and a test holds the stylesheets to them.
 */
export const BREAKPOINTS = {
    sm: 36,
    md: 48,
    lg: 62,
    xl: 75,
    xxl: 87.5,
} as const;

/** The steps, narrowest first. `xs` is everything below the first one and has no query. */
export const STEPS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

export type Step = (typeof STEPS)[number];

/** A named step, as a media query. */
export function widthOf(step: Exclude<Step, 'xs'>): string {
    return `(min-width: ${BREAKPOINTS[step]}rem)`;
}
