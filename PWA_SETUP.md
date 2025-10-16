# Configuración PWA - Gastos Japón

## ✅ Cambios Realizados

### 1. **Configuración PWA Mejorada** (`nuxt.config.ts`)
- ✅ `includeAssets`: Assets estáticos que se incluirán en el cache
- ✅ `manifest.lang`: Idioma español
- ✅ `manifest.categories`: Categorías de la app
- ✅ `manifest.icons`: Iconos con propósito `any` y `maskable` para mejor compatibilidad
- ✅ `workbox.cleanupOutdatedCaches`: Limpia caches antiguos automáticamente
- ✅ `workbox.globPatterns`: Archivos adicionales para cache
- ✅ `workbox.runtimeCaching`: Cache para Mapbox y OpenStreetMap
- ✅ `client.installPrompt`: Habilita el prompt de instalación
- ✅ `client.periodicSyncForUpdates`: Revisa actualizaciones cada hora

### 2. **Meta Tags PWA** (`app/app.vue`)
- ✅ Meta tags para iOS (Apple Mobile Web App)
- ✅ Theme color
- ✅ Viewport optimizado para móvil
- ✅ Favicon y Apple Touch Icon

### 3. **Plugin PWA** (`app/plugins/pwa.client.ts`)
- ✅ Logging para debugging (solo en desarrollo)
- ✅ Listeners para eventos de instalación
- ✅ Verificación del manifest

## 🧪 Cómo Probar la PWA

### Opción 1: Desarrollo Local

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre la app en Chrome/Edge:**
   - Ve a `http://localhost:3000`
   - Abre DevTools (F12)
   - Ve a la pestaña "Application" → "Manifest"
   - Deberías ver el manifest con todos los datos
   - Ve a "Service Workers" y verifica que esté registrado

3. **Probar instalación en desarrollo:**
   - En DevTools → Application → Manifest
   - Click en "Install app" o usa el ícono en la barra de direcciones

### Opción 2: Build de Producción

1. **Genera el build:**
   ```bash
   npm run build
   ```

2. **Preview en local:**
   ```bash
   npm run preview
   ```

3. **Abre en navegador:**
   - Ve a `http://localhost:3000` (o el puerto que indique)
   - Deberías ver el prompt de instalación

### Opción 3: Deploy (Recomendado para pruebas reales)

1. **Deploy en Vercel/Netlify/etc:**
   - El PWA solo funciona completamente con HTTPS
   - Servicios como Vercel/Netlify proveen HTTPS automáticamente

2. **Prueba en móvil:**
   - Abre la URL en Chrome/Safari móvil
   - Verás el banner "Agregar a pantalla de inicio"

## 🔍 Verificar que Funciona

### Checklist PWA:

- [ ] El manifest se genera en `.output/public/manifest.webmanifest`
- [ ] El Service Worker se registra correctamente
- [ ] Los iconos se ven en el manifest
- [ ] Se puede instalar la app
- [ ] Funciona offline (después de cargar una vez)
- [ ] Los datos persisten al recargar

### Herramientas de Verificación:

1. **Lighthouse (Chrome DevTools):**
   ```
   DevTools → Lighthouse → Progressive Web App
   ```
   Debería dar score alto (>90)

2. **PWA Builder:**
   - Ve a https://www.pwabuilder.com/
   - Ingresa tu URL (después de deploy)
   - Revisa el análisis

3. **Comando manual para verificar manifest:**
   ```bash
   # Después de build
   cat .output/public/manifest.webmanifest
   ```

## 📱 Funcionalidades PWA Incluidas

✅ **Instalable**: Se puede instalar como app nativa
✅ **Offline**: Funciona sin conexión (después de primera carga)
✅ **Auto-actualización**: Detecta y aplica actualizaciones automáticamente
✅ **Cache inteligente**: 
  - Cache de assets estáticos
  - Cache de API de geocoding (7 días)
  - Cache de mapas de Mapbox (30 días)
✅ **Optimizado para móvil**: Full-screen standalone
✅ **Soporte iOS**: Apple Touch Icons y meta tags

## 🐛 Troubleshooting

### El manifest no se genera:
```bash
# Limpia y reconstruye
rm -rf .nuxt .output node_modules/.cache
npm run build
```

### Service Worker no se registra:
- Verifica que estés usando HTTPS (o localhost)
- Revisa la consola por errores
- Verifica que `@vite-pwa/nuxt` esté instalado:
  ```bash
  npm list @vite-pwa/nuxt
  ```

### Los cambios no se reflejan:
```bash
# Limpia el cache del navegador
# Chrome: DevTools → Application → Clear storage → Clear site data
```

## 📦 Archivos Generados (después de build)

```
.output/public/
├── manifest.webmanifest  ← Manifest de PWA
├── sw.js                 ← Service Worker
├── workbox-*.js          ← Workbox runtime
└── assets/               ← Assets cacheados
```

## 🚀 Próximos Pasos

1. Haz un build de producción
2. Verifica el manifest
3. Prueba la instalación
4. Deploy en producción
5. Prueba en dispositivo móvil real

¡La PWA ahora debería funcionar correctamente! 🎉

