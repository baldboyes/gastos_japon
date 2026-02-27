<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { onMounted } from 'vue'
  import { Users, UserPlus, Mail, Loader2, CheckCircle, AlertCircle, Crown, Trash2, Shield, User, Plus } from 'lucide-vue-next'
  import { Button } from '~/components/ui/button'
  import { Input } from '~/components/ui/input'
  import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '~/components/ui/card'
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
  import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
  import { Label } from '~/components/ui/label'
  import { Badge } from '~/components/ui/badge'
  import { toast } from 'vue-sonner'
  import { useDirectus } from '~/composables/useDirectus'
  import { useTrips } from '~/composables/useTrips'

  definePageMeta({
    layout: 'dashboard'
  })

  const route = useRoute()
  const tripId = route.params.id as string
  const { user } = useUser()
  const { directusUserId } = useDirectus()
  const { trips, travelers, fetchTravelers } = useTrips()

  const isInviteModalOpen = ref(false)
  const inviteEmail = ref('')
  const inviteRole = ref('a78c3ab5-20eb-451f-b93f-c087f500fb47') // Default to App User
  const isInviting = ref(false)
  const inviteResult = ref<{ status: 'success' | 'error', message: string, type?: 'invited' | 'email_sent' } | null>(null)

  // Obtener nombre del viaje actual
  const currentTrip = computed(() => trips.value.find(t => t.id === parseInt(tripId)))

  onMounted(() => {
    fetchTravelers(tripId)
  })

  // Determinar si el usuario actual es Owner
  const isCurrentUserOwner = computed(() => {
    const me = travelers.value.find(t => t.id === directusUserId.value)
    return me?.role === 'owner' || travelers.value.length === 0 // Fallback si no hay nadie cargado
  })

  const removeTraveler = async (relationId: string) => {
    if (!confirm('¿Seguro que quieres eliminar a este viajero del grupo?')) return

    try {
      const response = await $fetch('/api/trips/remove-traveler', {
        method: 'POST',
        body: { relationId, userId: directusUserId.value }
      }) as any

      if (response.success) {
        toast.success('Viajero eliminado')
        fetchTravelers(tripId)
      } else {
        toast.error(response.error || 'Error al eliminar viajero')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión')
    }
  }


  const isValidEmail = computed(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.value)
  })

  const handleInvite = async () => {
    if (!isValidEmail.value) return
    if (!directusUserId.value) {
      toast.error('Error de autenticación. Recarga la página.')
      return
    }

    isInviting.value = true
    inviteResult.value = null

    try {
      const response = await $fetch('/api/trips/invite', {
        method: 'POST',
        body: {
          email: inviteEmail.value,
          role: inviteRole.value,
          tripId: parseInt(tripId),
          tripName: currentTrip.value?.nombre || 'Viaje a Japón',
          inviterName: user.value?.fullName || user.value?.firstName || 'Un usuario',
          inviterId: directusUserId.value
        }
      }) as any

      if (response.success) {
        inviteResult.value = {
          status: 'success',
          message: response.message,
          type: response.status
        }
        toast.success(response.message)
        inviteEmail.value = '' // Limpiar campo si éxito
      } else {
        inviteResult.value = {
          status: 'error',
          message: response.error || 'Error al enviar invitación'
        }
        toast.error(response.error || 'Error al enviar invitación')
      }
    } catch (error: any) {
      console.error('Error inviting user:', error)
      inviteResult.value = {
        status: 'error',
        message: 'Error de conexión con el servidor'
      }
      toast.error('Error al procesar la solicitud')
    } finally {
      isInviting.value = false
    }
  }

  const closeInviteModal = () => {
    isInviteModalOpen.value = false
    inviteEmail.value = ''
    inviteRole.value = 'a78c3ab5-20eb-451f-b93f-c087f500fb47'
    inviteResult.value = null
  }
</script>

