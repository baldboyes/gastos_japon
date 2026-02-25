<template>
  <div class="h-screen w-full flex flex-col items-center justify-center" v-if="!isLoaded">
    <!-- Spinner o Skeleton de carga inicial mientras Clerk verifica -->
    <div class="animate-pulse flex flex-col items-center gap-4">
       <div class="h-12 w-12 rounded-full bg-slate-200"></div>
       <div class="h-4 w-32 rounded bg-slate-200"></div>
    </div>
  </div>
  
  <div v-else>
    <div v-if="!userId">
      <!-- Hero Section -->
      <section class="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <!-- Background Effects -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-200/50 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50"></div>
        <div class="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-200/50 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div class="container mx-auto px-4 text-center max-w-4xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white  text-xs font-medium text-purple-600 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-sm">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Nueva versión disponible
          </div>
          
          <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 text-slate-900">
            Tu viaje completo, <br class="hidden md:block" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">perfectamente organizado</span>
          </h1>
          
          <p class="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Inspirado en Jizō, protector de los viajeros. Organiza vuelos, alojamientos y reservas. Durante tu aventura, lleva tu itinerario y gastos bajo control.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button as-child size="lg" class="h-12 px-8 text-base bg-slate-950 text-white hover:bg-slate-800 w-full sm:w-auto shadow-lg shadow-slate-950/20">
              <NuxtLink to="/trips">
                Ver mis viajes
              </NuxtLink>
            </Button>
            <Button as-child variant="outline" size="lg" class="h-12 px-8 text-base border-gray-200 text-slate-700 hover:bg-gray-100 hover:text-slate-900 w-full sm:w-auto bg-white">
              <NuxtLink to="/trips">
                Explorar demo
              </NuxtLink>
            </Button>
          </div>

          <!-- Dashboard Preview -->
          <div class="mt-20 relative rounded-3xl overflow-hidden border border-input shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 transition-all">
            <div class="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent z-10"></div>
            <!-- Placeholder for app screenshot/mockup -->
            <div class="aspect-video w-full rounded-lg bg-gray-100 overflow-hidden relative group border border-gray-100">
                <div class="absolute inset-0 flex items-center justify-center">
                  <img src="/download.png" alt="Dashboard Preview" class="w-full h-full object-cover object-top" />
                </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Proof / Quote -->
      <section class="py-24 border-y border-gray-200 bg-white">
        <div class="container mx-auto px-4 text-center">
          <div class="max-w-3xl mx-auto">
            <Quote class="w-12 h-12 text-purple-200 mx-auto mb-6" />
            <blockquote class="text-2xl md:text-3xl font-medium leading-relaxed mb-8 text-slate-900">
              "Sentimos que teníamos un ángel de la guarda para nuestro viaje. <strong>jizou.io</strong> nos dio la paz mental para organizar todo y gastar sin miedo en Japón."
            </blockquote>
            <div class="flex items-center justify-center gap-4">
              <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 shadow-md"></div>
              <div class="text-left">
                <div class="font-bold text-slate-900">Ana & Carlos</div>
                <div class="text-sm text-slate-500">Viajeros Frecuentes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="py-32 relative bg-gray-50">
        <div class="container mx-auto px-4">
            <div class="text-center max-w-2xl mx-auto mb-20">
              <h2 class="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Tu viaje, bajo control total</h2>
              <p class="text-lg text-slate-600">
                  Desde la planificación hasta el último gasto. Herramientas diseñadas para que solo te preocupes de disfrutar.
              </p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Feature 1 -->
              <div class="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300">
                  <div class="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                    <Plane class="w-6 h-6" />
                  </div>
                  <h3 class="text-xl font-bold mb-3 text-slate-900">Gestión Integral</h3>
                  <p class="text-slate-600 leading-relaxed">
                    Vuelos, alojamientos, seguros y reservas. Centraliza toda la logística de tu viaje en un solo lugar seguro y accesible.
                  </p>
              </div>

              <!-- Feature 2 -->
              <div class="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300">
                  <div class="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                    <CalendarCheck class="w-6 h-6" />
                  </div>
                  <h3 class="text-xl font-bold mb-3 text-slate-900">Itinerario al Día</h3>
                  <p class="text-slate-600 leading-relaxed">
                    Visualiza tu plan día a día. Entradas, actividades y tareas pendientes siempre a mano para no perderte nada.
                  </p>
              </div>

              <!-- Feature 3 -->
              <div class="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300">
                  <div class="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center mb-6 text-orange-600 group-hover:scale-110 transition-transform">
                    <Banknote class="w-6 h-6" />
                  </div>
                  <h3 class="text-xl font-bold mb-3 text-slate-900">Control Financiero</h3>
                  <p class="text-slate-600 leading-relaxed">
                    Vigila tu presupuesto diario. Conversión automática de divisas para saber siempre cuánto gastas realmente.
                  </p>
              </div>

              <!-- Feature 4 -->
              <div class="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 lg:col-span-2">
                  <div class="h-12 w-12 rounded-lg bg-pink-50 flex items-center justify-center mb-6 text-pink-600 group-hover:scale-110 transition-transform">
                    <Wallet class="w-6 h-6" />
                  </div>
                  <h3 class="text-xl font-bold mb-3 text-slate-900">Cartera de Viaje</h3>
                  <p class="text-slate-600 leading-relaxed">
                    Gestiona efectivo y tarjetas sin estrés. Registra cambios de divisa, comisiones y saldo disponible en cada medio de pago para evitar sorpresas.
                  </p>
              </div>
              
              <!-- Feature 5 -->
              <div class="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-yellow-200 hover:shadow-xl hover:shadow-yellow-100/50 transition-all duration-300">
                  <div class="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center mb-6 text-yellow-600 group-hover:scale-110 transition-transform">
                    <Zap class="w-6 h-6" />
                  </div>
                  <h3 class="text-xl font-bold mb-3 text-slate-900">Siempre Contigo</h3>
                  <p class="text-slate-600 leading-relaxed">
                    Tu guardián no descansa, incluso sin internet. Consulta tu itinerario y añade gastos en cualquier lugar remoto.
                  </p>
              </div>
            </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="py-24 border-t border-gray-200 bg-white">
        <div class="container mx-auto px-4 max-w-3xl">
            <h2 class="text-3xl font-bold mb-12 text-center text-slate-900">Preguntas Frecuentes</h2>
            
            <div class="space-y-4">
              <div v-for="(faq, index) in faqs" :key="index" class="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  <button @click="faq.open = !faq.open" class="flex items-center justify-between w-full p-6 text-left hover:bg-gray-100 transition-colors">
                    <span class="font-medium text-lg text-slate-900">{{ faq.question }}</span>
                    <ChevronDown class="w-5 h-5 text-slate-500 transition-transform duration-300" :class="{ 'rotate-180': faq.open }" />
                  </button>
                  <div v-show="faq.open" class="px-6 pb-6 text-slate-600 animate-in slide-in-from-top-2 duration-200 border-t border-gray-100">
                    {{ faq.answer }}
                  </div>
              </div>
            </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { Button } from '@/components/ui/button'
