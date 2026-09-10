import type { Civilization } from '@/domain/entities/civilization.ts';

/** Side of the icon plate, in screen pixels; markers never scale with the map. */
const SIZE = 26;

export interface WonderMarkerProps {
    civilization: Civilization;
    /** Screen position of the monument. */
    at: [number, number];
    colour: string;
    /** Dimmed when the timeline has moved past the years the civilization stood. */
    faded: boolean;
    active: boolean;
    highlighted: boolean;
    onSelect: (key: string) => void;
    onHover: (key: string | null) => void;
}

/**
 * A civilization's mark, standing on the real monument its Wonder was copied from.
 *
 * The marker is positioned in screen space rather than inside the zoomed group, so the icon
 * stays the same size at every zoom and the reader can still tell Chichester from Chartres when
 * the map is pulled all the way out.
 */
export function WonderMarker({
    civilization,
    at,
    colour,
    faded,
    active,
    highlighted,
    onSelect,
    onHover,
}: WonderMarkerProps) {
    const [x, y] = at;
    const half = SIZE / 2;
    const label = `${civilization.name} — ${civilization.wonder.monument}, ${civilization.wonder.place}`;

    return (
        <g
            className="marker"
            data-active={active}
            data-highlighted={highlighted}
            data-faded={faded}
            transform={`translate(${x - half}, ${y - half})`}
            onClick={() => {
                onSelect(civilization.key);
            }}
            onPointerEnter={() => {
                onHover(civilization.key);
            }}
            onPointerLeave={() => {
                onHover(null);
            }}
            tabIndex={0}
            role="button"
            aria-label={label}
            onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onSelect(civilization.key);
            }}
        >
            <title>{label}</title>
            <rect
                className="marker__plate"
                width={SIZE}
                height={SIZE}
                rx={3}
                stroke={colour}
                strokeWidth={active || highlighted ? 2 : 1.25}
            />
            <image
                href={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                x={3}
                y={3}
                width={SIZE - 6}
                height={SIZE - 6}
                className="marker__icon"
            />
        </g>
    );
}
