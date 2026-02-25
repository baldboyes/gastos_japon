<script setup lang="ts">
import { useRoute } from 'vue-router'
import TaskBoard from '~/components/trips/tasks/TaskBoard.vue'
import { ListTodo } from 'lucide-vue-next'
const route = useRoute()
const tripId = parseInt(route.params.id as string)

definePageMeta({
  layout: 'dashboard'
})
</script>

<template>
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row gap-8 items-start relative">
        <div class="flex-1 w-full space-y-4">
          <div class="flex items-center gap-4">
            <div class="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mt-1">
              <ListTodo class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-2xl font-bold tracking-tight">Tareas</h2>
              <p class="text-muted-foreground hidden md:block">Organiza las actividades y pendientes de tu viaje.</p>
            </div>
          </div>
          <TaskBoard :trip-id="tripId" />
        </div>
      </div>
    </div>
</template>
