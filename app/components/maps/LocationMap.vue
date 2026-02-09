<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="w-full h-full rounded-lg" />
  </div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  latitude: number
  longitude: number
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

  // Basic validation
  if (!props.latitude || !props.longitude) return

  mapboxgl.accessToken = MAPBOX_TOKEN

  const center: [number, number] = [props.longitude, props.latitude]

  // Initialize map
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAPBOX_STYLE,
    center,
    zoom: 14,
    attributionControl: false,
    interactive: true // Allow panning/zooming
  })

  // Add controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.addControl(
    new mapboxgl.AttributionControl({
      compact: true
    }),
    'bottom-right'
  )

  // Add marker
  marker = new mapboxgl.Marker()
    .setLngLat(center)
    .addTo(map)
})

// Update map if props change
watch(() => [props.latitude, props.longitude], ([newLat, newLng]) => {
  if (!map || !newLat || !newLng) return
  
  const center: [number, number] = [newLng, newLat]
  
  map.flyTo({
    center,
    zoom: 14
  })
  
  if (marker) {
    marker.setLngLat(center)
  } else {
    marker = new mapboxgl.Marker()
      .setLngLat(center)
      .addTo(map)
  }
})

// Cleanup
onUnmounted(() => {
  marker?.remove()
  map?.remove()
  map = null
})
</script>

<style scoped>
/* Ensure map container has size */
:deep(.mapboxgl-map) {
  border-radius: 0.5rem;
}
</style>
