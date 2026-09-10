import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SliceService } from '@/services/atlas/slice-service.ts';

const YEARS = [200, 250, 800, 1200, 1300];

function sliceJson(year: number): unknown {
    return {
        year,
        realms: [
            {
                civ: 'mongols',
                from: year - 100,
                exact: false,
                origin: 'dataset',
                sourceNames: ['Mongol Empire'],
                precision: 2,
                areaKm2: 22_885_825,
                bbox: [20, 30, 130, 55],
                centroid: [80, 45],
                rings: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]],
            },
        ],
        frontiers: [{ a: 'mongols', b: 'tatars', areaKm2: 5_000_000, shareOfA: 0.22, shareOfB: 0.99 }],
    };
}

describe('SliceService', () => {
    let service: SliceService;
    let calls: string[];

    beforeEach(() => {
        calls = [];
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) => {
                calls.push(url);
                const year = Number(/slice-(\d+)\.json/.exec(url)?.[1] ?? 0);

                return Promise.resolve({ ok: true, json: () => Promise.resolve(sliceJson(year)) } as Response);
            }),
        );
        service = new SliceService({ baseUrl: '/data/', years: YEARS });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('picks the century it has a map for closest to the year asked about', () => {
        const year = service.sliceYearFor(1000);

        expect(year).toBe(800);
    });

    it('picks the exact century when it has one', () => {
        const year = service.sliceYearFor(1200);

        expect(year).toBe(1200);
    });

    it('reaches back before the first century it holds', () => {
        const year = service.sliceYearFor(-500);

        expect(year).toBe(200);
    });

    it('knows nothing about a century it has not fetched', () => {
        const held = service.peek(800);

        expect(held).toBeNull();
    });

    it('turns the shipped shape into borders', async () => {
        const slice = await service.load(800);

        expect(slice.borders[0].civ).toBe('mongols');
    });

    it('marks a border carried from another century as not being of this one', async () => {
        const slice = await service.load(800);

        expect(slice.borders[0].isOfItsCentury).toBe(false);
    });

    it('reads the source precision into words', async () => {
        const slice = await service.load(800);

        expect(slice.borders[0].precision).toBe('moderate');
    });

    it('measures how far a carried border reached', async () => {
        const slice = await service.load(800);

        expect(slice.borders[0].carriedYears).toBe(100);
    });

    it('keeps a century once it has been fetched', async () => {
        await service.load(800);

        const held = service.peek(800);

        expect(held?.year).toBe(800);
    });

    it('fetches a century only once however often it is asked for', async () => {
        await service.load(800);
        await service.load(800);

        expect(calls).toEqual(['/data/slice-800.json']);
    });

    it('shares one request between callers asking at the same moment', async () => {
        await Promise.all([service.load(800), service.load(800)]);

        expect(calls).toEqual(['/data/slice-800.json']);
    });

    it('warms the centuries on either side', async () => {
        service.warmNeighbours(800);
        await Promise.resolve();

        expect(calls.sort()).toEqual(['/data/slice-1200.json', '/data/slice-250.json']);
    });

    it('refuses a century the server does not have', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 404 } as Response)));

        await expect(service.load(800)).rejects.toThrow(/404/);
    });

    it('reports a frontier from either side', async () => {
        const slice = await service.load(800);

        expect(slice.frontiers[0].shareOf('tatars')).toBe(0.99);
    });

    it('sees a realm swallowed by its neighbour as nested', async () => {
        const slice = await service.load(800);

        expect(slice.frontiers[0].isNested).toBe(true);
    });
});
