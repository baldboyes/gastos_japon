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
        
        <!-- Sudadera -->
        <div class="group border border-slate-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div class="aspect-square bg-slate-50 rounded-xl mb-4 overflow-hidden relative">
            <img src="/sudadera.jpg" alt="Sudadera Jizou" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <div class="flex flex-col flex-grow justify-between">
            <div class="text-left">
              <h3 class="font-semibold text-lg text-slate-900">{{ $t('shop_page.products.hoodie.name') }}</h3>
              <p class="text-slate-500 text-sm mb-4">{{ $t('shop_page.products.hoodie.desc') }}</p>
            </div>
            <div class="flex items-center justify-between mt-auto">
              <span class="font-bold text-slate-900">45.00 €</span>
              <button class="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                {{ $t('shop_page.products.hoodie.add') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Gorra -->
        <div class="group border border-slate-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div class="aspect-square bg-slate-50 rounded-xl mb-4 overflow-hidden relative">
            <img src="/gorra.jpg" alt="Gorra Jizou" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>

          <div class="flex flex-col flex-grow justify-between">
            <div class="text-left">
              <h3 class="font-semibold text-lg text-slate-900">{{ $t('shop_page.products.cap.name') }}</h3>
              <p class="text-slate-500 text-sm mb-4">{{ $t('shop_page.products.cap.desc') }}</p>
            </div>
            <div class="flex items-center justify-between mt-auto">
              <span class="font-bold text-slate-900">20.00 €</span>
              <button class="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                {{ $t('shop_page.products.cap.add') }}
              </button>
            </div>
          </div>

        </div>

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
    title: t('shop_page.meta.title'),
    meta: [
      { name: 'description', content: t('shop_page.meta.description') }
    ]
  })
</script>
