export interface CompassRoseProps {
    /** Centre of the rose, in screen pixels. */
    at: [number, number];
    /** Radius of the long points. */
    radius: number;
}

/**
 * A sixteen-point wind rose, the way a chart of the period signs its orientation.
 *
 * It is drawn in screen space rather than on the globe: a rose that stretched with the
 * projection would be telling the reader something about the map that is not true.
 */
export function CompassRose({ at, radius }: CompassRoseProps) {
    const [x, y] = at;
    const short = radius * 0.42;

    return (
        <g className="rose" transform={`translate(${x}, ${y})`} aria-hidden>
            <circle className="rose__ring" r={radius * 0.82} />
            <circle className="rose__ring" r={radius * 0.24} />

            {/* Eight half-winds first, so the cardinals are drawn over them. */}
            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
                <path key={angle} className="rose__minor" d={point(short)} transform={`rotate(${angle})`} />
            ))}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <path key={angle} className="rose__major" d={point(radius)} transform={`rotate(${angle})`} />
            ))}

            <path className="rose__north" d={point(radius * 1.12)} />
            <text className="rose__label" y={-radius * 1.22} textAnchor="middle">
                N
            </text>
        </g>
    );
}

/** One kite-shaped point of the rose, aimed north before it is rotated into place. */
function point(length: number): string {
    const waist = length * 0.16;

    return `M0 ${-length} L${waist} 0 L0 ${waist * 0.9} L${-waist} 0 Z`;
}
