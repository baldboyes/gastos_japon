<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="w-full h-full rounded-lg" />
  </div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Props {
  latitude: number
  longitude: number
}

interface Emits {
  (e: 'location-change', data: { lat: number; lng: number; city: string; prefecture: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
let marker: mapboxgl.Marker | null = null

// MapBox configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFsZGJveSIsImEiOiJhMzBzeklzIn0.buJ1PP9-a9JkqNWGHW-H0g'
const MAPBOX_STYLE = 'mapbox://styles/baldboy/ckqpgqc2u62da18n921ft241q'

// Initialize map
onMounted(() => {
  if (!mapContainer.value) return

  mapboxgl.accessToken = MAPBOX_TOKEN

  const center: [number, number] = props.longitude !== 0 && props.latitude !== 0
    ? [props.longitude, props.latitude]
    : [139.6917, 35.6895] // Default to Tokyo

  // Initialize map
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAPBOX_STYLE,
    center,
    zoom: 13,
    attributionControl: false
  })

  // Add controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.addControl(
    new mapboxgl.AttributionControl({
      compact: true
    }),
    'bottom-right'
  )

  // Add initial marker
  if (props.latitude !== 0 && props.longitude !== 0) {
    addMarker(props.longitude, props.latitude)
  }

  // Handle map clicks
  map.on('click', async (e) => {
    const { lng, lat } = e.lngLat

    // Update marker position
    addMarker(lng, lat)

    // Reverse geocode to get city and prefecture (in English)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=en`
      )
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

      // Emit the new location
      emit('location-change', {
        lat,
        lng,
        city: city || 'Desconocido',
        prefecture: prefecture || 'Desconocido'
      })
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      // Emit with coordinates only
      emit('location-change', {
        lat,
        lng,
        city: 'Desconocido',
        prefecture: 'Desconocido'
      })
    }
  })
})

// Add or update marker
function addMarker(lng: number, lat: number) {
  if (!map) return

  // Remove existing marker
  if (marker) {
    marker.remove()
  }

  // Create custom marker element
  const el = document.createElement('div')
  el.style.width = '40px'
  el.style.height = '40px'
  el.style.cursor = 'pointer'
  el.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      background: #14b8a6;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 20px;
        display: block;
      ">📍</span>
    </div>
  `

  // Create and add marker
  marker = new mapboxgl.Marker(el)
    .setLngLat([lng, lat])
    .addTo(map)
}

// Watch for prop changes
watch(() => [props.latitude, props.longitude], ([lat, lng]) => {
  if (lat !== 0 && lng !== 0 && map) {
    map.flyTo({
      center: [lng, lat],
      zoom: 13,
      duration: 1000
    })
    addMarker(lng, lat)
  }
})

// Cleanup
onUnmounted(() => {
  marker?.remove()
  map?.remove()
  map = null
  marker = null
})
</script>
