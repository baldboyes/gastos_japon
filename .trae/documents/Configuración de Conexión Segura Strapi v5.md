# Plan de Implementación: Conexión Segura a Strapi v5

Este plan establece una conexión robusta y segura entre Nuxt (Server Side) y Strapi, asegurando que la API Key sensible nunca llegue al navegador del cliente.

## 1. Configuración de Seguridad (.env)
Actualizaremos las credenciales en el entorno para usar la nueva clave API proporcionada.
- [ ] Actualizar `.env` con la nueva `NUXT_STRAPI_KEY` y asegurar `NUXT_STRAPI_URL`.
- [ ] Configurar `nuxt.config.ts` para exponer estas variables solo en el `runtimeConfig` del servidor (privado), no en `public`.

## 2. Cliente Strapi Server-Side (`server/utils/strapi.ts`)
Crearemos una utilidad centralizada en el servidor de Nuxt para manejar toda la comunicación con Strapi.
- [ ] **Instancia Fetch Personalizada**: Utilizar `ofetch` nativo de Nitro.
- [ ] **Autenticación**: Inyectar header `Authorization: Bearer ...` automáticamente.
- [ ] **Resiliencia**:
    - **Timeout**: 10 segundos para evitar bloqueos.
    - **Reintentos**: 3 intentos automáticos con backoff exponencial para errores 5xx o de red.
- [ ] **Manejo de Errores**:
    - Interceptor para capturar errores HTTP y transformarlos en errores legibles (`createError`).
    - Logging detallado de fallos en el servidor (pero sanitizando tokens).

## 3. API Proxy Seguro (`server/api/strapi/[...].ts`)
En lugar de exponer la API de Strapi directamente, crearemos un "túnel" seguro a través de Nuxt.
- [ ] **Ruta Catch-All**: `/api/strapi/**` redirigirá internamente a `https://api.mevoyajapon.com/api/**`.
- [ ] **Validación**: Verificar que la respuesta de Strapi tenga la estructura `{ data, meta }` o `{ error }` esperada en v5.
- [ ] **CORS**: Al ser una llamada servidor-a-servidor (Nuxt -> Strapi), evitamos problemas de CORS en el navegador.

## 4. Verificación y Health Check
- [ ] Actualizar `/api/health` para probar la conexión real con Strapi (haciendo un ping o consulta ligera) y reportar el estado de la integración.

## 5. Ejemplo de Uso en Frontend
- [ ] Proveer un composable simple `useStrapi` para que los componentes puedan consumir datos fácilmente:
  ```typescript
  const { data } = await useFetch('/api/strapi/articles') // Llamada segura interna
  ```

Este enfoque garantiza el cumplimiento de todos los requisitos de seguridad y robustez solicitados.