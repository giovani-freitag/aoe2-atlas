import type { Civilization } from '@/domain/entities/civilization.ts';
import type { CivilizationText } from '@/domain/values/civilization-text.ts';
import { useText } from '@/react/hooks/services/use-text.ts';

/**
 * What the atlas says about one civilization, in the reader's language.
 *
 * @param civilization - The civilization to name.
 */
export function useCivilizationText(civilization: Civilization): CivilizationText {
    const text = useText();

    return text.civilization(civilization.key, civilization.wonder.anachronistic);
}
