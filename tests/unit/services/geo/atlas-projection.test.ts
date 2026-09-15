import { describe, expect, it } from 'vitest';
import { AtlasProjection } from '@/services/geo/atlas-projection.ts';

/** A square of ocean off West Africa, well inside the drawn window and away from every edge. */
const SQUARE = [[[[-10, -5] as [number, number], [10, -5], [10, 5], [-10, 5], [-10, -5]]]];

function projection(width = 800, height = 600): AtlasProjection {
    return new AtlasProjection({ width, height, kind: 'equal-earth' });
}

/** Where the middle of a shape lands on screen once a frame is applied to it. */
function middleOf(map: AtlasProjection, frame: { k: number; x: number; y: number }): [number, number] {
    const point = map.pointOf({ lon: 0, lat: 0 });
    if (!point) throw new Error('The origin should project.');

    return [frame.k * point[0] + frame.x, frame.k * point[1] + frame.y];
}

describe('AtlasProjection', () => {
    describe('frameFor', () => {
        it('centres the realm in the viewport when nothing covers it', () => {
            const map = projection();

            const [x, y] = middleOf(map, map.frameFor(SQUARE));

            expect([Math.round(x), Math.round(y)]).toEqual([400, 300]);
        });

        /*
         * On a desktop the civilization's panel lies over the right of the map. A realm centred
         * in the whole viewport is a realm centred under the panel.
         */
        it('centres it in what is left when a panel covers one side', () => {
            const map = projection();

            const [x] = middleOf(map, map.frameFor(SQUARE, { right: 300 }));

            expect(Math.round(x)).toBe(250);
        });

        /* On a phone the deck lies over the foot of it, and the same has to be true downwards. */
        it('centres it above a panel covering the foot', () => {
            const map = projection();

            const [, y] = middleOf(map, map.frameFor(SQUARE, { bottom: 200 }));

            expect(Math.round(y)).toBe(200);
        });

        it('never lets a panel take so much that there is nothing to aim at', () => {
            const map = projection();

            const frame = map.frameFor(SQUARE, { bottom: 10_000 });

            expect(Number.isFinite(frame.k) && frame.k > 0).toBe(true);
        });
    });

    describe('placeOf', () => {
        it('reads back the place a point was projected from', () => {
            const map = projection();
            const point = map.pointOf({ lon: 12.5, lat: 41.9 });
            if (!point) throw new Error('Rome should project.');

            const place = map.placeOf(point);

            expect(place?.lon).toBeCloseTo(12.5, 4);
            expect(place?.lat).toBeCloseTo(41.9, 4);
        });
    });
});

describe('the opening view on a screen taller than the world it draws', () => {
    it('fills the height rather than leaving most of it dark', () => {
        const phone = new AtlasProjection({ width: 320, height: 720, kind: 'equal-earth' });

        const frame = phone.wholeWorld();

        /*
         * Fitted whole, the drawn world lands about a fifth of the way down a phone held upright
         * and the rest is dark. It is allowed to crop east and west to be worth looking at.
         */
        expect(frame.k).toBeGreaterThan(2);
    });

    it('leaves a screen wider than the world exactly where it fitted', () => {
        const desktop = new AtlasProjection({ width: 1440, height: 900, kind: 'equal-earth' });
        const narrow = new AtlasProjection({ width: 1440, height: 400, kind: 'equal-earth' });

        /* Both are wider than they are tall, so neither has height going to waste to reclaim. */
        expect(desktop.wholeWorld().k).toBeLessThan(2 * narrow.wholeWorld().k);
    });
});
