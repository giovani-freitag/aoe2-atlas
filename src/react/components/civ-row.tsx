import { Pin, PinOff } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { CivilizationStyle } from '@/services/palette/palette-service.ts';
import type { ColourScheme } from '@/react/hooks/use-colour-scheme.ts';
import { formatArea } from '@/react/format.ts';
import { HatchSwatch } from './hatch-swatch.tsx';

export interface CivRowProps {
    civilization: Civilization;
    style: CivilizationStyle;
    scheme: ColourScheme;
    /** The realm's area as a fraction of the largest one on the list, for the bar behind the name. */
    share: number;
    selected: boolean;
    pinned: boolean;
    /** Dimmed when the timeline is parked outside the years it stood. */
    faded: boolean;
    onSelect: (key: string) => void;
    onTogglePin: (key: string) => void;
    onHover: (key: string | null) => void;
}

/** One civilization in the list: its mark, its name, and how much ground it held. */
export function CivRow({
    civilization,
    style,
    scheme,
    share,
    selected,
    pinned,
    faded,
    onSelect,
    onTogglePin,
    onHover,
}: CivRowProps) {
    const colour = scheme === 'dark' ? style.dark : style.light;

    return (
        <li
            className="civ-row"
            data-selected={selected}
            data-faded={faded}
            onPointerEnter={() => {
                onHover(civilization.key);
            }}
            onPointerLeave={() => {
                onHover(null);
            }}
        >
            <button
                type="button"
                className="civ-row__main"
                onClick={() => {
                    onSelect(civilization.key);
                }}
                aria-pressed={selected}
            >
                <span className="civ-row__bar" style={{ width: `${share * 100}%`, background: colour }} aria-hidden />
                <HatchSwatch style={style} scheme={scheme} size={14} />
                <img
                    className="civ-row__icon"
                    src={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                    alt=""
                    width={22}
                    height={22}
                    loading="lazy"
                />
                <span className="civ-row__name">{civilization.name}</span>
                <span className="civ-row__area numeric">{formatArea(civilization.territory.areaKm2)}</span>
            </button>
            <button
                type="button"
                className="civ-row__pin"
                data-pinned={pinned}
                onClick={() => {
                    onTogglePin(civilization.key);
                }}
                aria-label={pinned ? `Tirar ${civilization.name} da comparação` : `Comparar ${civilization.name}`}
                title={pinned ? 'Tirar da comparação' : 'Fixar para comparar'}
            >
                {pinned ? <PinOff size={14} aria-hidden /> : <Pin size={14} aria-hidden />}
            </button>
        </li>
    );
}
