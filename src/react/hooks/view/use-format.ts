import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createFormatters, type Formatters } from '@/i18n/formatters.ts';

/** Number and date formatting for the language on, rebuilt when the reader switches. */
export function useFormat(): Formatters {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;

    return useMemo(
        () => createFormatters({ locale, beforeCommonEra: (year) => t('year.bce', { year }) }),
        [t, locale],
    );
}
