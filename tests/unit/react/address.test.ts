import { describe, expect, it } from 'vitest';
import { readAddress, writeAddress, type AddressOptions } from '@/react/address.ts';

const OPTIONS: AddressOptions = {
    years: [200, 800, 1200, 1279, 1600],
    keys: new Set(['byzantines', 'bulgarians', 'mongols']),
    openingYear: 1200,
};

describe('readAddress', () => {
    it('reads nothing from an empty address', () => {
        const shared = readAddress('', OPTIONS);

        expect(shared).toEqual({});
    });

    it('reads the year, with or without the leading question mark', () => {
        const shared = readAddress('year=800', OPTIONS);

        expect(shared.year).toBe(800);
    });

    it('snaps a year the atlas has no map for to the nearest one it has', () => {
        const shared = readAddress('?year=1250', OPTIONS);

        expect(shared.year).toBe(1279);
    });

    it('ignores a year that is not a number', () => {
        const shared = readAddress('?year=soon', OPTIONS);

        expect(shared.year).toBeUndefined();
    });

    it('opens the civilization named', () => {
        const shared = readAddress('?civ=byzantines', OPTIONS);

        expect(shared.focused).toBe('byzantines');
    });

    it('drops a civilization it has never heard of', () => {
        const shared = readAddress('?civ=atlanteans', OPTIONS);

        expect(shared.focused).toBeUndefined();
    });

    it('pins the civilizations listed, keeping only the ones it knows', () => {
        const shared = readAddress('?pin=bulgarians,atlanteans,mongols', OPTIONS);

        expect(shared.pinned).toEqual(['bulgarians', 'mongols']);
    });

    it('counts the same pin twice as one pin', () => {
        const shared = readAddress('?pin=mongols,mongols', OPTIONS);

        expect(shared.pinned).toEqual(['mongols']);
    });

    it('sets nothing for pins when none of them is known', () => {
        const shared = readAddress('?pin=atlanteans', OPTIONS);

        expect(shared.pinned).toBeUndefined();
    });
});

describe('writeAddress', () => {
    it('writes an empty address for the atlas at rest', () => {
        const query = writeAddress({ year: 1200, focused: null, pinned: [] }, OPTIONS);

        expect(query).toBe('');
    });

    it('leaves the opening year out and says only what changed', () => {
        const query = writeAddress({ year: 1200, focused: 'byzantines', pinned: [] }, OPTIONS);

        expect(query).toBe('?civ=byzantines');
    });

    it('writes the pins with bare commas between them', () => {
        const query = writeAddress({ year: 800, focused: null, pinned: ['bulgarians', 'mongols'] }, OPTIONS);

        expect(query).toBe('?year=800&pin=bulgarians,mongols');
    });

    it('survives a round trip', () => {
        const written = writeAddress({ year: 1279, focused: 'byzantines', pinned: ['bulgarians'] }, OPTIONS);

        const read = readAddress(written, OPTIONS);

        expect(read).toEqual({ year: 1279, focused: 'byzantines', pinned: ['bulgarians'] });
    });
});
