import { describe, expect, it } from 'vitest';
import { AddressService, type AddressServiceConfig } from '@/services/address/address-service.ts';

const CONFIG: AddressServiceConfig = {
    years: [200, 800, 1200, 1279, 1600],
    keys: new Set(['byzantines', 'bulgarians', 'mongols']),
    openingYear: 1200,
};

const address = new AddressService(CONFIG);

describe('AddressService.read', () => {
    it('reads nothing from an empty address', () => {
        const shared = address.read('');

        expect(shared).toEqual({});
    });

    it('reads the year, with or without the leading question mark', () => {
        const shared = address.read('year=800');

        expect(shared.year).toBe(800);
    });

    it('snaps a year the atlas has no map for to the nearest one it has', () => {
        const shared = address.read('?year=1250');

        expect(shared.year).toBe(1279);
    });

    it('ignores a year that is not a number', () => {
        const shared = address.read('?year=soon');

        expect(shared.year).toBeUndefined();
    });

    it('opens the civilization named', () => {
        const shared = address.read('?civ=byzantines');

        expect(shared.focused).toBe('byzantines');
    });

    it('drops a civilization it has never heard of', () => {
        const shared = address.read('?civ=atlanteans');

        expect(shared.focused).toBeUndefined();
    });

    it('pins the civilizations listed, keeping only the ones it knows', () => {
        const shared = address.read('?pin=bulgarians,atlanteans,mongols');

        expect(shared.pinned).toEqual(['bulgarians', 'mongols']);
    });

    it('counts the same pin twice as one pin', () => {
        const shared = address.read('?pin=mongols,mongols');

        expect(shared.pinned).toEqual(['mongols']);
    });

    it('sets nothing for pins when none of them is known', () => {
        const shared = address.read('?pin=atlanteans');

        expect(shared.pinned).toBeUndefined();
    });
});

describe('AddressService.write', () => {
    it('writes an empty address for the atlas at rest', () => {
        const query = address.write({ year: 1200, focused: null, pinned: [] });

        expect(query).toBe('');
    });

    it('leaves the opening year out and says only what changed', () => {
        const query = address.write({ year: 1200, focused: 'byzantines', pinned: [] });

        expect(query).toBe('?civ=byzantines');
    });

    it('writes the pins with bare commas between them', () => {
        const query = address.write({ year: 800, focused: null, pinned: ['bulgarians', 'mongols'] });

        expect(query).toBe('?year=800&pin=bulgarians,mongols');
    });

    it('survives a round trip', () => {
        const written = address.write({ year: 1279, focused: 'byzantines', pinned: ['bulgarians'] });

        const read = address.read(written);

        expect(read).toEqual({ year: 1279, focused: 'byzantines', pinned: ['bulgarians'] });
    });
});
