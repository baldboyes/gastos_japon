<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, LogOut, ChevronsUpDown, User, Settings } from 'lucide-vue-next'
import { useNotifications } from '~/composables/useNotifications'
import NotificationsContent from '~/components/notifications/NotificationsContent.vue'
import PreferencesDrawer from '~/components/settings/PreferencesDrawer.vue'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '~/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

const router = useRouter()
const { user } = useUser()
const clerk = useClerk()
const { unreadCount, fetchNotifications } = useNotifications()
const isPreferencesOpen = ref(false)

// Fetch notifications count on mount
onMounted(() => {
  fetchNotifications()
})

const handleLogout = async () => {
  await clerk.value?.signOut()
  router.push('/')
}
</script>

<template>
  <div class="flex items-center gap-4">
    <!-- Notifications Drawer -->
    <Drawer>
      <DrawerTrigger as-child>
        <button class="p-2 text-gray-500 hover:text-gray-700 transition-colors relative hover:cursor-pointer rounded-full hover:bg-gray-100">
          <Bell class="h-5 w-5" />
          <span v-if="unreadCount > 0" class="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </DrawerTrigger>
      <NotificationsContent />
    </Drawer>

    <!-- User Menu -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
          <Avatar class="h-8 w-8 rounded-full border border-gray-200">
            <AvatarImage :src="user?.imageUrl || ''" :alt="user?.fullName || ''" />
            <AvatarFallback class="rounded-full bg-slate-100 text-slate-600">
              <User class="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <ChevronsUpDown class="ml-auto size-4 text-gray-400 hidden md:block" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="w-56 rounded-lg"
        side="bottom"
        align="end"
        :side-offset="4"
      >
        <DropdownMenuLabel class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar class="h-8 w-8 rounded-full">
              <AvatarImage :src="user?.imageUrl || ''" :alt="user?.fullName || ''" />
              <AvatarFallback class="rounded-full bg-slate-100 text-slate-600">
                 <User class="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ user?.fullName || 'Usuario' }}</span>
              <span class="truncate text-xs text-muted-foreground">{{ user?.primaryEmailAddress?.emailAddress || '' }}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="isPreferencesOpen = true" class="cursor-pointer">
          <Settings class="mr-2 h-4 w-4" />
          Preferencias
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="handleLogout" class="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut class="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <!-- Preferences Drawer -->
    <Drawer v-model:open="isPreferencesOpen">
      <PreferencesDrawer />
    </Drawer>
  </div>
</template>
