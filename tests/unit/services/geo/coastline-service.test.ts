import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoastlineService } from '@/services/geo/coastline-service.ts';

const LAND = {
    type: 'MultiPolygon',
    coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]],
};

describe('CoastlineService', () => {
    let service: CoastlineService;
    let calls: string[];

    beforeEach(() => {
        calls = [];
        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) => {
                calls.push(url);

                return Promise.resolve({ ok: true, json: () => Promise.resolve(LAND) } as Response);
            }),
        );
        service = new CoastlineService({ url: '/data/land.json' });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('holds nothing before it has fetched', () => {
        const held = service.peek();

        expect(held).toBeNull();
    });

    it('turns the shipped shape into rings', async () => {
        const rings = await service.load();

        expect(rings).toEqual(LAND.coordinates);
    });

    it('keeps the coastline once it has been fetched', async () => {
        await service.load();

        const held = service.peek();

        expect(held).toEqual(LAND.coordinates);
    });

    it('fetches only once however often it is asked', async () => {
        await service.load();
        await service.load();

        expect(calls).toEqual(['/data/land.json']);
    });

    it('shares one request between callers asking at the same moment', async () => {
        await Promise.all([service.load(), service.load()]);

        expect(calls).toEqual(['/data/land.json']);
    });

    it('refuses a coastline the server does not have', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 404 } as Response)));

        await expect(service.load()).rejects.toThrow(/404/);
    });
});
