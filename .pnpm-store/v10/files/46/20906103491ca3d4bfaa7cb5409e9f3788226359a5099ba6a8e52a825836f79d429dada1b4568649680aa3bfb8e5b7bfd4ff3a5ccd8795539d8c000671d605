import { type ComputedRef } from 'vue';
export type ToComputedRefs<T = any> = {
    [K in keyof T]: ComputedRef<T[K]>;
};
/**
 * Converts a computed ref to an object of computed refs.
 * This will allow the composables to be destructurable and still maintain reactivity.
 */
export declare function toComputedRefs<T extends object>(objectRef: ComputedRef<T>): ToComputedRefs<T>;
