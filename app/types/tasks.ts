export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskEntityType = 'travel' | 'flight' | 'accommodation' | 'insurance' | 'activity' | 'category' | 'transport'

export interface TaskGroup {
  id: string | number
  viaje_id: number
  name: string
  description?: string
  entity_type: TaskEntityType
  entity_id?: string | number
  user_created?: string
  date_created?: string
  date_updated?: string
}

export interface Task {
  id: string | number
  task_group?: string | number | TaskGroup // Can be expanded
  title: string
  description?: string
  due_date?: string
  priority: TaskPriority
  status: TaskStatus
  assigned_to?: string | any // User ID or User Object
  entity_type?: TaskEntityType // Direct association
  entity_id?: string | number // Direct association
  user_created?: string | any // User ID or User Object
  date_created?: string
  date_updated?: string
  completed_at?: string
  completed_by?: string
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigned_to?: string
  task_group?: string | number
  search?: string
}

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'bg-blue-50 text-blue-800' },
  { value: 'medium', label: 'Media', color: 'bg-green-50 text-green-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-50 text-orange-800' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-50 text-red-800' },
]

export const TASK_STATUSES: { value: TaskStatus; label: string; icon: string }[] = [
  { value: 'pending', label: 'Pendiente', icon: 'clock' },
  { value: 'in_progress', label: 'En Progreso', icon: 'play-circle' },
  { value: 'completed', label: 'Completada', icon: 'check-circle' },
  { value: 'cancelled', label: 'Cancelada', icon: 'x-circle' },
]
