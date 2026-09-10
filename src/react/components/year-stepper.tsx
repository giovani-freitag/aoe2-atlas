import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useFormat } from '@/react/hooks/use-format.ts';

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
    /** Whether that panel is on screen, so the control can say what a press will do. */
    settingsOpen: boolean;
    /** Opens the panel holding the full time control, or closes it when it is already up. */
    onToggleSettings: () => void;
}

/**
 * The whole time control a phone gets: an arrow, the year, an arrow.
 *
 * A slider with a histogram under it is the right instrument on a desktop and clutter on a
 * phone, where it competes with the map for the bottom of the screen. So the fine control moves
 * into the settings panel and what stays is the reading itself, which is the part that has to
 * be visible at all times because the whole map depends on it.
 */
export function YearStepper({
    from,
    to,
    year,
    sliceYear,
    loading,
    onChange,
    settingsOpen,
    onToggleSettings,
}: YearStepperProps) {
    const { t } = useTranslation();
    const format = useFormat();

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
                aria-label={t('rail.back', { years: STEP })}
            >
                <ChevronLeft size={20} aria-hidden />
            </button>

            <button type="button" className="stepper__reading" aria-expanded={settingsOpen} onClick={onToggleSettings}>
                <strong className="numeric">{format.year(year)}</strong>
                <span className="eyebrow">
                    {loading
                        ? t('rail.loading')
                        : sliceYear === year
                          ? t('rail.thisYear')
                          : t('rail.mapOf', { year: format.year(sliceYear) })}
                </span>
            </button>

            <button
                type="button"
                className="stepper__arrow iron"
                onClick={() => {
                    step(STEP);
                }}
                disabled={year >= to}
                aria-label={t('rail.forward', { years: STEP })}
            >
                <ChevronRight size={20} aria-hidden />
            </button>

            <button
                type="button"
                className="stepper__more iron"
                aria-expanded={settingsOpen}
                onClick={onToggleSettings}
                aria-label={t(settingsOpen ? 'app.closeSettings' : 'app.openSettings')}
            >
                <SlidersHorizontal size={18} aria-hidden />
            </button>
        </div>
    );
}
