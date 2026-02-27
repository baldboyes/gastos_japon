import { defineEventHandler, getCookie, getRequestURL, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const { pathname } = getRequestURL(event)
  if (pathname === '/') {
    const userLocale = getCookie(event, 'user-locale')
    if (userLocale && ['es', 'en', 'ja'].includes(userLocale)) {
      return sendRedirect(event, `/${userLocale}/`, 302)
    }
  }
})
