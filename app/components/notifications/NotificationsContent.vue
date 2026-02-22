<template>
  <DrawerContent class="h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4">

    <DrawerHeader class="w-full max-w-xl mx-auto px-0">
      <div class="flex items-center justify-between mb-2">
        <DrawerTitle>Notificaciones</DrawerTitle>
        <Button v-if="unreadCount > 0" size="sm" @click="markAllAsRead">
          Marcar todo como leído
        </Button>
      </div>
    </DrawerHeader>

    <ScrollArea class="flex-1 h-[calc(90vh-180px)] px-0 pb-0">
      <div class="max-w-xl mx-auto flex gap-16 flex-col lg:flex-row pr-4 pb-8">
        <div v-if="isLoading && notifications.length === 0" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="notifications.length === 0" class="text-center py-12 text-muted-foreground">
          <BellOff class="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No tienes notificaciones</p>
        </div>

        <div v-else class="space-y-4">
          <Card 
            v-for="notification in notifications" 
            :key="notification.id"
            class="transition-colors"
            :class="{ 'bg-muted/50': !!notification.read_at, 'border-l-4 border-l-primary': !notification.read_at }"
          >
            <CardContent class="p-4">
              <div class="flex items-start gap-4">
                <div class="mt-1">
                  <component :is="getIconForType(notification.type)" class="h-5 w-5" :class="getColorForType(notification.type)" />
                </div>
                
                <div class="flex-1 space-y-1">
                  <div class="flex items-start justify-between">
                    <h3 class="font-medium leading-none" :class="{ 'text-muted-foreground': !!notification.read_at }">
                      {{ notification.title }}
                    </h3>
                    <span class="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {{ formatDate(notification.date_created) }}
                    </span>
                  </div>
                  
                  <p class="text-sm text-muted-foreground">
                    {{ notification.message }}
                  </p>

                  <!-- Acciones especiales para Invitaciones -->
                  <div v-if="notification.type === 'invite' && !notification.read_at" class="flex gap-2 mt-3 mb-1">
                    <Button size="sm" class="h-8" @click="handleInviteResponse(notification, true)">
                      Aceptar
                    </Button>
                    <Button size="sm" variant="outline" class="h-8" @click="handleInviteResponse(notification, false)">
                      Rechazar
                    </Button>
                  </div>

                  <div class="flex items-center gap-2 pt-2">
                    <Button 
                      v-if="notification.action_link && notification.type !== 'invite'" 
                      variant="link" 
                      class="p-0 h-auto text-xs"
                      @click="handleAction(notification)"
                    >
                      Ver detalles
                    </Button>
                    
                    <div class="flex-1"></div>
                    
                    <Button 
                      v-if="!notification.read_at"
                      variant="ghost" 
                      size="icon" 
                      class="h-6 w-6"
                      @click="markAsRead(notification.id)"
                      title="Marcar como leída"
                    >
                      <Check class="h-3 w-3" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      class="h-6 w-6 text-destructive/50 hover:text-destructive"
                      @click="deleteNotification(notification.id)"
                      title="Eliminar"
                    >
                      <Trash2 class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  </DrawerContent>


</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BellOff, Info, AlertTriangle, CheckCircle, AlertOctagon, Mail, Check, Trash2 } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { useNotifications, type Notification } from '~/composables/useNotifications'
import { useDirectus } from '~/composables/useDirectus'
import { toast } from 'vue-sonner'

const router = useRouter()
const { directusUserId } = useDirectus()
const { 
  notifications, 
  isLoading, 
  unreadCount, 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification
} = useNotifications()

onMounted(() => {
  fetchNotifications()
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'warning': return AlertTriangle
    case 'success': return CheckCircle
    case 'error': return AlertOctagon
    case 'invite': return Mail
    default: return Info
  }
}

const getColorForType = (type: string) => {
  switch (type) {
    case 'warning': return 'text-yellow-500'
    case 'success': return 'text-green-500'
    case 'error': return 'text-red-500'
    case 'invite': return 'text-blue-500'
    default: return 'text-primary'
  }
}

const handleAction = async (notification: Notification) => {
  if (!notification.read_at) {
    await markAsRead(notification.id)
  }
  if (notification.action_link) {
    router.push(notification.action_link)
  }
}

const handleInviteResponse = async (notification: Notification, accept: boolean) => {
  if (!directusUserId.value) return

  try {
    const response = await $fetch('/api/trips/respond-invite', {
      method: 'POST',
      body: {
        notificationId: notification.id,
        accept: accept,
        userId: directusUserId.value
      }
    }) as any

    if (response.success) {
      toast.success(accept ? 'Invitación aceptada' : 'Invitación rechazada')
      // Actualizar lista localmente
      await fetchNotifications()
    } else {
      toast.error(response.error || 'Error al procesar la respuesta')
    }
  } catch (error) {
    console.error('Error responding invite:', error)
    toast.error('Error de conexión')
  }
}
</script>
