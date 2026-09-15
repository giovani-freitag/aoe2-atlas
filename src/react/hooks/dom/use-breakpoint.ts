import { useCallback, useSyncExternalStore } from 'react';
import { widthOf, type Step } from '@/react/breakpoints.ts';

/**
 * Whether the window has reached a named step of the ladder.
 *
 * The layout itself is CSS and stays there. This answers only the parts CSS cannot: whether a
 * panel laid over the map should trap the focus and make the rest inert, whether a control that
 * exists to be dragged is draggable at this size, which of two arrangements of a civilization to
 * build. Each caller names the step it turns at, so no caller has to know about any other.
 *
 * The window is read where it is rather than copied into state, so there is no first render
 * holding a stale answer and nothing to keep in step by hand.
 *
 * @param step - The step to ask about; `xs` is always reached.
 * @returns True once the window is at least that wide.
 */
export function useAtLeast(step: Step): boolean {
    const query = step === 'xs' ? null : widthOf(step);

    const subscribe = useCallback(
        (notify: () => void) => {
            if (query === null) return () => undefined;

            const media = matchMedia(query);
            media.addEventListener('change', notify);

            return () => {
                media.removeEventListener('change', notify);
            };
        },
        [query],
    );

    const read = useCallback(() => (query === null ? true : matchMedia(query).matches), [query]);

    return useSyncExternalStore(subscribe, read, () => true);
}
