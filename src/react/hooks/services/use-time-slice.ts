import { useEffect, useState } from 'react';
import type { TimeSlice } from '@/services/atlas/slice-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

export interface SliceState {
    /** The century on screen, or the last one that loaded while a newer one is on its way. */
    slice: TimeSlice | null;
    /** True while the century matching the rail is still being fetched. */
    loading: boolean;
    /** True when the century could not be fetched at all. */
    failed: boolean;
}

/**
 * Keeps the century of borders matching the year on the rail.
 *
 * While a new century is on its way the previous one stays on screen rather than blanking the
 * map: scrubbing the rail crosses several centuries, and a map that flickers empty between each
 * of them is unusable. The neighbours are warmed in the background for the same reason.
 *
 * Which century is on screen is *derived* from what has arrived rather than pushed into state
 * by the effect, so asking for a century already in hand costs no extra render at all.
 *
 * @param year - The year the reader is parked on.
 */
export function useTimeSlice(year: number): SliceState {
    const { slices } = useServices();
    const sliceYear = slices.sliceYearFor(year);
    const [arrived, setArrived] = useState<{ year: number; slice: TimeSlice } | null>(null);
    const [failed, setFailed] = useState<{ year: number } | null>(null);

    useEffect(() => {
        let current = true;

        slices.load(sliceYear).then(
            (slice) => {
                if (!current) return;
                setArrived({ year: sliceYear, slice });

                /*
                 * The neighbours are warmed once the browser has nothing better to do.
                 *
                 * They are a convenience for scrubbing the rail, and fetching them the instant
                 * the first century lands put two more centuries in front of the coastline on a
                 * connection that had none to spare — the shore arrived a second and a half late
                 * so that a reader who never touched the rail would have had the next map ready.
                 */
                const warm = (): void => {
                    if (current) slices.warmNeighbours(sliceYear);
                };

                if (typeof window.requestIdleCallback === 'function') {
                    window.requestIdleCallback(warm, { timeout: 4000 });
                } else {
                    window.setTimeout(warm, 1500);
                }
            },
            () => {
                if (!current) return;
                setFailed({ year: sliceYear });
            },
        );

        return () => {
            current = false;
        };
    }, [slices, sliceYear]);

    return {
        slice: arrived?.slice ?? null,
        loading: arrived?.year !== sliceYear && failed?.year !== sliceYear,
        failed: failed?.year === sliceYear,
    };
}
