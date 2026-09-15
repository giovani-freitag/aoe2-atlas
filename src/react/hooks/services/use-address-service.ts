import type { AddressService } from '@/services/address/address-service.ts';
import { useServices } from '@/react/providers/services-context.ts';

/** What the address bar says about the map, in both directions. */
export function useAddressService(): AddressService {
    return useServices().address;
}
