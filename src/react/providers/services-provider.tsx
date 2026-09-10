import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { createServices } from '@/composition-root.ts';
import { ServicesProviderContext } from './services-context.ts';

export interface ServicesProviderProps {
    children: ReactNode;
}

/** Builds the services once and hands them to the tree. */
export function ServicesProvider({ children }: ServicesProviderProps) {
    const { i18n } = useTranslation();
    const services = useMemo(() => createServices(i18n), [i18n]);

    return <ServicesProviderContext value={services}>{children}</ServicesProviderContext>;
}
