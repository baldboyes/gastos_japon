import { createItem, readItems, updateItem, deleteItem } from '@directus/sdk'
import { ref, computed } from 'vue'
import type { Notification } from '~/types/directus'
import { toast } from 'vue-sonner'

export const useNotificationsNew = () => {
  const { getClient, directusUserId } = useDirectusRepo()
  
  const notifications = useState<Notification[]>('notifications-new', () => [])
  const isLoading = useState<boolean>('notifications-new-loading', () => false)

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read_at).length
  })

  const fetchNotifications = async () => {
    if (!directusUserId.value) return

    isLoading.value = true
    try {
      const client = await getClient()
      const response = await client.request(readItems('notifications', {
        filter: {
          recipient_id: {
            _eq: directusUserId.value
          }
        },
        sort: ['-date_created']
      }))
      
      notifications.value = response as Notification[]
    } catch (error) {
      console.error('Error fetching notifications (new):', error)
    } finally {
      isLoading.value = false
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const client = await getClient()
      await client.request(updateItem('notifications', id, {
        read_at: new Date().toISOString()
      }))
      
      // Update local state
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value[index].read_at = new Date().toISOString()
      }
    } catch (error) {
      console.error('Error marking notification as read (new):', error)
      toast.error('Error al actualizar la notificación')
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.value
      .filter(n => !n.read_at)
      .map(n => n.id)

    if (unreadIds.length === 0) return

    try {
      const client = await getClient()
      // We have to update one by one or use a batch endpoint if available/configured
      // For now, doing it in parallel
      await Promise.all(unreadIds.map(id => 
        client.request(updateItem('notifications', id, {
          read_at: new Date().toISOString()
        }))
      ))

      notifications.value.forEach(n => {
        if (!n.read_at) n.read_at = new Date().toISOString()
      })
      
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (error) {
      console.error('Error marking all as read (new):', error)
      toast.error('Error al actualizar las notificaciones')
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      const client = await getClient()
      await client.request(deleteItem('notifications', id))
      
      notifications.value = notifications.value.filter(n => n.id !== id)
      toast.success('Notificación eliminada')
    } catch (error) {
      console.error('Error deleting notification (new):', error)
      toast.error('Error al eliminar la notificación')
    }
  }

  const createNotification = async (notification: Partial<Notification>) => {
    try {
      const client = await getClient()
      await client.request(createItem('notifications', {
        ...notification,
        status: 'published',
        date_created: new Date().toISOString() // Directus usually handles this, but good to be explicit if needed
      } as any))
      // We don't necessarily update local state here as the notification might be for another user
    } catch (error) {
      console.error('Error creating notification (new):', error)
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
