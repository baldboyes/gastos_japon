import type { PendingSessionOptions, UseAuthReturn } from '@clerk/shared/types';
import type { ToComputedRefs } from '../utils';
type UseAuth = (options?: PendingSessionOptions) => ToComputedRefs<UseAuthReturn>;
/**
 * Returns the current auth state, the user and session ids and the `getToken`
 * that can be used to retrieve the given template or the default Clerk token.
 *
 * Until Clerk loads, `isLoaded` will be set to `false`.
 * Once Clerk loads, `isLoaded` will be set to `true`, and you can
 * safely access the `userId` and `sessionId` variables.
 *
 * @example
 * <script setup>
 * import { useAuth } from '@clerk/vue'
 *
 * const { isSignedIn, sessionId, userId } = useAuth()
 * </script>
 *
 * <template>
 *   <div v-if="isSignedIn">
 *     <!-- {{ sessionId }} {{ userId }} -->
 *     ...
 *   </div>
 * </template>
 */
export declare const useAuth: UseAuth;
export {};
