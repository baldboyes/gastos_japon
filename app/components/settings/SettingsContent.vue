<template>
  <DrawerContent :class="styles.content()">
    <DrawerHeader :class="styles.header()">
      <div :class="styles.headerRow()">
        <DrawerTitle>{{ t('settings.trip_settings_drawer.title') }}</DrawerTitle>
      </div>
    </DrawerHeader>
    <ScrollArea :class="styles.scrollArea()">
      <div :class="styles.body()">
        <div :class="styles.section()">
          <TripCurrencySetting />
          <TripDailyBudgetSetting />
          <TripSettingsVersion />
        </div>
      </div>
    </ScrollArea>
  </DrawerContent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { tv } from 'tailwind-variants'
import { DrawerContent, DrawerHeader, DrawerTitle } from '~/components/ui/drawer'
import { ScrollArea } from '~/components/ui/scroll-area'
import TripCurrencySetting from '~/components/settings/TripCurrencySetting.vue'
import TripDailyBudgetSetting from '~/components/settings/TripDailyBudgetSetting.vue'
import TripSettingsVersion from '~/components/settings/TripSettingsVersion.vue'
import { useI18n } from '#imports'

const { t } = useI18n()

const styles = computed(() => tripSettingsDrawer())

const tripSettingsDrawer = tv({
  slots: {
    content: 'h-[90vh] flex flex-col fixed bottom-0 left-0 right-0 w-full mx-auto rounded-xl pl-4',
    header: 'w-full max-w-xl mx-auto px-0',
    headerRow: 'flex items-center justify-between mb-2',
    scrollArea: 'flex-1 h-[calc(90vh-180px)] px-0 pb-0',
    body: 'max-w-xl mx-auto flex gap-16 flex-col lg:flex-row pr-4 pb-8',
    section: 'space-y-6 w-full'
  }
})
</script>
