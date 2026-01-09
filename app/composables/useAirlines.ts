export interface Airline {
  id: string
  name: string
  logo: string
  lcc?: string
}

export const useAirlines = () => {
  const airlines = useState<Airline[]>('airlines-data', () => [])
  const loading = useState<boolean>('airlines-loading', () => false)

  const fetchAirlines = async () => {
    if (airlines.value.length > 0) return

    loading.value = true
    try {
      const response = await fetch('/lineasaereas.json')
      const data = await response.json()
      // Filtramos entradas vacías o inválidas si las hubiera
      airlines.value = data.filter((a: any) => a.name && a.name !== 'null')
    } catch (e) {
      console.error('Error loading airlines:', e)
    } finally {
      loading.value = false
    }
  }

  return {
    airlines,
    loading,
    fetchAirlines
  }
}
