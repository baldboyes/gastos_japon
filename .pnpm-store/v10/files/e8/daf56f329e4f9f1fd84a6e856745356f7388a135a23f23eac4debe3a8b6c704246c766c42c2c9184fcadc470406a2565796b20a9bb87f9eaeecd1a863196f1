import type { UseSignInReturn } from '@clerk/shared/types';
import type { ToComputedRefs } from '../utils';
type UseSignIn = () => ToComputedRefs<UseSignInReturn>;
/**
 * Returns the current [`SignIn`](https://clerk.com/docs/reference/javascript/sign-in) object which provides
 * methods and state for managing the sign-in flow.
 *
 * @example
 * <script setup>
 * import { useSignIn } from '@clerk/vue'
 *
 * const { isLoaded, signIn } = useSignIn()
 * </script>
 *
 * <template>
 *   <div v-if="!isLoaded">
 *     <!-- Handle loading state -->
 *   </div>
 *
 *   <div v-else>
 *     The current sign in attempt status is {{ signIn.status }}.
 *   </div>
 * </template>
 */
export declare const useSignIn: UseSignIn;
export {};
