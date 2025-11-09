<template>
  <div class="w-full h-full rounded-lg overflow-hidden">
    <div ref="mapContainer" class="w-full h-full" />
  </div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Props {
  latitude: number
  longitude: number
  placeName?: string
}

const props = defineProps<Props>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
let marker: mapboxgl.Marker | null = null

// MapBox configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFsZGJveSIsImEiOiJhMzBzeklzIn0.buJ1PP9-a9JkqNWGHW-H0g'
const MAPBOX_STYLE = 'mapbox://styles/baldboy/ckqpgqc2u62da18n921ft241q'

// Initialize map
onMounted(() => {
  if (!mapContainer.value) return

  // Only show map if coordinates are valid
  if (props.latitude === 0 && props.longitude === 0) return

  mapboxgl.accessToken = MAPBOX_TOKEN

  // Initialize map
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAPBOX_STYLE,
    center: [props.longitude, props.latitude],
    zoom: 14,
    attributionControl: false,
    interactive: false // Make it read-only
  })

  // Add attribution control
  map.addControl(
    new mapboxgl.AttributionControl({
      compact: true
    }),
    'bottom-right'
  )

  // Add marker
  addMarker()
})

// Add marker to map
function addMarker() {
  if (!map) return

  // Create custom marker element
  const el = document.createElement('div')
  el.style.width = '40px'
  el.style.height = '40px'
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
    .setLngLat([props.longitude, props.latitude])
    .addTo(map)
}

// Watch for prop changes
watch(() => [props.latitude, props.longitude, props.placeName], () => {
  if (map && marker && props.latitude !== 0 && props.longitude !== 0) {
    map.flyTo({
      center: [props.longitude, props.latitude],
      zoom: 14,
      duration: 1000
    })
    marker.setLngLat([props.longitude, props.latitude])
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
