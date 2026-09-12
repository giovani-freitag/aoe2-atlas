import { describe, expect, it } from 'vitest';
import { Frontier } from '@/domain/values/frontier.ts';
import { contemporaries } from '@/react/components/contemporaries.ts';
import { civilizationStub } from '../../../fixtures/civilizations.ts';

const BYZANTINES = civilizationStub({ key: 'byzantines' });

/** A shared border seen from the Byzantine side. */
function frontier(other: string, shareOfByzantines: number): Frontier {
    return new Frontier({
        a: 'byzantines',
        b: other,
        areaKm2: 1000,
        shareOfA: shareOfByzantines,
        shareOfB: 0.1,
        carried: false,
    });
}

describe('contemporaries', () => {
    it('puts the widest share first', () => {
        const sorted = contemporaries(BYZANTINES, [frontier('turks', 0.1), frontier('sicilians', 0.4)]);

        expect(sorted.map((one) => one.otherThan('byzantines'))).toEqual(['sicilians', 'turks']);
    });

    it('drops a frontier the civilization is not part of', () => {
        const listed = contemporaries(BYZANTINES, [
            frontier('turks', 0.2),
            new Frontier({ a: 'franks', b: 'britons', areaKm2: 10, shareOfA: 0.5, shareOfB: 0.5, carried: false }),
        ]);

        expect(listed.map((one) => one.otherThan('byzantines'))).toEqual(['turks']);
    });

    /* Past six the row stops being something a reader takes in at a glance. */
    it('stops at six however many there were', () => {
        const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((key, index) => frontier(key, index / 10));

        const listed = contemporaries(BYZANTINES, many);

        expect(listed).toHaveLength(6);
    });

    it('finds nobody when the century was empty around it', () => {
        const listed = contemporaries(BYZANTINES, []);

        expect(listed).toEqual([]);
    });
});
