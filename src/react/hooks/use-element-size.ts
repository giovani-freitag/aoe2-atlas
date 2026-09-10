import { useEffect, useRef, useState, type RefObject } from 'react';

export interface Size {
    width: number;
    height: number;
}

/**
 * Watches an element and hands back the space it currently occupies.
 *
 * The map has to rebuild its projection whenever the box around it changes, and a window resize
 * listener would miss the sidebar opening, so this measures the element rather than the window.
 *
 * @returns A ref to attach to the element, and its size — zero until the first measurement.
 */
export function useElementSize<T extends Element>(): [RefObject<T | null>, Size] {
    const ref = useRef<T>(null);
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            const box = entries[0]?.contentRect;
            if (!box) return;

            setSize({ width: Math.round(box.width), height: Math.round(box.height) });
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    return [ref, size];
}
