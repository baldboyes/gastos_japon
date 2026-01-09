import { type LoadClerkJsScriptOptions } from '@clerk/shared/loadClerkJsScript';
import type { InitialState, MultiDomainAndOrProxy, Without } from '@clerk/shared/types';
import type { Plugin } from 'vue';
export type PluginOptions = Without<LoadClerkJsScriptOptions, 'domain' | 'proxyUrl'> & MultiDomainAndOrProxy & {
    initialState?: InitialState;
};
/**
 * Vue plugin for integrating Clerk.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import { clerkPlugin } from '@clerk/vue'
 * import App from './App.vue'
 *
 * const app = createApp(App)
 *
 * app.use(clerkPlugin, {
 *   publishableKey: 'pk_'
 * })
 *
 * app.mount('#app')
 * ```
 */
export declare const clerkPlugin: Plugin<[PluginOptions]>;
