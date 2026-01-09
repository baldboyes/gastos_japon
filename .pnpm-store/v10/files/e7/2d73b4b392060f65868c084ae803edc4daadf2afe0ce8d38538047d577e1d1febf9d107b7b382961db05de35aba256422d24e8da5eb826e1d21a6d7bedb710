import type { UseSessionReturn } from '@clerk/shared/types';
import type { ToComputedRefs } from '../utils';
type UseSession = () => ToComputedRefs<UseSessionReturn>;
/**
 * Returns the current [`Session`](https://clerk.com/docs/reference/javascript/session) object which provides
 * information about the active session and methods to manage it.
 *
 * @example
 * <script setup>
 * import { useSession } from '@clerk/vue'
 *
 * const { isLoaded, session, isSignedIn } = useSession()
 * </script>
 *
 * <template>
 *   <div v-if="!isLoaded">
 *     <!-- Handle loading state -->
 *   </div>
 *
 *   <div v-else-if="!isSignedIn">
 *     <!-- Handle not signed in state -->
 *   </div>
 *
 *   <div v-else>
 *     <p>This session has been active since {{ session.lastActiveAt.toLocaleString() }}</p>
 *   </div>
 * </template>
 */
export declare const useSession: UseSession;
export {};
