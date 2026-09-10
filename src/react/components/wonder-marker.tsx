import type { Civilization } from '@/domain/entities/civilization.ts';

/**
 * Side of the icon plate, in screen pixels.
 *
 * Markers never scale with the map, and this is also the tap target, so it is sized for a
 * thumb rather than for a mouse.
 */
const SIZE = 34;

export interface WonderMarkerProps {
    civilization: Civilization;
    /** Screen position of the monument. */
    at: [number, number];
    colour: string;
    /** True when the civilization has a border drawn in the century on the rail. */
    standing: boolean;
    focused: boolean;
    highlighted: boolean;
    onOpen: (key: string) => void;
    onHover: (key: string | null) => void;
}

/**
 * A civilization's mark, standing on the real monument its Wonder was copied from.
 *
 * The marker is positioned in screen space rather than inside the zoomed group, so the shield
 * stays the same size at every zoom and the reader can still tell Chichester from Chartres
 * with the map pulled all the way out.
 */
export function WonderMarker({
    civilization,
    at,
    colour,
    standing,
    focused,
    highlighted,
    onOpen,
    onHover,
}: WonderMarkerProps) {
    const [x, y] = at;
    const half = SIZE / 2;
    const label = `${civilization.name} — ${civilization.wonder.monument}, ${civilization.wonder.place}`;

    return (
        <g
            className="marker"
            data-focused={focused}
            data-highlighted={highlighted}
            data-standing={standing}
            transform={`translate(${x - half}, ${y - half})`}
            onClick={() => {
                onOpen(civilization.key);
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
                onOpen(civilization.key);
            }}
        >
            <title>{label}</title>
            {/* A heater shield, which is the shape the game hangs every civilization's arms on. */}
            <path
                className="marker__shield"
                d={`M2 2 H${SIZE - 2} V${SIZE * 0.55} Q${SIZE - 2} ${SIZE - 2} ${half} ${SIZE - 1}
                    Q2 ${SIZE - 2} 2 ${SIZE * 0.55} Z`}
                stroke={colour}
                strokeWidth={focused || highlighted ? 2.5 : 1.5}
            />
            <image
                href={`${import.meta.env.BASE_URL}img/civs/${civilization.icon}.png`}
                x={5}
                y={4}
                width={SIZE - 10}
                height={SIZE - 10}
                className="marker__arms"
            />
        </g>
    );
}
