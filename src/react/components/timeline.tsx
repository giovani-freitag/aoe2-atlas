import { useMemo } from 'react';
import { Clock, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { formatYear } from '@/react/format.ts';

/** Width of one bucket of the standing-realms histogram, in years. */
const BUCKET = 25;

export interface TimelineProps {
    /** Every civilization in the catalogue, so the histogram does not move when a filter does. */
    civilizations: readonly Civilization[];
    from: number;
    to: number;
    /** The year the scrubber sits on, or null while the timeline is off. */
    year: number | null;
    onChange: (year: number | null) => void;
}

/**
 * A scrubber over the years, with a profile of how crowded each one was.
 *
 * The histogram is the reason this is not just a slider: it shows at a glance that the game's
 * roster piles up between 800 and 1400 and thins out either side, which is a fact about Age of
 * Empires II that no list of civilizations makes visible.
 */
export function Timeline({ civilizations, from, to, year, onChange }: TimelineProps) {
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
    const active = year ?? to;

    return (
        <div className="timeline" data-on={year !== null}>
            <div className="timeline__label">
                <Clock size={14} aria-hidden />
                <span className="eyebrow">Ano</span>
                <strong className="numeric">{year === null ? 'todos' : formatYear(year)}</strong>
                {year !== null ? (
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                        }}
                        aria-label="Desligar o filtro de ano"
                    >
                        <X size={13} aria-hidden />
                    </button>
                ) : null}
            </div>

            <div className="timeline__track">
                <div className="timeline__histogram" aria-hidden>
                    {buckets.map((count, index) => (
                        <span
                            key={from + index * BUCKET}
                            data-past={year !== null && from + index * BUCKET <= active}
                            style={{ height: `${(count / tallest) * 100}%` }}
                        />
                    ))}
                </div>
                <input
                    type="range"
                    min={from}
                    max={to}
                    step={5}
                    value={active}
                    aria-label="Ano do mapa"
                    aria-valuetext={year === null ? 'todos os anos' : formatYear(year)}
                    onChange={(event) => {
                        onChange(Number(event.target.value));
                    }}
                />
                <div className="timeline__ends numeric" aria-hidden>
                    <span>{formatYear(from)}</span>
                    <span>{formatYear(to)}</span>
                </div>
            </div>
        </div>
    );
}
