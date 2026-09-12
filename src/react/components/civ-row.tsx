import { useTranslation } from 'react-i18next';
import { Pin, PinOff } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import type { CivilizationStyle } from '@/services/palette/palette-service.ts';
import { useCivilizationText } from '@/react/hooks/use-civilization-text.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { CivArms } from './civ-arms.tsx';
import { HatchSwatch } from './hatch-swatch.tsx';

export interface CivRowProps {
    civilization: Civilization;
    style: CivilizationStyle;
    /** The border it holds in the century on screen, or null when it held none. */
    border: RealmBorder | null;
    /** Its area against the largest realm on the list, for the bar behind the name. */
    share: number;
    focused: boolean;
    pinned: boolean;
    onOpen: (key: string) => void;
    onTogglePin: (key: string) => void;
    onHover: (key: string | null) => void;
}

/** One civilization in the roster: its arms, its name, and the ground it held this century. */
export function CivRow({
    civilization,
    style,
    border,
    share,
    focused,
    pinned,
    onOpen,
    onTogglePin,
    onHover,
}: CivRowProps) {
    const { t } = useTranslation();
    const words = useCivilizationText(civilization);
    const format = useFormat();

    return (
        <li
            className="civ"
            data-focused={focused}
            data-absent={border === null}
            onPointerEnter={() => {
                onHover(civilization.key);
            }}
            onPointerLeave={() => {
                onHover(null);
            }}
        >
            <button
                type="button"
                className="civ__main"
                onClick={() => {
                    onOpen(civilization.key);
                }}
                aria-pressed={focused}
            >
                <span className="civ__bar" style={{ width: `${share * 100}%`, background: style.colour }} aria-hidden />
                <HatchSwatch style={style} size={14} />
                <CivArms civilization={civilization} size={26} />
                {/*
                 * The monument under the name, not only behind a tap.
                 *
                 * "Hagia Sophia" is what a reader came here knowing, and it was the one thing the
                 * list would not tell them — every one of the fifty-six lived inside the panel
                 * that opens on click. The place it stands in stays there: at the width this
                 * column has on a phone, a second line would clip on most of the roster.
                 */}
                <span className="civ__text">
                    <span className="civ__name">{words.name}</span>
                    <span className="civ__monument" title={words.monument}>
                        {words.monument}
                    </span>
                </span>
                <span className="civ__area numeric">{border ? format.area(border.areaKm2) : '—'}</span>
            </button>
            <button
                type="button"
                className="civ__pin"
                data-pinned={pinned}
                disabled={border === null}
                onClick={() => {
                    onTogglePin(civilization.key);
                }}
                aria-label={pinned ? t('roster.untrace', { name: words.name }) : t('roster.trace', { name: words.name })}
            >
                {pinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
            </button>
        </li>
    );
}
