import type { ComputedRef, Ref } from 'vue'
import { createContext } from 'reka-ui'

export const SIDEBAR_COOKIE_NAME = 'sidebar:state'
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const SIDEBAR_WIDTH = '16rem'
export const SIDEBAR_WIDTH_MOBILE = '10rem'
export const SIDEBAR_WIDTH_ICON = '3rem'
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

export const [useSidebar, provideSidebarContext] = createContext<{
  state: ComputedRef<'expanded' | 'collapsed'>
  open: Ref<boolean>
  setOpen: (value: boolean) => void
  isMobile: Ref<boolean>
  openMobile: Ref<boolean>
  setOpenMobile: (value: boolean) => void
  toggleSidebar: () => void
}>('Sidebar')

export const SUPPORTED_LOCALES = ['es', 'en', 'ja'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export function getLocalePrefixFromPath(path: string): `/${SupportedLocale}` | '' {
  const firstSegment = (path || '').split('/')[1] || ''
  return (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment) ? (`/${firstSegment}` as `/${SupportedLocale}`) : ''
}
