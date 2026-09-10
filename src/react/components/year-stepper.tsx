import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { formatYear } from '@/react/format.ts';

/** How far the arrows move the year, which is a human-sized step through the centuries. */
const STEP = 50;

export interface YearStepperProps {
    from: number;
    to: number;
    year: number;
    /** The century the atlas has a map for, which may not be the year on the rail. */
    sliceYear: number;
    loading: boolean;
    onChange: (year: number) => void;
    /** Opens the panel holding the full time control. */
    onOpenSettings: () => void;
}

/**
 * The whole time control a phone gets: an arrow, the year, an arrow.
 *
 * A slider with a histogram under it is the right instrument on a desktop and clutter on a
 * phone, where it competes with the map for the bottom of the screen. So the fine control moves
 * into the settings panel and what stays is the reading itself, which is the part that has to
 * be visible at all times because the whole map depends on it.
 */
export function YearStepper({ from, to, year, sliceYear, loading, onChange, onOpenSettings }: YearStepperProps) {
    const step = (by: number): void => {
        onChange(Math.min(to, Math.max(from, year + by)));
    };

    return (
        <div className="stepper">
            <button
                type="button"
                className="stepper__arrow iron"
                onClick={() => {
                    step(-STEP);
                }}
                disabled={year <= from}
                aria-label={`Recuar ${STEP} anos`}
            >
                <ChevronLeft size={20} aria-hidden />
            </button>

            <button type="button" className="stepper__reading" onClick={onOpenSettings}>
                <strong className="numeric">{formatYear(year)}</strong>
                <span className="eyebrow">
                    {loading ? 'carregando…' : sliceYear === year ? 'mapa deste ano' : `mapa de ${formatYear(sliceYear)}`}
                </span>
            </button>

            <button
                type="button"
                className="stepper__arrow iron"
                onClick={() => {
                    step(STEP);
                }}
                disabled={year >= to}
                aria-label={`Avançar ${STEP} anos`}
            >
                <ChevronRight size={20} aria-hidden />
            </button>

            <button
                type="button"
                className="stepper__more iron"
                onClick={onOpenSettings}
                aria-label="Abrir os ajustes do mapa"
            >
                <SlidersHorizontal size={18} aria-hidden />
            </button>
        </div>
    );
}
