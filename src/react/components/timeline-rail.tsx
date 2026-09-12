import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import { useFormat } from '@/react/hooks/use-format.ts';

export interface TimelineRailProps {
    /** Every civilization, so the profile does not move when a filter does. */
    civilizations: readonly Civilization[];
    /** The years the atlas has maps for, oldest first; the slider stops on these and only these. */
    years: readonly number[];
    year: number;
    /** True while the chosen century is still being fetched. */
    loading: boolean;
    /** Adds an arrow either side of the reading, for choosing a century without dragging. */
    stepping?: boolean;
    /** A control to stand at the end of the track's row, where the thumb already is. */
    trailing?: ReactNode;
    onChange: (year: number) => void;
}

/**
 * The rail the whole atlas hangs from: a year, and how crowded the world was in it.
 *
 * This is not a filter bolted onto a map of peaks — it is the map's only axis. Everything drawn
 * above it is drawn as it stood in the year selected here, which is the one arrangement in
 * which two realms overlapping actually means they met.
 *
 * The slider counts maps, not years. The atlas holds nineteen of them and they are not evenly
 * spaced — 1279 and 1300 sit a generation apart, 300 and 400 a century — so a slider ruled in
 * years would spend most of its travel on positions that redraw nothing and would report a year
 * the map does not actually show. One notch, one map.
 *
 * On a phone it also carries an arrow either side of the track. Nineteen stops across a phone is
 * a dozen pixels apiece, which a thumb can sweep but cannot aim — and telling 1279 from 1300 is
 * exactly the kind of thing a reader comes here to do. They sit beside the track rather than on
 * a line of their own, because a line of their own cost the map thirty pixels of its height.
 */
export function TimelineRail({ civilizations, years, year, loading, stepping, trailing, onChange }: TimelineRailProps) {
    const { t } = useTranslation();
    const format = useFormat();

    /*
     * How many of the game's civilizations were on stage in each of those years.
     *
     * A bar per map rather than a bar per fixed span of years, so every bar stands over the
     * notch that brings it up. The roster piles up between 800 and 1400 and thins out sharply
     * either side, which is the one thing about the timeline no list of civilizations shows.
     */
    const profile = useMemo(
        () => years.map((at) => civilizations.filter((civ) => civ.span.from <= at && at <= civ.span.to).length),
        [civilizations, years],
    );

    const tallest = Math.max(1, ...profile);
    const at = Math.max(0, years.indexOf(year));
    const first = years[0] ?? year;
    const last = years[years.length - 1] ?? year;
    const back = years[at - 1];
    const forward = years[at + 1];

    return (
        <div className="rail-body">
            <div className="rail-body__reading">
                <strong className="numeric">{format.year(year)}</strong>
                <span className="eyebrow">{loading ? t('rail.loading') : t('rail.year')}</span>
            </div>

            <div className="rail-body__lane">
                {stepping ? (
                    <button
                        type="button"
                        className="rail-body__step iron"
                        onClick={() => {
                            if (back !== undefined) onChange(back);
                        }}
                        disabled={back === undefined}
                        aria-label={t('rail.back', { years: back === undefined ? 0 : year - back })}
                    >
                        <ChevronLeft size={20} aria-hidden />
                    </button>
                ) : null}

                {/*
                 * How many stops there are, and which one we are on, as numbers the stylesheet can
                 * do arithmetic with: everything drawn behind the slider has to land on exactly the
                 * same positions the slider's own handle can reach.
                 */}
                <div
                    className="rail-body__track"
                    style={{ '--bars': profile.length, '--at': at / Math.max(1, years.length - 1) } as CSSProperties}
                >
                    <div className="rail-body__profile" aria-hidden>
                        {profile.map((count, index) => (
                            <span
                                key={years[index]}
                                data-reached={index <= at}
                                style={{ height: `${Math.max(6, (count / tallest) * 100)}%` }}
                            />
                        ))}
                    </div>
                    <div className="rail-body__rope oak" aria-hidden />
                    <div className="rail-body__fill" aria-hidden />
                    <input
                        type="range"
                        min={0}
                        max={Math.max(0, years.length - 1)}
                        step={1}
                        value={at}
                        aria-label={t('rail.year')}
                        aria-valuetext={format.year(year)}
                        onChange={(event) => {
                            const chosen = years[Number(event.target.value)];
                            if (chosen !== undefined) onChange(chosen);
                        }}
                    />
                </div>

                {stepping ? (
                    <button
                        type="button"
                        className="rail-body__step iron"
                        onClick={() => {
                            if (forward !== undefined) onChange(forward);
                        }}
                        disabled={forward === undefined}
                        aria-label={t('rail.forward', { years: forward === undefined ? 0 : forward - year })}
                    >
                        <ChevronRight size={20} aria-hidden />
                    </button>
                ) : null}

                {trailing}
            </div>



            <div className="rail-body__ends numeric" aria-hidden>
                <span>{format.year(first)}</span>
                <span>{format.year(last)}</span>
            </div>
        </div>
    );
}
