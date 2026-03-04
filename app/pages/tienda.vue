<template>
  <div class="container mx-auto px-4 py-42">
    <div class="max-w-4xl mx-auto text-center space-y-8">
      <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
        {{ $t('shop_page.title') }}
      </h1>
      <p class="text-lg text-slate-600 max-w-2xl mx-auto">
        {{ $t('shop_page.subtitle') }}
      </p>
      
      <!-- Productos -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-8 mt-12">
        <JizouProductCard
          :title="String($t('shop_page.products.hoodie.name'))"
          price="45.00 €"
          image-url="/sudadera.jpg"
          variant="default"
          @add="onAddHoodie"
        />

        <JizouProductCard
          :title="String($t('shop_page.products.cap.name'))"
          price="20.00 €"
          image-url="/gorra.jpg"
          variant="promotional"
          @add="onAddCap"
        />

        <!-- Placeholder -->
        <div class="border border-slate-200 border-dashed rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
          <span class="text-sm font-medium">{{ $t('shop_page.products.placeholder') }}</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  import JizouProductCard from '~/components/shop/JizouProductCard.vue'

  definePageMeta({
    name: 'tienda'
  })

  const { $defineI18nRoute } = useNuxtApp()

  $defineI18nRoute({
    localeRoutes: {
      es: '/tienda',
      en: '/shop',
      ja: '/shop',
    },
  })

  useHead({
    title: String(t('shop_page.meta.title')),
    meta: [
      { name: 'description', content: String(t('shop_page.meta.description')) }
    ]
  })

  function onAddHoodie() {
    // implementar lógica de carrito
  }
  function onAddCap() {
    // implementar lógica de carrito
  }
</script>
