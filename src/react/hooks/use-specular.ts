import { useEffect } from 'react';
import { Specular } from '@/react/effects/specular.ts';

/**
 * Lights metal wherever the pointer crosses it.
 *
 * One listener on the document serves every plate on the page, and a device with no pointer
 * never fires it, so the whole effect costs nothing on a phone.
 *
 * @param selector - The surfaces the reflection is allowed to land on.
 */
export function useSpecular(selector: string): void {
    useEffect(() => {
        const specular = new Specular({ selector, root: document });
        specular.start();

        return () => {
            specular.stop();
        };
    }, [selector]);
}
