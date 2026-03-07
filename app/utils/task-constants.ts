export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

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
