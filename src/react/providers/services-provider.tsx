import { useMemo, type ReactNode } from 'react';
import { createServices } from '@/composition-root.ts';
import { ServicesProviderContext } from './services-context.ts';

export interface ServicesProviderProps {
    children: ReactNode;
}

/** Builds the services once and hands them to the tree. */
export function ServicesProvider({ children }: ServicesProviderProps) {
    const services = useMemo(() => createServices(), []);

    return <ServicesProviderContext value={services}>{children}</ServicesProviderContext>;
}
