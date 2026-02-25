<template>
  <div ref="mapContainer" class="w-full h-full" />
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Expense } from '~/types'
import { getCategoryInfo } from '~/types'

const { formatAmount } = useCurrency()

interface Props {
  expenses: Expense[]
  selectedExpenseId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'marker-click': [expense: Expense]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map | null = null
const markers: Map<string, mapboxgl.Marker> = new Map()

// MapBox configuration
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFsZGJveSIsImEiOiJhMzBzeklzIn0.buJ1PP9-a9JkqNWGHW-H0g'
const MAPBOX_STYLE = 'mapbox://styles/baldboy/ckqpgqc2u62da18n921ft241q'

// Initialize map
onMounted(() => {
  if (!mapContainer.value) return

  mapboxgl.accessToken = MAPBOX_TOKEN

  // Calculate center and bounds from expenses
  const validExpenses = props.expenses.filter(e => 
    e.location.coordinates.lat !== 0 && 
    e.location.coordinates.lng !== 0 && 
    !isNaN(e.location.coordinates.lat) && 
    !isNaN(e.location.coordinates.lng)
  )

  let center: [number, number] = [139.6917, 35.6895] // Default to Tokyo
  let zoom = 5

  if (validExpenses.length > 0) {
    // Calculate average position
    const avgLng = validExpenses.reduce((sum, e) => sum + e.location.coordinates.lng, 0) / validExpenses.length
    const avgLat = validExpenses.reduce((sum, e) => sum + e.location.coordinates.lat, 0) / validExpenses.length
    center = [avgLng, avgLat]
    zoom = validExpenses.length === 1 ? 14 : 10
  }

  // Initialize map
  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: MAPBOX_STYLE,
    center,
    zoom,
    attributionControl: false
  })

  // Add controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
  map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
  map.addControl(
    new mapboxgl.AttributionControl({
      compact: true
    }),
    'bottom-right'
  )

  // Add markers after map loads
  map.on('load', () => {
    addMarkers()
  })

  // Fit bounds to show all markers
  if (validExpenses.length > 1) {
    const bounds = new mapboxgl.LngLatBounds()
    validExpenses.forEach(expense => {
      bounds.extend([expense.location.coordinates.lng, expense.location.coordinates.lat])
    })
    map?.fitBounds(bounds, { padding: 50, maxZoom: 14 })
  } else if (validExpenses.length === 1) {
    // Center on the single expense
    map?.flyTo({
      center: [validExpenses[0].location.coordinates.lng, validExpenses[0].location.coordinates.lat],
      zoom: 14
    })
  }
})

// Add markers to map
function addMarkers() {
  if (!map) return

  // Clear existing markers
  markers.forEach(marker => marker.remove())
  markers.clear()

  // Add new markers
  props.expenses.forEach(expense => {
    // Skip expenses without valid coordinates
    if (
      expense.location.coordinates.lat === 0 || 
      expense.location.coordinates.lng === 0 || 
      isNaN(expense.location.coordinates.lat) || 
      isNaN(expense.location.coordinates.lng)
    ) {
      return
    }

    const categoryInfo = getCategoryInfo(expense.category)

    // Create custom marker element
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.width = '40px'
    el.style.height = '40px'
    el.style.cursor = 'pointer'
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    el.style.transition = 'transform 0.2s'
    el.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid #14b8a6;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 20px;
          display: block;
          line-height: 1;
        ">${categoryInfo.icon}</span>
      </div>
    `

    // Create popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      maxWidth: '250px'
    }).setHTML(`
      <div style="padding: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 24px;">${categoryInfo.icon}</span>
          <div>
            <div style="font-weight: 600; font-size: 14px; color: #0f172a;">${expense.placeName}</div>
            <div style="font-size: 12px; color: #64748b;">${categoryInfo.label}</div>
          </div>
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #14b8a6; margin-bottom: 4px;">
          ${formatAmount(expense.amount)}
        </div>
        <div style="font-size: 12px; color: #64748b;">
          📍 ${expense.location.city}, ${expense.location.prefecture}
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #94a3b8; text-align: center;">
          Click para ver detalles
        </div>
      </div>
    `)

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([expense.location.coordinates.lng, expense.location.coordinates.lat])
      .setPopup(popup)
      .addTo(map!)

    // Click handler
    el.addEventListener('click', () => {
      emit('marker-click', expense)
    })

    markers.set(expense.id, marker)
  })
}

// Watch for expense changes
watch(() => props.expenses, () => {
  addMarkers()
  
  // Re-fit bounds when expenses change
  const validExpenses = props.expenses.filter(e => e.location.coordinates.lat !== 0 && e.location.coordinates.lng !== 0)
  
  if (map && validExpenses.length > 1) {
    const bounds = new mapboxgl.LngLatBounds()
    validExpenses.forEach(expense => {
      bounds.extend([expense.location.coordinates.lng, expense.location.coordinates.lat])
    })
    map.fitBounds(bounds, { padding: 50, maxZoom: 14 })
  } else if (map && validExpenses.length === 1) {
    map.flyTo({
      center: [validExpenses[0].location.coordinates.lng, validExpenses[0].location.coordinates.lat],
      zoom: 14
    })
  }
}, { deep: true })

// Highlight selected marker
watch(() => props.selectedExpenseId, (newId, oldId) => {
  // Reset old marker
  if (oldId) {
    const oldMarker = markers.get(oldId)
    if (oldMarker) {
      const el = oldMarker.getElement()
      const pin = el.querySelector('div') as HTMLDivElement
      if (pin) {
        pin.style.border = '3px solid #14b8a6'
        pin.style.transform = 'rotate(-45deg) scale(1)'
      }
    }
  }

  // Highlight new marker
  if (newId) {
    const newMarker = markers.get(newId)
    if (newMarker) {
      const el = newMarker.getElement()
      const pin = el.querySelector('div') as HTMLDivElement
      if (pin) {
        pin.style.border = '3px solid #f59e0b' // Highlight in orange
        pin.style.transform = 'rotate(-45deg) scale(1.2)'
      }

      // Fly to marker
      const expense = props.expenses.find(e => e.id === newId)
      if (expense && map) {
        map.flyTo({
          center: [expense.location.coordinates.lng, expense.location.coordinates.lat],
          zoom: 15,
          duration: 1500
        })
      }

      // Toggle popup
      newMarker.togglePopup()
    }
  }
})

// Cleanup
onUnmounted(() => {
  markers.forEach(marker => marker.remove())
  markers.clear()
  map?.remove()
  map = null
})
</script>

<style scoped>
:deep(.mapboxgl-popup-content) {
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

:deep(.mapboxgl-popup-tip) {
  border-top-color: white;
}
</style>
