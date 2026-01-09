import type { UseUserReturn } from '@clerk/shared/types';
import type { ToComputedRefs } from '../utils';
type UseUser = () => ToComputedRefs<UseUserReturn>;
/**
 * Returns the current user's [`User`](https://clerk.com/docs/reference/javascript/user/user) object along with loading states.
 *
 * @example
 * <script setup>
 * import { useUser } from '@clerk/vue'
 *
 * const { isLoaded, isSignedIn, user } = useUser()
 * </script>
 *
 * <template>
 *   <div v-if="!isLoaded">
 *     <!-- Handle loading state -->
 *   </div>
 *
 *   <div v-else-if="isSignedIn">
 *     Hello {{ user.fullName }}!
 *   </div>
 *
 *   <div v-else>
 *     Not signed in
 *   </div>
 * </template>
 */
export declare const useUser: UseUser;
export {};
