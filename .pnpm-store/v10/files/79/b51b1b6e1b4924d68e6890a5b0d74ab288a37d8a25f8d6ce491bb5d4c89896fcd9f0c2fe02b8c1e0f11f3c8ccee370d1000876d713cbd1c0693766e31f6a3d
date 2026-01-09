import type { UseSessionListReturn } from '@clerk/shared/types';
import type { ToComputedRefs } from '../utils';
type UseSessionList = () => ToComputedRefs<UseSessionListReturn>;
/**
 * Returns an array of [`Session`](https://clerk.com/docs/reference/javascript/session) objects that have been
 * registered on the client device.
 *
 * @example
 * <script setup>
 * import { useSessionList } from '@clerk/vue'
 *
 * const { isLoaded, sessions } = useSessionList()
 * </script>
 *
 * <template>
 *   <div v-if="!isLoaded">
 *     <!-- Handle loading state -->
 *   </div>
 *
 *   <div v-else>
 *     <p>
 *       Welcome back. You have been here
 *       {{ sessions.length }} times before.
 *     </p>
 *   </div>
 * </template>
 */
export declare const useSessionList: UseSessionList;
export {};
