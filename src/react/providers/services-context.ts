import { createContext, useContext } from 'react';
import type { AtlasServices } from '@/composition-root.ts';

const ServicesContext = createContext<AtlasServices | null>(null);

export const ServicesProviderContext = ServicesContext;

/**
 * The services the interface reads the catalogue through.
 *
 * @throws When called outside the provider, which means the tree was assembled wrong.
 */
export function useServices(): AtlasServices {
    const services = useContext(ServicesContext);
    if (!services) throw new Error('useServices precisa estar dentro de <ServicesProvider>.');

    return services;
}
