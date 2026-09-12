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
    return useMeasured(name, 'height');
}

/**
 * The same, across. One floating panel standing beside another has to know how wide that one is.
 *
 * @param name - The custom property to write, leading dashes and all.
 * @returns A ref to attach to the element being measured.
 */
export function useMeasuredWidth<T extends HTMLElement>(name: string): RefObject<T | null> {
    return useMeasured(name, 'width');
}

function useMeasured<T extends HTMLElement>(name: string, axis: 'width' | 'height'): RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const publish = (size: number): void => {
            document.documentElement.style.setProperty(name, `${Math.round(size)}px`);
        };

        // The border box, not the content box: padding and rules are part of what a panel covers.
        const observer = new ResizeObserver((entries) => {
            const box = entries[0]?.borderBoxSize[0];
            const measured = box ? (axis === 'height' ? box.blockSize : box.inlineSize) : null;
            publish(measured ?? element.getBoundingClientRect()[axis]);
        });

        observer.observe(element);
        publish(element.getBoundingClientRect()[axis]);

        return () => {
            observer.disconnect();
            document.documentElement.style.removeProperty(name);
        };
    }, [name, axis]);

    return ref;
}
