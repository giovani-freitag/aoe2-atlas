import { Civilization } from '@/domain/entities/civilization.ts';
import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { RegionKey } from '@/domain/enums/region.ts';
import { YearSpan } from '@/domain/values/year-span.ts';

export interface CivilizationStubOptions {
    key?: string;
    name?: string;
    expansion?: ExpansionKey;
    region?: RegionKey;
    from?: number;
    to?: number;
    peakAreaKm2?: number;
    peakYear?: number;
    slices?: readonly number[];
    monument?: string;
    place?: string;
}

/**
 * A civilization with everything filled in, so a test only states the part it cares about.
 *
 * @param options - The fields this test wants to pin down.
 */
export function civilizationStub(options: CivilizationStubOptions = {}): Civilization {
    const from = options.from ?? 800;
    const to = options.to ?? 1200;

    return new Civilization({
        key: options.key ?? 'britons',
        name: options.name ?? 'Bretões',
        icon: 'britons',
        expansion: options.expansion ?? 'aok',
        region: options.region ?? 'weur',
        wonder: {
            monument: options.monument ?? 'Catedral de Chichester',
            place: options.place ?? 'Chichester',
            country: 'Inglaterra',
            at: { lon: -0.78, lat: 50.84 },
            wikipedia: 'Chichester_Cathedral',
        },
        realmLabel: 'Reinos ingleses e o Império Angevino',
        span: new YearSpan(from, to),
        reach: {
            slices: options.slices ?? [from],
            peakYear: options.peakYear ?? from,
            peakAreaKm2: options.peakAreaKm2 ?? 259_345,
        },
    });
}
