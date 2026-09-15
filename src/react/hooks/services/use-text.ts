import { useTranslation } from 'react-i18next';
import type { TextService } from '@/services/text/text-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

/**
 * What the atlas says about things, in the reader's language.
 *
 * Subscribing to the translation is what makes the words change when the language does: the
 * service alone would keep answering correctly, but nothing would ask it again. Holding that
 * subscription here is the point of the hook — every caller used to have to remember it.
 */
export function useText(): TextService {
    const { text } = useServices();
    useTranslation();

    return text;
}
