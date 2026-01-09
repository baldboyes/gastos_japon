import { ref } from 'vue'

const CACHE_KEY = 'exchange_rate_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 horas

export const useExchangeRate = () => {
    const rate = ref<number | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastUpdated = ref<Date | null>(null)

    const fetchRate = async () => {
        loading.value = true
        
        // 1. Check Cache
        // Verificamos window/localStorage para evitar errores en SSR (aunque onMounted corre en cliente)
        if (typeof window !== 'undefined' && window.localStorage) {
            const cached = localStorage.getItem(CACHE_KEY)
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    const now = new Date().getTime()
                    
                    // Si la caché es válida (menor a 24h)
                    if (now - parsed.timestamp < CACHE_DURATION) {
                        rate.value = parsed.rate
                        lastUpdated.value = new Date(parsed.timestamp)
                        loading.value = false
                        return // Salimos sin llamar a la API
                    }
                } catch (e) {
                    localStorage.removeItem(CACHE_KEY)
                }
            }
        }

        // 2. Fetch API si no hay caché válida
        try {
            const res = await fetch('https://api.fxratesapi.com/latest?currencies=JPY&base=EUR&places=2&api_key=fxr_live_941b72e8a80cddad901b6fb143356d60f9cd')
            const data = await res.json()
            if (data.success && data.rates?.JPY) {
                rate.value = data.rates.JPY
                lastUpdated.value = new Date() // Guardamos la fecha de obtención
                
                // Guardar en Caché
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        rate: rate.value,
                        timestamp: lastUpdated.value.getTime()
                    }))
                }
            }
        } catch (e) {
            error.value = 'Error al cargar cambio'
            console.error(e)
            
            // Fallback: Intentar usar caché expirada si falla la red
            if (typeof window !== 'undefined' && window.localStorage) {
                const cached = localStorage.getItem(CACHE_KEY)
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached)
                        rate.value = parsed.rate
                        lastUpdated.value = new Date(parsed.timestamp)
                    } catch(e) {}
                }
            }
        } finally {
            loading.value = false
        }
    }

    return { rate, loading, error, lastUpdated, fetchRate }
}