<template>
  <div>
    <div class="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-1">
                <Users class="h-5 w-5" />
              </div>
              <div>
                <h2 class="text-2xl font-bold tracking-tight">Viajeros</h2>
                <p class="text-muted-foreground">Gestiona quiénes participan en este viaje.</p>
              </div>
            </div>
            <Button @click="isInviteModalOpen = true"><Plus class="h-4 w-4" /> Añadir</Button>
          </div>
          <!-- Lista de viajeros -->
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">    
            <!-- Tarjetas de viajeros reales -->
            <Card v-for="traveler in travelers" :key="traveler.id" class="relative overflow-hidden">
              <div v-if="traveler.role === 'owner'" class="absolute top-0 right-0 uppercase bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-bl font-bold flex items-center gap-1">
                <Crown class="h-3 w-3" /> Organizador
              </div>
              <CardContent class="p-2">
                <div class="space-y-8">
                  <!-- Avatar -->
                  <div class="h-12 w-12 rounded-full overflow-hidden bg-slate-100 border flex items-center justify-center">
                    <img v-if="traveler.avatar_url" :src="traveler.avatar_url" class="h-full w-full object-cover" />
                    <User v-else class="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 class="font-bold text-lg leading-none">{{ traveler.first_name }} {{ traveler.last_name }}</h3>
                    <p class="text-sm text-muted-foreground mt-1">{{ traveler.email }}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter class="px-4 flex justify-end gap-2 absolute bottom-2 right-0" v-if="isCurrentUserOwner && traveler.id !== directusUserId">
                <Button variant="ghost" size="sm" class="text-red-600 hover:text-red-700 hover:bg-red-50 h-8" @click="removeTraveler(traveler.relationId)">
                  <Trash2 class="h-3.5 w-3.5 mr-1.5" /> Eliminar
                </Button>
              </CardFooter>
            </Card>

            <!-- Tarjeta para invitar (siempre primera) -->
            <Card class="bg-slate-50 border-dashed h-full">
              <CardContent class="flex flex-col items-center justify-center py-4 text-center h-full">
                <div class="rounded-full bg-slate-100 p-3 mb-3">
                  <UserPlus class="h-6 w-6 text-slate-400" />
                </div>
                <h3 class="font-medium">Invitar a más personas</h3>
                <p class="text-sm text-muted-foreground mt-1 mb-4 max-w-[200px]">
                  Comparte los gastos y la planificación con tus amigos.
                </p>
                <Button variant="outline" size="sm" @click="isInviteModalOpen = true">
                  Invitar ahora
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
    </div>

    <!-- Modal de Invitación -->
    <Dialog :open="isInviteModalOpen" @update:open="closeInviteModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar al viaje</DialogTitle>
          <DialogDescription>
            Introduce el correo electrónico de la persona que quieres invitar.
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              v-model="inviteEmail" 
              placeholder="ejemplo@correo.com" 
              type="email" 
              :disabled="isInviting"
              @keyup.enter="handleInvite"
            />
          </div>

          <div class="space-y-2">
            <Label>Rol</Label>
            <Select v-model="inviteRole">
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="a78c3ab5-20eb-451f-b93f-c087f500fb47">
                    <div class="flex flex-col text-left">
                      <span class="font-medium">Usuario App</span>
                      <span class="text-xs text-muted-foreground">Puede crear y editar.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="7e0df8d5-c156-4db0-ae0a-aa6d2980c61e">
                     <div class="flex flex-col text-left">
                      <span class="font-medium">Solo Lectura</span>
                      <span class="text-xs text-muted-foreground">Solo puede ver información.</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- Feedback visual -->
          <div v-if="inviteResult" class="rounded-md p-3 text-sm flex items-start gap-2"
            :class="inviteResult.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
          >
            <CheckCircle v-if="inviteResult.status === 'success'" class="h-4 w-4 mt-0.5 shrink-0" />
            <AlertCircle v-else class="h-4 w-4 mt-0.5 shrink-0" />
            
            <div class="flex-1">
              <p class="font-medium">{{ inviteResult.message }}</p>
              <p v-if="inviteResult.type === 'email_sent'" class="text-xs mt-1 opacity-90">
                El usuario recibirá un correo con instrucciones para registrarse.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter class="sm:justify-end">
          <Button variant="secondary" @click="closeInviteModal">
            Cerrar
          </Button>
          <Button @click="handleInvite" :disabled="!isValidEmail || isInviting">
            <Loader2 v-if="isInviting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isInviting ? 'Enviando...' : 'Enviar invitación' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
