import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Task, TaskGroup, TaskFilter } from '~/types/tasks'
import { toast } from 'vue-sonner'
import { useNotifications } from '~/composables/useNotifications'

export const useTripTasks = () => {
  const { getAuthenticatedClient, directusUserId } = useDirectus()
  const { createNotification } = useNotifications()

  const tasks = useState<Task[]>('trip-tasks', () => [])
  const taskGroups = useState<TaskGroup[]>('trip-task-groups', () => [])
  const loading = useState<boolean>('trip-tasks-loading', () => false)

  // Fetch groups for a trip
  const fetchTaskGroups = async (tripId: number) => {
    try {
      const client = await getAuthenticatedClient()
      const response = await client.request(readItems('task_groups' as any, {
        filter: { viaje_id: { _eq: tripId } },
        sort: ['date_created']
      }))
      taskGroups.value = response as unknown as TaskGroup[]
    } catch (e) {
      console.error('Error fetching task groups:', e)
    }
  }

  // Common fields to fetch for consistent object structure
  const taskFields = [
    '*', 
    'task_group.*',
    'assigned_to.id',
    'assigned_to.first_name',
    'assigned_to.last_name',
    'assigned_to.avatar_url',
    'user_created.id',
    'user_created.first_name',
    'user_created.last_name',
    'user_created.avatar_url'
  ]

  // Fetch all tasks for a trip (via groups)
  const fetchTasks = async (tripId: number) => {
    loading.value = true
    try {
      const client = await getAuthenticatedClient()
      // Fetch tasks where the associated group belongs to this trip
      const response = await client.request(readItems('tasks' as any, {
        filter: { 
          task_group: { 
            viaje_id: { _eq: tripId } 
          } 
        },
        fields: taskFields
      }))
      
      // Manual sort in client side to avoid API errors
      const tasksData = response as unknown as Task[]
      tasksData.sort((a, b) => {
        // Sort by date first
        if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (a.due_date) return -1
        if (b.due_date) return 1
        return 0
      })
      
      tasks.value = tasksData
    } catch (e) {
      console.error('Error fetching tasks with user details:', e)
      // Fallback: Fetch without expanded user fields if permissions fail
      try {
        const client = await getAuthenticatedClient()
        const response = await client.request(readItems('tasks' as any, {
          filter: { 
            task_group: { 
              viaje_id: { _eq: tripId } 
            } 
          },
          fields: ['*', 'task_group.*']
        }))
        const tasksData = response as unknown as Task[]
        tasksData.sort((a, b) => {
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          if (a.due_date) return -1
          if (b.due_date) return 1
          return 0
        })
        tasks.value = tasksData
      } catch (fallbackError) {
        console.error('Critical error fetching tasks:', fallbackError)
      }
    } finally {
      loading.value = false
    }
  }

  // Initialize default groups for a trip
  const initializeTripTaskGroups = async (tripId: number) => {
    const defaultGroups = [
      { name: 'General', entity_type: 'travel' },
      { name: 'Vuelos', entity_type: 'flight' },
      { name: 'Alojamientos', entity_type: 'accommodation' },
      { name: 'Transporte', entity_type: 'transport' }, // or specific type if exists
      { name: 'Actividades', entity_type: 'activity' },
      { name: 'Seguros', entity_type: 'insurance' }
    ]

    // Ensure groups exist
    if (taskGroups.value.length === 0) {
      await fetchTaskGroups(tripId)
    }

    const promises = defaultGroups.map(async (def) => {
      // Check if group exists by entity_type (generic container, no entity_id)
      const exists = taskGroups.value.find(g => 
        g.entity_type === def.entity_type && 
        (g.entity_id === null || g.entity_id === undefined) &&
        g.name === def.name // Simple check, might need better logic if user renamed
      )

      if (!exists) {
        try {
          await createTaskGroup({
            viaje_id: tripId,
            name: def.name,
            entity_type: def.entity_type as any,
            entity_id: null // Generic container
          })
        } catch (e) {
          console.error(`Error creating default group ${def.name}:`, e)
        }
      }
    })

    await Promise.all(promises)
  }

  // Initial load
  const init = async (tripId: number) => {
    await fetchTaskGroups(tripId)
    await initializeTripTaskGroups(tripId) // Ensure defaults exist
    await fetchTasks(tripId)
  }

  // CRUD for Task Groups
  const createTaskGroup = async (group: Partial<TaskGroup>) => {
    try {
      const client = await getAuthenticatedClient()
      const response = await client.request(createItem('task_groups' as any, group))
      taskGroups.value.push(response as unknown as TaskGroup)
      toast.success('Grupo creado correctamente')
      return response
    } catch (e) {
      console.error('Error creating task group:', e)
      toast.error('Error al crear el grupo')
      throw e
    }
  }

  const updateTaskGroup = async (id: number | string, update: Partial<TaskGroup>) => {
    try {
      const client = await getAuthenticatedClient()
      const response = await client.request(updateItem('task_groups' as any, id, update))
      const index = taskGroups.value.findIndex(g => g.id === id)
      if (index !== -1) taskGroups.value[index] = response as unknown as TaskGroup
      toast.success('Grupo actualizado')
      return response
    } catch (e) {
      console.error('Error updating task group:', e)
      toast.error('Error al actualizar el grupo')
      throw e
    }
  }

  const deleteTaskGroup = async (id: number | string) => {
    try {
      const client = await getAuthenticatedClient()
      await client.request(deleteItem('task_groups' as any, id))
      taskGroups.value = taskGroups.value.filter(g => g.id !== id)
      // Also remove tasks locally or re-fetch
      tasks.value = tasks.value.filter(t => (typeof t.task_group === 'object' ? t.task_group?.id : t.task_group) !== id)
      toast.success('Grupo eliminado')
    } catch (e) {
      console.error('Error deleting task group:', e)
      toast.error('Error al eliminar el grupo')
      throw e
    }
  }

  // CRUD for Tasks
  const createTask = async (task: Partial<Task>) => {
    try {
      const client = await getAuthenticatedClient()
      const response = await client.request(createItem('tasks' as any, {
        ...task,
        status: task.status || 'pending',
        user_created: directusUserId.value,
        date_created: new Date().toISOString()
      }, {
        fields: taskFields
      }))
      
      const newTask = response as unknown as Task
      tasks.value.push(newTask)
      toast.success('Tarea creada')
      
      // Check for immediate notification (e.g. if due today)
      // checkDueNotification(newTask) 
      
      // Notify assigned user if different from creator
      if (newTask.assigned_to && newTask.assigned_to !== directusUserId.value) {
        await createNotification({
          recipient_id: newTask.assigned_to as unknown as string,
          title: 'Nueva Tarea Asignada',
          message: `Se te ha asignado la tarea: "${newTask.title}"`,
          type: 'info',
          action_link: `/trips/${task.task_group ? (typeof task.task_group === 'object' ? task.task_group.viaje_id : 'unknown') : ''}/tasks`
        })
      }

      return response
    } catch (e) {
      console.error('Error creating task:', e)
      toast.error('Error al crear la tarea')
      throw e
    }
  }

  const updateTask = async (id: number | string, update: Partial<Task>) => {
    try {
      const client = await getAuthenticatedClient()
      const response = await client.request(updateItem('tasks' as any, id, update, {
        fields: taskFields
      }))
      const index = tasks.value.findIndex(t => t.id === id)
      let oldAssignedTo = null
      if (index !== -1) {
        // Preserve expanded fields if API returns IDs
        const existing = tasks.value[index]
        if (existing) {
           oldAssignedTo = existing.assigned_to
        }
        
        const updated = response as unknown as Task
        
        if (existing && updated.task_group && typeof updated.task_group !== 'object' && existing.task_group && typeof existing.task_group === 'object') {
           updated.task_group = existing.task_group
        }
        
        tasks.value[index] = updated

        // Notify if assignment changed
        if (updated.assigned_to && updated.assigned_to !== oldAssignedTo && updated.assigned_to !== directusUserId.value) {
          // Determine trip ID safely
          let tripId = 'unknown'
          if (typeof updated.task_group === 'object' && updated.task_group?.viaje_id) {
             tripId = updated.task_group.viaje_id.toString()
          }

          await createNotification({
            recipient_id: updated.assigned_to as unknown as string,
            title: 'Tarea Asignada',
            message: `Se te ha asignado la tarea: "${updated.title}"`,
            type: 'info',
            action_link: `/trips/${tripId}/tasks`
          })
        }
      }
      toast.success('Tarea actualizada')
      return response
    } catch (e) {
      console.error('Error updating task:', e)
      toast.error('Error al actualizar la tarea')
      throw e
    }
  }

  const deleteTask = async (id: number | string) => {
    try {
      const client = await getAuthenticatedClient()
      await client.request(deleteItem('tasks' as any, id))
      tasks.value = tasks.value.filter(t => t.id !== id)
      toast.success('Tarea eliminada')
    } catch (e) {
      console.error('Error deleting task:', e)
      toast.error('Error al eliminar la tarea')
      throw e
    }
  }

  // Computed
  const tasksByGroup = computed(() => {
    const grouped: Record<string, Task[]> = {}
    taskGroups.value.forEach(g => {
      grouped[String(g.id)] = []
    })
    
    tasks.value.forEach(t => {
      const groupId = typeof t.task_group === 'object' ? t.task_group?.id : t.task_group
      if (groupId) {
        const key = String(groupId)
        if (grouped[key]) {
          grouped[key].push(t)
        }
      }
    })
    return grouped
  })

  const pendingTasksCount = computed(() => tasks.value.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length)

  const tasksDueSoon = computed(() => {
    const now = new Date()
    const in3Days = new Date()
    in3Days.setDate(now.getDate() + 3)
    
    return tasks.value.filter(t => {
      if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false
      const due = new Date(t.due_date)
      return due >= now && due <= in3Days
    })
  })

  // Helper to find or create a group for a specific entity
  const getOrCreateEntityGroup = async (tripId: number, type: string, entityId: number | string, defaultName: string) => {
    // Check if we already have it locally
    let group = taskGroups.value.find(g => g.entity_type === type && String(g.entity_id) === String(entityId))
    
    if (!group) {
       // Try to fetch specifically this group just in case (though fetchTaskGroups gets all)
       // If not found, create it
       try {
         await createTaskGroup({
           viaje_id: tripId,
           name: defaultName,
           entity_type: type as any,
           entity_id: entityId
         })
         // Group is added to state in createTaskGroup
         group = taskGroups.value.find(g => g.entity_type === type && String(g.entity_id) === String(entityId))
       } catch (e) {
         console.error('Error ensuring entity group:', e)
       }
    }
    return group
  }

  // Helper to find generic group by type
  const getGenericGroupByType = (type: string) => {
    return taskGroups.value.find(g => 
      g.entity_type === type && 
      (g.entity_id === null || g.entity_id === undefined)
    )
  }

  return {
    tasks,
    taskGroups,
    loading,
    tasksByGroup,
    init,
    fetchTaskGroups,
    fetchTasks,
    createTaskGroup,
    updateTaskGroup,
    deleteTaskGroup,
    createTask,
    updateTask,
    deleteTask,
    getOrCreateEntityGroup,
    initializeTripTaskGroups,
    getGenericGroupByType
  }
}
