import { useEffect, useState } from 'react';
import type { SliceService, TimeSlice } from '@/services/atlas/slice-service.ts';

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
 * @param slices - The service that fetches and caches the centuries.
 * @param year - The year the reader is parked on.
 */
export function useTimeSlice(slices: SliceService, year: number): SliceState {
    const sliceYear = slices.sliceYearFor(year);
    const [arrived, setArrived] = useState<{ year: number; slice: TimeSlice } | null>(null);
    const [failed, setFailed] = useState<{ year: number } | null>(null);

    useEffect(() => {
        let current = true;

        slices.load(sliceYear).then(
            (slice) => {
                if (!current) return;
                setArrived({ year: sliceYear, slice });
                slices.warmNeighbours(sliceYear);
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
