export function fileUrl(file, options = {}){

  console.log("file" + file);

  if (!file || !file.id) return null

  const base = useRuntimeConfig().public.directusUrl
  const params = new URLSearchParams(options).toString()
  console.log("sss" + params);
  return `${base}/assets/${file}${params ? `?${params}` : ''}`
}