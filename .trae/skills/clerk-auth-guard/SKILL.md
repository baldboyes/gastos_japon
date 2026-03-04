---
name: "clerk-auth-guard"
description: "Implement secure authentication flows using @clerk/nuxt. Focuses on route protection, SSR session handling, and UI state management for jizou.io."
---

# Clerk Auth Guard

## Objectives
- Implement robust route protection using Nuxt Middleware and Clerk.
- Handle authentication states (loading, signed-in, signed-out) without Layout Shifts.
- Securely access Clerk JWT tokens for Directus API calls.
- Use official Clerk components for consistent Auth UI.

## Prerequisites
- Nuxt 4 with `@clerk/nuxt` module.
- Clerk Publishable Key and Secret Key in `.env`.
- Middleware enabled in `nuxt.config.ts`.

## Conventions
- **Server First:** Prefer Middleware for protecting private routes to avoid flashing unauthorized content.
- **Components:** Use `<SignedIn>`, `<SignedOut>`, and `<UserButton>` for header/UI logic.
- **Composables:** Use `useAuth()` for logic/tokens and `useUser()` for profile data.
- **Route Guarding:** Private pages should be handled via the `auth` middleware.

## Route Protection (Middleware)
The Agent should use the built-in Clerk middleware or custom page middleware.

```ts
// middleware/auth.global.ts (Optional: for global protection)
export default defineNuxtRouteMiddleware((to) => {
  const { isLoaded, userId } = useAuth()

  // Lista de rutas públicas
  const publicRoutes = ['/', '/login', '/register', '/about']
  
  if (isLoaded.value && !userId.value && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }
})
```

## UI State Management
Avoid Layout Shift by using the `isLoaded` state and Clerk components, and maintain UI consistency using Tailwind Variants.

```vue
<script setup lang="ts">
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nuxt'
import { tv } from 'tailwind-variants'
import { cn } from '~/utils/cn'

const authContainerVariants = tv({
  base: 'flex items-center gap-4 px-2 py-1 rounded-lg border border-transparent transition-all',
  variants: {
    status: {
      loading: 'bg-slate-50 animate-pulse',
      ready: 'bg-white'
    }
  }
})
</script>

<template>
  <div class="flex items-center gap-4">
    <client-only>
      <div :class="authContainerVariants({ status: 'ready' })">
        <SignedIn>
          <UserButton after-sign-out-url="/" />
        </SignedIn>
        
        <SignedOut>
          <SignInButton mode="modal">
            <button class="btn-primary">
              {{ $t('auth.login_button') }}
            </button>
          </SignInButton>
        </SignedOut>
      </div>

      <template #fallback>
        <div :class="authContainerVariants({ status: 'loading' })">
          <div class="h-8 w-8 rounded-full bg-slate-200" />
          <div class="h-4 w-20 rounded bg-slate-200" />
        </div>
      </template>
    </client-only>
  </div>
</template>
```

## JWT for API Requests (Directus Integration)
How to get the token to talk to the backend.

```ts
// logic inside a component or composable
const { getToken } = useAuth()

const fetchData = async () => {
  // Obtenemos el token con el template configurado en el dashboard de Clerk
  const token = await getToken({ template: 'directus' })
  
  if (token) {
    // Usar la skill de Directus para enviar la petición
    await useDirectusSubmit('collection_name', { data: '...' })
  }
}
```

Acceptance Criteria
Use Nuxt Middleware for page-level access control.

- Wrap auth-dependent UI in `<client-only>` to prevent SSR hydration mismatches.
- Ensure the `isLoaded` property is checked before redirecting or showing content.
- Never expose sensitive Clerk Secret Keys on the client side.