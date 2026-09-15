import { createContext, useContext } from 'react';
import type { AtlasServices } from '@/composition-root.ts';

const ServicesContext = createContext<AtlasServices | null>(null);

export const ServicesProviderContext = ServicesContext;

/**
 * The services, for the hooks that wrap them.
 *
 * Nothing in `components/` calls this. Each service is reached through a hook of its own, which
 * is what keeps a component from having to know that naming a civilization needs a subscription
 * to the language while painting one does not — and what stops the answer to "what is on the
 * map" from being worked out again, slightly differently, in a second file.
 *
 * @throws When called outside the provider, which means the tree was assembled wrong.
 */
export function useServices(): AtlasServices {
    const services = useContext(ServicesContext);
    if (!services) throw new Error('useServices precisa estar dentro de <ServicesProvider>.');

    return services;
}
