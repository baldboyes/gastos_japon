import { createItem, readItems, updateItem, deleteItem } from '@directus/sdk'
import { ref, computed } from 'vue'

export interface Notification {
  id: number | string
  status: string
  date_created: string
  user_created: string
  recipient_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'invite'
  read_at: string | null
  action_link?: string
}

export const useNotifications = () => {
  const { getAuthenticatedClient, directusUserId } = useDirectus()
  const { $toast } = useNuxtApp()
  
  const notifications = useState<Notification[]>('notifications', () => [])
  const isLoading = useState<boolean>('notifications-loading', () => false)

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read_at).length
  })

  const fetchNotifications = async () => {
    if (!directusUserId.value) return

    isLoading.value = true
    try {
      const client = await getAuthenticatedClient()
      const response = await client.request(readItems('notificaciones', {
        filter: {
          recipient_id: {
            _eq: directusUserId.value
          }
        },
        sort: ['-date_created']
      }))
      
      notifications.value = response as Notification[]
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      isLoading.value = false
    }
  }

  const markAsRead = async (id: number | string) => {
    try {
      const client = await getAuthenticatedClient()
      await client.request(updateItem('notificaciones', id, {
        read_at: new Date().toISOString()
      }))
      
      // Update local state
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value[index].read_at = new Date().toISOString()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      $toast?.error('Error al actualizar la notificación')
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.value
      .filter(n => !n.read_at)
      .map(n => n.id)

    if (unreadIds.length === 0) return

    try {
      const client = await getAuthenticatedClient()
      // We have to update one by one or use a batch endpoint if available/configured
      // For now, doing it in parallel
      await Promise.all(unreadIds.map(id => 
        client.request(updateItem('notificaciones', id, {
          read_at: new Date().toISOString()
        }))
      ))

      notifications.value.forEach(n => {
        if (!n.read_at) n.read_at = new Date().toISOString()
      })
      
      $toast?.success('Todas las notificaciones marcadas como leídas')
    } catch (error) {
      console.error('Error marking all as read:', error)
      $toast?.error('Error al actualizar las notificaciones')
    }
  }

  const deleteNotification = async (id: number | string) => {
    try {
      const client = await getAuthenticatedClient()
      await client.request(deleteItem('notificaciones', id))
      
      notifications.value = notifications.value.filter(n => n.id !== id)
      $toast?.success('Notificación eliminada')
    } catch (error) {
      console.error('Error deleting notification:', error)
      $toast?.error('Error al eliminar la notificación')
    }
  }

  const createNotification = async (notification: Partial<Notification>) => {
    try {
      const client = await getAuthenticatedClient()
      await client.request(createItem('notificaciones', {
        ...notification,
        status: 'published',
        date_created: new Date().toISOString() // Directus usually handles this, but good to be explicit if needed
      }))
      // We don't necessarily update local state here as the notification might be for another user
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  }
}
