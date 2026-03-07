<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { SignedIn, SignedOut, SignInButton } from '@clerk/vue'
  import { Button } from '~/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
  import { useDirectusRepo } from '~/composables/useDirectusRepo'

  definePageMeta({
    layout: 'default'
  })

  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const { getClient } = useDirectusRepo()

  const tripId = computed(() => Number(route.params.id))
  const inviteId = computed(() => Number(route.query.inviteId))
  const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : null))
  const isJoining = ref(false)
  const joinError = ref<string | null>(null)

  const joinRedirectPath = computed(() => `/trips/${tripId.value}`)

  const handleJoin = async () => {
    joinError.value = null
    isJoining.value = true
    try {
      await getClient()
      if (token.value) {
        await $fetch('/api/trips/claim-invite', {
          method: 'POST',
          body: { token: token.value }
        })
      } else if (Number.isFinite(inviteId.value) && inviteId.value > 0) {
        await $fetch('/api/trips/claim-invite', {
          method: 'POST',
          body: { inviteId: inviteId.value }
        })
      }
      await router.push(joinRedirectPath.value)
    } catch (e: any) {
      joinError.value = e?.message || String(e)
    } finally {
      isJoining.value = false
    }
  }

  onMounted(() => {
    if (!Number.isFinite(tripId.value) || tripId.value <= 0) {
      router.replace('/')
      return
    }
  })
</script>

<template>
  <div class="w-full max-w-xl mx-auto mt-32 p-4 md:p-8">
    <Card>
      <CardHeader>
        <CardTitle>{{ $t('trip_join_page.title') }}</CardTitle>
        <CardDescription>
          {{ $t('trip_join_page.description', { tripId: String(tripId) }) }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <SignedOut>
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">{{ $t('trip_join_page.signed_out') }}</p>
            <SignInButton mode="modal" :force-redirect-url="route.fullPath">
              <Button class="w-full">{{ $t('trip_join_page.sign_in_cta') }}</Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">{{ $t('trip_join_page.signed_in') }}</p>
            <Button class="w-full" :disabled="isJoining || !!joinError" @click="handleJoin">
              {{ isJoining ? $t('trip_join_page.joining') : $t('trip_join_page.join_cta') }}
            </Button>
          </div>
        </SignedIn>

        <p v-if="joinError" class="text-sm text-red-600 break-words">
          {{ joinError }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
