import { Pin, PinOff } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import type { CivilizationStyle } from '@/services/palette/palette-service.ts';
import { formatArea } from '@/react/format.ts';
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
                <img
                    className="civ__arms"
                    src={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                    alt=""
                    width={26}
                    height={26}
                    loading="lazy"
                />
                <span className="civ__name">{civilization.name}</span>
                <span className="civ__area numeric">{border ? formatArea(border.areaKm2) : '—'}</span>
            </button>
            <button
                type="button"
                className="civ__pin"
                data-pinned={pinned}
                disabled={border === null}
                onClick={() => {
                    onTogglePin(civilization.key);
                }}
                aria-label={pinned ? `Tirar ${civilization.name} do mapa` : `Traçar ${civilization.name} no mapa`}
            >
                {pinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
            </button>
        </li>
    );
}
