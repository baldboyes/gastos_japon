<script setup lang="ts">
  import { useI18n } from '#imports'
  
  const currentYear = new Date().getFullYear()
  const { $localeRoute } = useI18n()
</script>

<template>
  <footer class="py-20 lg:py-28 bg-red-400 text-white">
    <div class="container mx-auto px-4">

      <div class="flex flex-col-reverse lg:flex-row items-start justify-between gap-20 lg:gap-12 text-base transition-all duration-300">
        <div class="flex flex-col gap-8 text-left w-full max-w-[650px]">
          <div class="font-semibold block relative">
            jizou.io
          </div>
          <div>
            {{ $t('landing.hero.subtitle') }}
          </div>
          <div>
            jizou.io &copy; {{ currentYear }}
          </div>
          <div class="flex gap-6">
            <NuxtLink to="https://www.instagram.com/jizou.io/" :title="String($t('footer.social.instagram'))">
              <svg fill="none" height="20" viewBox="0 0 48 48" width="20" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><clipPath id="a"><path d="m0 0h48v48h-48z"/></clipPath><g clip-path="url(#a)" fill="#fff"><path d="m24 4.32187c6.4125 0 7.1719.02813 9.6938.14063 2.3437.10312 3.6093.49688 4.4531.825 1.1156.43125 1.9219.95625 2.7562 1.79062.8438.84376 1.3594 1.64063 1.7907 2.75626.3281.84372.7218 2.11872.825 4.45312.1125 2.5312.1406 3.2906.1406 9.6938 0 6.4125-.0281 7.1718-.1406 9.6937-.1032 2.3438-.4969 3.6094-.825 4.4531-.4313 1.1157-.9563 1.9219-1.7907 2.7563-.8437.8437-1.6406 1.3594-2.7562 1.7906-.8438.3281-2.1188.7219-4.4531.825-2.5313.1125-3.2907.1406-9.6938.1406-6.4125 0-7.1719-.0281-9.6937-.1406-2.3438-.1031-3.6094-.4969-4.45317-.825-1.11563-.4312-1.92188-.9562-2.75625-1.7906-.84375-.8438-1.35938-1.6406-1.79063-2.7563-.32812-.8437-.72187-2.1187-.825-4.4531-.1125-2.5312-.14062-3.2906-.14062-9.6937 0-6.4125.02812-7.1719.14062-9.6938.10313-2.3438.49688-3.6094.825-4.45312.43125-1.11563.95625-1.92188 1.79063-2.75626.84375-.84374 1.64062-1.35937 2.75625-1.79062.84377-.32812 2.11877-.72188 4.45317-.825 2.5218-.1125 3.2812-.14063 9.6937-.14063zm0-4.32187c-6.5156 0-7.3312.028125-9.8906.140625-2.55.1125-4.30315.525-5.8219 1.115625-1.58438.61875-2.925 1.43437-4.25625 2.775-1.34062 1.33125-2.15625 2.67188-2.775 4.24688-.590625 1.52812-1.003125 3.27187-1.115625 5.82187-.1125 2.5687-.140625 3.3844-.140625 9.9s.028125 7.3312.140625 9.8906c.1125 2.55.525 4.3032 1.115625 5.8219.61875 1.5844 1.43438 2.925 2.775 4.2563 1.33125 1.3312 2.67188 2.1562 4.24688 2.7656 1.52812.5906 3.27187 1.0031 5.82187 1.1156 2.5594.1125 3.375.1406 9.8906.1406 6.5157 0 7.3313-.0281 9.8907-.1406 2.55-.1125 4.3031-.525 5.8218-1.1156 1.575-.6094 2.9157-1.4344 4.2469-2.7656 1.3312-1.3313 2.1563-2.6719 2.7656-4.2469.5907-1.5281 1.0032-3.2719 1.1157-5.8219.1125-2.5594.1406-3.375.1406-9.8906s-.0281-7.3313-.1406-9.8906c-.1125-2.55-.525-4.30317-1.1157-5.82192-.5906-1.59376-1.4062-2.93438-2.7468-4.26563-1.3313-1.33125-2.6719-2.15625-4.2469-2.76563-1.5281-.59062-3.2719-1.00312-5.8219-1.11562-2.5687-.121875-3.3844-.15-9.9-.15z"/><path d="m24 11.6719c-6.8062 0-12.3281 5.5219-12.3281 12.3281s5.5219 12.3281 12.3281 12.3281 12.3281-5.5219 12.3281-12.3281-5.5219-12.3281-12.3281-12.3281zm0 20.325c-4.4156 0-7.9969-3.5813-7.9969-7.9969s3.5813-7.9969 7.9969-7.9969 7.9969 3.5813 7.9969 7.9969-3.5813 7.9969-7.9969 7.9969z"/><path d="m39.6937 11.1843c0 1.5937-1.2937 2.8781-2.8781 2.8781-1.5937 0-2.8781-1.2937-2.8781-2.8781 0-1.59377 1.2938-2.87815 2.8781-2.87815 1.5844 0 2.8781 1.29375 2.8781 2.87815z"/></g></svg>
            </NuxtLink>
            <NuxtLink to="https://x.com/jizouio" :title="String($t('footer.social.x'))">
              <svg fill="none" height="20" viewBox="0 0 48 48" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m36.6526 3.8078h6.7469l-14.7401 16.847 17.3406 22.9249h-13.5775l-10.6344-13.9038-12.16821 13.9038h-6.75103l15.76604-18.0197-16.6349-21.7522h13.9222l9.6126 12.7087zm-2.368 35.7336h3.7386l-24.1324-31.90734h-4.01188z" fill="#fff"/></svg>
            </NuxtLink>
            <NuxtLink to="https://www.tiktok.com/@jizou.io" :title="String($t('footer.social.tiktok'))">
              <svg fill="none" height="20" viewBox="0 0 48 48" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m34.1451 0h-8.0895v32.6956c0 3.8957-3.1112 7.0957-6.9831 7.0957-3.8718 0-6.9831-3.2-6.9831-7.0957 0-3.826 3.0421-6.9565 6.7757-7.0956v-8.2087c-8.2277.1391-14.8651 6.887-14.8651 15.3043 0 8.4871 6.7757 15.3044 15.1417 15.3044 8.3658 0 15.1416-6.8869 15.1416-15.3044v-16.7652c3.0422 2.2261 6.7757 3.5479 10.7167 3.6175v-8.2088c-6.0843-.2087-10.8549-5.21737-10.8549-11.3391z" fill="#fff"/></svg>
            </NuxtLink>
          </div>
        </div>
        <div class="flex gap-6 w-fit">
          <div class="flex flex-col gap-8 w-full min-w-[150px]">
            <div class="font-semibold block relative">
              {{ $t('footer.sections.product') }}
            </div>
            <div class="flex flex-col gap-2">
              <NuxtLink :to="$localeRoute({ name: 'precios' })">
                {{ $t('header.pricing') }}
              </NuxtLink>
              <NuxtLink :to="$localeRoute({ name: 'tienda' })">
                {{ $t('header.shop') }}
              </NuxtLink>
            </div>
          </div>
          <div class="flex flex-col gap-8 w-full min-w-[150px]">
            <div class="font-semibold block relative">
              {{ $t('footer.sections.resources') }}
            </div>
            <div class="flex flex-col gap-2">
              <NuxtLink :to="$localeRoute({ name: 'terminos' })">
                {{ $t('footer.links.terms') }}
              </NuxtLink>
              <NuxtLink :to="$localeRoute({ name: 'privacidad' })">
                {{ $t('footer.links.privacy') }}
              </NuxtLink>
            </div>
          </div>
          <div class="flex flex-col gap-8 w-full min-w-[150px]">
            <div class="font-semibold block relative">
              {{ $t('footer.sections.company') }}
            </div>
            <div class="flex flex-col gap-2">
              <NuxtLink :to="$localeRoute({ name: 'privacidad' })">
                {{ $t('footer.links.privacy') }}
              </NuxtLink>
              <NuxtLink :to="$localeRoute({ name: 'terminos' })">
                {{ $t('footer.links.terms') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

    </div>
  </footer>
</template>
