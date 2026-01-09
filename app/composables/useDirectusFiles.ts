import { uploadFiles, createItem } from '@directus/sdk'

export const useDirectusFiles = () => {
  const { getAuthenticatedClient } = useDirectus()

  const uploadFile = async (file: File) => {
    const client = await getAuthenticatedClient()
    const formData = new FormData()
    formData.append('title', file.name)
    formData.append('file', file)
    
    try {
        const result = await client.request(uploadFiles(formData))
        
        if (!result || !result.id) {
            throw new Error('Archivo subido pero no visible. Verifica que tu Rol tenga permisos de LECTURA (Read) en "directus_files".')
        }
        
        return result.id 
    } catch (e: any) {
        console.error('[Directus Files] Error subiendo archivo:', e)
        throw e
    }
  }

  const attachFileToItem = async (collection: string, itemId: number, fileId: string) => {
    const client = await getAuthenticatedClient()
    const junctionTable = `${collection}_files`
    const payload = {
      [`${collection}_id`]: itemId,
      directus_files_id: fileId
    }
    
    try {
        await client.request(createItem(junctionTable, payload))
    } catch (e: any) {
         console.error('[Directus Files] Error asociando archivo:', e)
         throw e
    }
  }

  return { uploadFile, attachFileToItem }
}
