import type { OrganizationMembershipResource, OrganizationResource } from '@clerk/shared/types';
import type { ToComputedRefs } from '../utils';
type UseOrganizationReturn = {
    isLoaded: false;
    organization: undefined;
    membership: undefined;
} | {
    isLoaded: true;
    organization: OrganizationResource;
    membership: undefined;
} | {
    isLoaded: boolean;
    organization: OrganizationResource | null;
    membership: OrganizationMembershipResource | null | undefined;
};
type UseOrganization = () => ToComputedRefs<UseOrganizationReturn>;
/**
 * Returns the current [`Organization`](https://clerk.com/docs/reference/javascript/organization/organization) object
 * along with loading states and membership information.
 *
 * @example
 * <script setup>
 * import { useOrganization } from '@clerk/vue'
 *
 * const { isLoaded, organization, membership } = useOrganization()
 * </script>
 *
 * <template>
 *   <div v-if="!isLoaded">
 *     <!-- Handle loading state -->
 *   </div>
 *
 *   <div v-else-if="organization">
 *     <h1>{{ organization.name }}</h1>
 *     <p>Your role: {{ membership.role }}</p>
 *   </div>
 *
 *   <div v-else>
 *     No active organization
 *   </div>
 * </template>
 */
export declare const useOrganization: UseOrganization;
export {};
