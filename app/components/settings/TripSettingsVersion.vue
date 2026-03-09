<template>
  <div class="text-center text-sm text-neutral-400">
    <span>{{ t('settings.trip_settings_drawer.version.label') }}</span>
    <span class="font-medium"> 0.6.6</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports'

const { t } = useI18n()
</script>
