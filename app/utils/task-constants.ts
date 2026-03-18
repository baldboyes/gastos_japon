export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'bg-blue-600 text-white' },
  { value: 'medium', label: 'Media', color: 'bg-green-600 text-white' },
  { value: 'high', label: 'Alta', color: 'bg-orange-400 text-white' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-600 text-white' },
]

export const TASK_STATUSES: { value: TaskStatus; label: string; icon: string }[] = [
  { value: 'pending', label: 'Pendiente', icon: 'clock' },
  { value: 'in_progress', label: 'En Progreso', icon: 'play-circle' },
  { value: 'completed', label: 'Completada', icon: 'check-circle' },
  { value: 'cancelled', label: 'Cancelada', icon: 'x-circle' },
]
