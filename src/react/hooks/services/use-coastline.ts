import { useEffect, useState } from 'react';
import type { MultiPolygonRings } from '@/domain/values/geo-shape.ts';
import { useServices } from '@/react/providers/services-context.ts';

/**
 * The coastline, once it has arrived.
 *
 * Null on a cold load until the file arrives, during which the map draws its sea and the realms
 * it already has, and the shore fills in under them. It is asked for after mount on purpose,
 * behind the bundle and the first century: those two are what the first shield needs, and on a
 * slow connection a third download alongside them was measured to delay it. If it never arrives
 * the map stays usable — realms on sea, without the shore — which is a degraded map and not a
 * blank one, and the reason no error is raised for it.
 */
export function useCoastline(): MultiPolygonRings | null {
    const { coastline } = useServices();
    const [rings, setRings] = useState<MultiPolygonRings | null>(() => coastline.peek());

    useEffect(() => {
        let current = true;

        coastline.load().then(
            (loaded) => {
                if (current) setRings(loaded);
            },
            () => undefined,
        );

        return () => {
            current = false;
        };
    }, [coastline]);

    return rings;
}
