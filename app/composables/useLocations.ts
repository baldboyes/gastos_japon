import { useState } from '#app'

export interface Prefecture {
  id: string
  prefecture_id: string
  name_en: string
  name_ja: string
}

export interface City {
  id: string
  prefecture_id: string
  name_en: string
  name_ja: string
  special_district_ja?: string
}

export const useLocations = () => {
  const prefectures = useState<Prefecture[]>('locations-prefectures', () => [])
  const cities = useState<City[]>('locations-cities', () => [])
  const loading = useState<boolean>('locations-loading', () => false)
  const error = useState<string | null>('locations-error', () => null)

  // Robust CSV Line Parser
  const parseLine = (line: string): string[] => {
    const row: string[] = []
    let current = ''
    let inQuote = false
    
    for (let char of line) {
        if (char === '"') {
            inQuote = !inQuote
        } else if (char === ',' && !inQuote) {
            row.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    row.push(current.trim())
    return row
  }

  const fetchLocations = async () => {
    if (prefectures.value.length > 0 && cities.value.length > 0) return

    loading.value = true
    error.value = null
    
    try {
      const [prefResponse, cityResponse] = await Promise.all([
        fetch('/prefectures.csv'),
        fetch('/cities.csv')
      ])

      if (!prefResponse.ok || !cityResponse.ok) throw new Error('Failed to load location data')

      const prefText = await prefResponse.text()
      const cityText = await cityResponse.text()

      // Parse Prefectures
      const prefLines = prefText.split('\n')
      const parsedPrefs: Prefecture[] = []
      
      for (let i = 1; i < prefLines.length; i++) {
        const line = prefLines[i].trim()
        if (!line) continue
        
        const row = parseLine(line)
        if (row.length >= 4) {
           parsedPrefs.push({
             id: row[0],
             prefecture_id: row[1],
             name_en: row[2],
             name_ja: row[3]
           })
        }
      }
      prefectures.value = parsedPrefs

      // Parse Cities
      const cityLines = cityText.split('\n')
      const parsedCities: City[] = []
      
      for (let i = 1; i < cityLines.length; i++) {
        const line = cityLines[i].trim()
        if (!line) continue
        
        const row = parseLine(line)
        if (row.length >= 4) {
             parsedCities.push({
                id: row[0],
                prefecture_id: row[1],
                name_en: row[2],
                name_ja: row[3],
                special_district_ja: row[4] || ''
             })
        }
      }
      cities.value = parsedCities

    } catch (e: any) {
      console.error('Error loading locations:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const getCitiesByPrefecture = (prefectureId: string) => {
    return cities.value.filter(c => c.prefecture_id === prefectureId)
  }

  return {
    prefectures,
    cities,
    loading,
    error,
    fetchLocations,
    getCitiesByPrefecture
  }
}