import { Banknote, Quote, Wallet, Zap, ChevronDown, Plane, CalendarCheck } from 'lucide-vue-next'
import { useAuth } from '#imports'

const { userId, isLoaded } = useAuth()

watchEffect(() => {
  if (isLoaded.value && userId.value) {
    navigateTo('/trips')
  }
})

const faqs = ref([
  {
    question: "¿Es gratis usar jizou.io?",
    answer: "Sí, es un proyecto personal de código abierto diseñado para ayudar a viajeros a gestionar su presupuesto sin costes ocultos.",
    open: false
  },
  {
    question: "¿Funciona sin conexión a internet?",
    answer: "Absolutamente. La aplicación está diseñada como una PWA (Progressive Web App) que almacena tus datos localmente y los sincroniza cuando recuperas la conexión.",
    open: false
  },
  {
    question: "¿Puedo exportar mis datos?",
    answer: "Tus datos son tuyos. Próximamente habilitaremos la exportación a CSV y PDF para que puedas llevar tu contabilidad donde quieras.",
    open: false
  },
  {
    question: "¿Qué divisas soporta?",
    answer: "Soporta cualquier divisa del mundo, pero está especialmente optimizado para viajes a Japón con conversión YEN/EUR en tiempo real.",
    open: false
  }
])
</script>

<style>
/* Smooth scrolling for anchor links */
html {
  scroll-behavior: smooth;
}
</style>