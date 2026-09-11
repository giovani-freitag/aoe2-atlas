import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useFormat } from '@/react/hooks/use-format.ts';

export interface YearStepperProps {
    /** The years the atlas has maps for, oldest first; the arrows walk this list. */
    years: readonly number[];
    year: number;
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
 *
 * The arrows step from map to map. A fixed stride of fifty years took two presses to change
 * anything and, half the time, left the rail reading a year the atlas has no map for.
 */
export function YearStepper({ years, year, loading, onChange, settingsOpen, onToggleSettings }: YearStepperProps) {
    const { t } = useTranslation();
    const format = useFormat();

    const at = Math.max(0, years.indexOf(year));
    const back = years[at - 1];
    const forward = years[at + 1];

    return (
        <div className="stepper">
            <button
                type="button"
                className="stepper__arrow iron"
                onClick={() => {
                    if (back !== undefined) onChange(back);
                }}
                disabled={back === undefined}
                aria-label={t('rail.back', { years: back === undefined ? 0 : year - back })}
            >
                <ChevronLeft size={20} aria-hidden />
            </button>

            <button type="button" className="stepper__reading" aria-expanded={settingsOpen} onClick={onToggleSettings}>
                <strong className="numeric">{format.year(year)}</strong>
                <span className="eyebrow">{loading ? t('rail.loading') : t('rail.year')}</span>
            </button>

            <button
                type="button"
                className="stepper__arrow iron"
                onClick={() => {
                    if (forward !== undefined) onChange(forward);
                }}
                disabled={forward === undefined}
                aria-label={t('rail.forward', { years: forward === undefined ? 0 : forward - year })}
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
