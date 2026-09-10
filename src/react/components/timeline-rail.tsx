import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { useFormat } from '@/react/hooks/use-format.ts';

/** Width of one bucket of the standing-realms profile, in years. */
const BUCKET = 25;

export interface TimelineRailProps {
    /** Every civilization, so the profile does not move when a filter does. */
    civilizations: readonly Civilization[];
    from: number;
    to: number;
    year: number;
    /** The century the atlas actually has a map for, which may not be the year on the rail. */
    sliceYear: number;
    /** True while that century is still being fetched. */
    loading: boolean;
    onChange: (year: number) => void;
}

/**
 * The rail the whole atlas hangs from: a year, and how crowded the world was in it.
 *
 * This is not a filter bolted onto a map of peaks — it is the map's only axis. Everything drawn
 * above it is drawn as it stood in the year selected here, which is the one arrangement in
 * which two realms overlapping actually means they met.
 *
 * The profile behind the slider earns its place by showing something no list does: the game's
 * roster piles up between 800 and 1400 and thins out sharply either side.
 */
export function TimelineRail({ civilizations, from, to, year, sliceYear, loading, onChange }: TimelineRailProps) {
    const { t } = useTranslation();
    const format = useFormat();

    const buckets = useMemo(() => {
        const count = Math.ceil((to - from) / BUCKET);
        const bars = new Array<number>(count).fill(0);

        for (const civilization of civilizations) {
            const first = Math.max(0, Math.floor((civilization.span.from - from) / BUCKET));
            const last = Math.min(count - 1, Math.floor((civilization.span.to - from) / BUCKET));

            for (let index = first; index <= last; index += 1) bars[index] += 1;
        }

        return bars;
    }, [civilizations, from, to]);

    const tallest = Math.max(1, ...buckets);

    return (
        <div className="rail-body">
            <div className="rail-body__reading">
                <strong className="numeric">{format.year(year)}</strong>
                <span className="eyebrow">
                    {loading
                        ? t('rail.loading')
                        : sliceYear === year
                          ? t('rail.thisYear')
                          : t('rail.mapOf', { year: format.year(sliceYear) })}
                </span>
            </div>

            <div className="rail-body__track">
                <div className="rail-body__profile" aria-hidden>
                    {buckets.map((count, index) => (
                        <span
                            key={from + index * BUCKET}
                            data-reached={from + index * BUCKET <= year}
                            style={{ height: `${Math.max(6, (count / tallest) * 100)}%` }}
                        />
                    ))}
                </div>
                <div className="rail-body__rope oak" aria-hidden />
                <input
                    type="range"
                    min={from}
                    max={to}
                    step={5}
                    value={year}
                    aria-label={t('rail.year')}
                    aria-valuetext={format.year(year)}
                    onChange={(event) => {
                        onChange(Number(event.target.value));
                    }}
                />
            </div>

            <div className="rail-body__ends numeric" aria-hidden>
                <span>{format.year(from)}</span>
                <span>{format.year(to)}</span>
            </div>
        </div>
    );
}
