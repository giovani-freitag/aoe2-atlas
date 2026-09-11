import { useEffect, useRef, type RefObject } from 'react';

/**
 * Publishes an element's height as a CSS custom property on the document.
 *
 * The panels that slide over the map are fixed to the viewport, so they know nothing about the
 * header above the map or the year rail below it, and left alone they cover both — which took
 * away the one control the whole atlas depends on. Their height is content rather than a
 * constant, since the rail carries a histogram and a slider on a desktop and two arrows on a
 * phone, so it is measured and handed to the stylesheet instead of guessed at.
 *
 * @param name - The custom property to write, leading dashes and all.
 * @returns A ref to attach to the element being measured.
 */
export function useMeasuredHeight<T extends HTMLElement>(name: string): RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const publish = (height: number): void => {
            document.documentElement.style.setProperty(name, `${Math.round(height)}px`);
        };

        // The border box, not the content box: the bar's padding and rule are part of what it covers.
        const observer = new ResizeObserver((entries) => {
            const box = entries[0]?.borderBoxSize[0];
            publish(box ? box.blockSize : element.getBoundingClientRect().height);
        });

        observer.observe(element);
        publish(element.getBoundingClientRect().height);

        return () => {
            observer.disconnect();
            document.documentElement.style.removeProperty(name);
        };
    }, [name]);

    return ref;
}
