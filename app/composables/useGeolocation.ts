/**
 * Composable for geolocation and reverse geocoding
 */

import type { Location } from '~/types'

interface GeocodeResult {
  city: string
  prefecture: string
}

/**
 * Composable for handling geolocation
 */
export function useGeolocation() {
  const location = ref<Location | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get current geolocation from browser
   */
  async function getCurrentLocation(): Promise<Location | null> {
    if (!import.meta.client) return null

    loading.value = true
    error.value = null

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser')
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords

      // Attempt reverse geocoding
      const geocoded = await reverseGeocode(latitude, longitude)

      const newLocation: Location = {
        coordinates: {
          lat: latitude,
          lng: longitude
        },
        city: geocoded.city,
        prefecture: geocoded.prefecture
      }

      location.value = newLocation
      return newLocation

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location'
      error.value = errorMessage
      console.error('Geolocation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Reverse geocode coordinates to city and prefecture
   * Uses Mapbox Geocoding API (consistent with map editor)
   */
  async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    try {
      const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFsZGJveSIsImEiOiJhMzBzeklzIn0.buJ1PP9-a9JkqNWGHW-H0g'

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=en`
      )

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()

      let city = ''
      let prefecture = ''

      if (data.features && data.features.length > 0) {
        // Try to find city/locality
        const locality = data.features.find((f: any) =>
          f.place_type.includes('place') || f.place_type.includes('locality')
        )
        if (locality) {
          city = locality.text
        }

        // Try to find prefecture/region
        const region = data.features.find((f: any) =>
          f.place_type.includes('region')
        )
        if (region) {
          prefecture = region.text
        }

        // Fallback: use the first feature's text if we didn't find anything
        if (!city && data.features[0]) {
          city = data.features[0].text || data.features[0].place_name.split(',')[0]
        }
      }

      return {
        city: city || 'Unknown City',
        prefecture: prefecture || 'Unknown Prefecture'
      }

    } catch (err) {
      console.error('Reverse geocoding error:', err)
      // Return coordinates as fallback
      return {
        city: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        prefecture: 'Unknown'
      }
    }
  }

  /**
   * Create location manually (when geolocation fails or user prefers manual entry)
   */
  function createManualLocation(
    lat: number,
    lng: number,
    city: string,
    prefecture: string
  ): Location {
    const manualLocation: Location = {
      coordinates: {
        lat,
        lng
      },
      city,
      prefecture
    }
    location.value = manualLocation
    return manualLocation
  }

  /**
   * Reset location state
   */
  function resetLocation(): void {
    location.value = null
    error.value = null
    loading.value = false
  }

  /**
   * Check if geolocation permission is granted
   */
  async function checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!import.meta.client || !navigator.permissions) {
      return 'denied'
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      return result.state
    } catch {
      return 'prompt'
    }
  }

  return {
    // State
    location: readonly(location),
    loading: readonly(loading),
    error: readonly(error),

    // Methods
    getCurrentLocation,
    reverseGeocode,
    createManualLocation,
    resetLocation,
    checkPermission
  }
}
