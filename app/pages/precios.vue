<template>
  <div class="container mx-auto px-4 py-42">
      <div class="max-w-4xl mx-auto text-center space-y-8">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Planes y Precios
        </h1>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tu estilo de viaje.
        </p>
        
        <!-- Placeholder for future pricing tables -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <!-- Free Plan -->
          <div class="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm flex flex-col">
            <h3 class="text-xl font-bold mb-2">Tomodachi</h3>
            <div class="text-3xl font-bold mb-6">Gratis</div>
            <ul class="space-y-3 mb-8 flex-1 text-left">
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                1 viaje activo
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                Gestión de gastos
              </li>
            </ul>
            <button class="w-full py-2 rounded-lg bg-slate-100 font-medium text-slate-900 cursor-not-allowed opacity-70">Plan Actual</button>
          </div>

          <!-- Pro Plan Placeholder -->
          <div class="border-2 border-red-400 rounded-2xl p-8 bg-white shadow-md flex flex-col relative overflow-hidden scale-110 hover:scale-112 transition-transform duration-300">
            <div class="absolute top-4 right-4 bg-red-400 text-white text-xs px-2 py-1 rounded">Popular</div>
            <h3 class="text-xl font-bold mb-2">Nómada</h3>
            <div class="text-3xl font-bold mb-6">Próximamente</div>
            <ul class="space-y-3 mb-8 flex-1 text-left">
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                Viajes ilimitados
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                Colaboración en tiempo real
              </li>
            </ul>
            <button class="w-full py-2 rounded-lg bg-slate-900 text-white font-medium opacity-80 cursor-not-allowed">Muy pronto</button>
          </div>
          
           <!-- Team Plan Placeholder -->
           <div class="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm flex flex-col">
            <h3 class="text-xl font-bold mb-2">Agencia</h3>
            <div class="text-3xl font-bold mb-6">Próximamente</div>
            <ul class="space-y-3 mb-8 flex-1 text-left">
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                Marca blanca
              </li>
              <li class="flex items-center gap-2 text-sm text-slate-600">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                Soporte prioritario
              </li>
            </ul>
            <button class="w-full py-2 rounded-lg bg-slate-900 text-white font-medium opacity-80 cursor-not-allowed">Muy pronto</button>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Precios - Gastos Trae',
  meta: [
    { name: 'description', content: 'Planes y precios de Gastos Trae' }
  ]
})
</script>