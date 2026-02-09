export function fileUrl(file: string | { id: string } | null | undefined, options: Record<string, any> = {}) {
  if (!file) return undefined
  
  const fileId = typeof file === 'string' ? file : file.id
  
  if (!fileId) return undefined

  const config = useRuntimeConfig()
  const base = config.public.directusUrl
  const params = new URLSearchParams(options).toString()
  
  return `${base}/assets/${fileId}${params ? `?${params}` : ''}`
}
