<script setup lang="ts">
import { useRoute } from 'vue-router'
import TaskBoard from '~/components/trips/tasks/TaskBoard.vue'

const route = useRoute()
const tripId = parseInt(route.params.id as string)

definePageMeta({
  layout: 'dashboard'
})
</script>

<template>
  <NuxtLayout name="dashboard">
    <div class="space-y-6">
      <div class="flex justify-between items-center px-4 md:px-0">
        <div>
          <h2 class="text-2xl font-bold tracking-tight">Gestión de Tareas</h2>
          <p class="text-muted-foreground hidden md:block">Organiza las actividades y pendientes de tu viaje.</p>
        </div>
      </div>
      
      <TaskBoard :trip-id="tripId" />
    </div>
  </NuxtLayout>
</template>
