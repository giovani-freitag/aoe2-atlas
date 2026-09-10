import { useTranslation } from 'react-i18next';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { CivilizationText } from '@/domain/values/civilization-text.ts';
import { useServices } from '@/react/providers/services-context.ts';

/**
 * What the atlas says about one civilization, in the reader's language.
 *
 * Subscribing to the translation is what makes the words change when the language does; the
 * text service alone would keep answering, but nothing would ask it again.
 *
 * @param civilization - The civilization to name.
 */
export function useCivilizationText(civilization: Civilization): CivilizationText {
    const { text } = useServices();
    useTranslation();

    return text.civilization(civilization.key, civilization.wonder.anachronistic);
}
