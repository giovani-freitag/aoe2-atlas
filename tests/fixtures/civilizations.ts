import { Civilization } from '@/domain/entities/civilization.ts';
import type { ExpansionKey } from '@/domain/enums/expansion.ts';
import type { RegionKey } from '@/domain/enums/region.ts';
import type { CivilizationText } from '@/domain/values/civilization-text.ts';
import { YearSpan } from '@/domain/values/year-span.ts';
import { TextService } from '@/services/text/text-service.ts';

export interface CivilizationStubOptions {
    key?: string;
    expansion?: ExpansionKey;
    region?: RegionKey;
    from?: number;
    to?: number;
    peakAreaKm2?: number;
    peakYear?: number;
    slices?: readonly number[];
    anachronistic?: boolean;
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
        icon: 'britons',
        expansion: options.expansion ?? 'aok',
        region: options.region ?? 'weur',
        wonder: {
            at: { lon: -0.78, lat: 50.84 },
            wikipedia: 'Chichester_Cathedral',
            anachronistic: options.anachronistic ?? false,
        },
        span: new YearSpan(from, to),
        reach: {
            slices: options.slices ?? [from],
            peakYear: options.peakYear ?? from,
            peakAreaKm2: options.peakAreaKm2 ?? 259_345,
        },
    });
}

export type CivilizationWords = Partial<Omit<CivilizationText, 'anachronism'>>;

/**
 * A text service that answers from a table instead of a translator.
 *
 * @param words - What each civilization is called, keyed by civilization key; missing fields
 * fall back to the key itself, and a region is named by its key.
 * @param locale - The language the service claims to be speaking.
 */
export function textStub(words: Record<string, CivilizationWords>, locale = 'en'): TextService {
    return new TextService({
        language: () => locale,
        translate: (path) => {
            const [, kind, key, field] = path.split(/[:.]/);
            if (kind === 'regions') return key;

            const entry = words[key] ?? {};

            return entry[field as keyof CivilizationWords] ?? key;
        },
    });
}
