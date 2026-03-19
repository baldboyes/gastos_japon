const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'blockquote',
  'pre',
  'code',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ol',
  'ul',
  'li',
  'a',
])

const isSafeHref = (href: string) => {
  const trimmed = href.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('#')) return true
  if (trimmed.startsWith('/')) return true
  if (trimmed.startsWith('mailto:')) return true
  if (trimmed.startsWith('tel:')) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const sanitizeHtml = (html: string) => {
  if (!import.meta.client) return ''
  if (!html) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const outputDoc = document.implementation.createHTMLDocument('')

  const sanitizeNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return outputDoc.createTextNode(node.textContent || '')
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) {
      const fragment = outputDoc.createDocumentFragment()
      el.childNodes.forEach((child) => {
        const safeChild = sanitizeNode(child)
        if (safeChild) fragment.appendChild(safeChild)
      })
      return fragment
    }

    const safeEl = outputDoc.createElement(tag)

    if (tag === 'a') {
      const href = el.getAttribute('href') || ''
      if (isSafeHref(href)) safeEl.setAttribute('href', href)
      const target = (el.getAttribute('target') || '').toLowerCase()
      if (target === '_blank') {
        safeEl.setAttribute('target', '_blank')
        safeEl.setAttribute('rel', 'noopener noreferrer')
      }
    }

    el.childNodes.forEach((child) => {
      const safeChild = sanitizeNode(child)
      if (safeChild) safeEl.appendChild(safeChild)
    })

    return safeEl
  }

  const container = outputDoc.createElement('div')
  doc.body.childNodes.forEach((child) => {
    const safeChild = sanitizeNode(child)
    if (safeChild) container.appendChild(safeChild)
  })

  return container.innerHTML
}

