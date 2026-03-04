---
name: "jizou-directus-integration"
description: "Build type-safe Nuxt 4 composables with @directus/sdk and Clerk Auth. Invoke when integrating Directus data, queries, assets, and analytics."
---

# Jizou Directus Integration

## Objectives
- Build Nuxt 4 composables that integrate Directus using @directus/sdk
- Enforce end-to-end TypeScript type-safety via a typed Directus Schema
- Handle Directus Assets (images) and Data Aggregations (for charts)
- Integrate Clerk JWT for user-authenticated requests in mutations

## Prerequisites
- Nuxt 4 with TypeScript enabled
- @directus/sdk and @clerk/nuxt installed
- Runtime config values for Directus URL and token

## Conventions
- Place composables under `composables/` with `useDirectus*` naming
- Keep requests typed by declaring a `Schema` matching Directus collections
- Use `useAsyncData` for SSR-friendly fetching and caching
- Use `useDirectusUrl` for all asset transformations (width, height, quality)

## Define Schema
Create a global `Schema` type representing Directus collections and fields.

```ts
// types/directus.ts
export type Schema = {
  articles: {
    id: string
    title: string
    slug: string
    image: string
    status: string
    created_at: string
    updated_at: string
    category: string | null
    author: string | null
  }
}
```

## Client Composable
Create a client that supports both static tokens for SSR and dynamic Clerk tokens for user actions.

```ts
// composables/useDirectusClient.ts
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { Schema } from '~/types/directus'

export function useDirectusClient(userToken?: string) {
  const config = useRuntimeConfig()
  const base = String(config.public.directusUrl || '')
  const client = createDirectus<Schema>(base).with(rest())
  
  if (userToken) {
    return client.with(staticToken(userToken))
  }
  
  const token = String(config.public.directusToken || '')
  if (token) client.with(staticToken(token))
  return client
}
```

## Fetch Multiple Items
Typed list retrieval with filtering, searching, field selection, sort, pagination.

```ts
// composables/useDirectusItems.ts
import { readItems } from '@directus/sdk'

export function useDirectusItems<C extends keyof Schema>(
  collection: C,
  params?: {
    filter?: Record<string, unknown>
    search?: string
    fields?: string[]
    sort?: string[] | string
    page?: number
    limit?: number
  },
  opts?: any
) {
  const client = useDirectusClient()
  const key = `items:${String(collection)}:${JSON.stringify(params || {})}`
  return useAsyncData(key, () => client.request(readItems(String(collection), params as any)), opts)
}
```

## Data Aggregations
Fetch analytics and metrics for Chart.js.

```ts
// composables/useDirectusAggregate.ts
import { readAggregation } from '@directus/sdk'

export function useDirectusAggregate<C extends keyof Schema>(
  collection: C,
  params: { aggregate: Record<string, string[]>, groupBy?: string[], filter?: any }
) {
  const client = useDirectusClient()
  const key = `agg:${String(collection)}:${JSON.stringify(params)}`
  return useAsyncData(key, () => client.request(readAggregation(String(collection), params as any)))
}
```

## Asset Handling
Helper to generate optimized image URLs using Directus (Sharp).

```ts
// composables/useDirectusAssets.ts
export function useDirectusUrl(fileId: string, options?: { width?: number, height?: number, quality?: number }) {
  const config = useRuntimeConfig()
  if (!fileId) return ''
  let url = `${config.public.directusUrl}/assets/${fileId}`
  if (options) {
    const params = new URLSearchParams(options as any)
    url += `?${params.toString()}`
  }
  return url
}
```

## Authenticated Mutations
Typed create, update, delete helpers using Clerk identity.

```ts
// composables/useDirectusMutations.ts
import { createItem, updateItem, deleteItem } from '@directus/sdk'

export async function useDirectusSubmit<C extends keyof Schema>(collection: C, payload: Partial<Schema[C]>) {
  const { getToken } = useAuth()
  const token = await getToken({ template: 'directus' })
  const client = useDirectusClient(token || undefined)
  return client.request(createItem(String(collection), payload as any))
}
```

## SSR and Caching
- Use stable `useAsyncData` keys derived from collection and params
- Prefer server-side fetching for lists; hydrate on client when necessary

## Error Handling
- Surface user-friendly errors; avoid leaking tokens or URLs
- Wrap mutations in try/catch and propagate typed failures

## Acceptance Criteria
- Composables compile with TypeScript and infer collection types from Schema
- Images are rendered via `useDirectusUrl` for optimization
- Metrics for charts use `useDirectusAggregate`
- Mutations attempt to use `useAuth` from Clerk to obtain a JWT

## Example Usage
```ts
// Fetching with search
const articles = await useDirectusItems('articles', { search: 'nuxt', limit: 5 })

// Generating an optimized image URL
const thumb = useDirectusUrl(article.image, { width: 200, height: 200, quality: 80 })

// Aggregating for a Chart.js component
const { data: stats } = await useDirectusAggregate('articles', {
  aggregate: { count: ['*'] },
  groupBy: ['category']
})
```






---
name: "jizou-directus-integration"
description: "Build type-safe Nuxt 4 composables with @directus/sdk. Invoke when integrating Directus data, queries, filters, and search."
---

# Jizou Directus Integration

## Objectives
- Build Nuxt 4 composables that integrate Directus using @directus/sdk
- Enforce end-to-end TypeScript type-safety via a typed Directus Schema
- Use the latest SDK syntax for filtering, searching, sorting, pagination, and field selection

## Prerequisites
- Nuxt 4 with TypeScript enabled
- @directus/sdk installed
- Runtime config values for Directus URL and token

## Conventions
- Place composables under `composables/` with `use*` naming
- Keep requests typed by declaring a `Schema` matching Directus collections
- Use `useAsyncData` for SSR-friendly fetching and caching
- Do not log secrets; read tokens from runtime config

## Define Schema
Create a global `Schema` type representing Directus collections and fields.

```ts
// types/directus.ts
export type Schema = {
  articles: {
    id: string
    title: string
    slug: string
    status: string
    created_at: string
    updated_at: string
    category: string | null
    author: string | null
  }
}
```

## Client Composable
Create a memoized client configured with REST and optional static token.

```ts
// composables/useDirectusClient.ts
import { createDirectus, rest, staticToken } from '@directus/sdk'
import type { Schema } from '~/types/directus'

let _client: ReturnType<typeof createDirectus<Schema>> | null = null

export function useDirectusClient() {
  const config = useRuntimeConfig()
  if (_client) return _client
  const base = String(config.public.directusUrl || '')
  const token = String(config.public.directusToken || '')
  const client = createDirectus<Schema>(base).with(rest())
  if (token) client.with(staticToken(token))
  _client = client
  return client
}
```

## Fetch Multiple Items
Typed list retrieval with filtering, searching, field selection, sort, pagination.

```ts
// composables/useDirectusItems.ts
import { readItems } from '@directus/sdk'
import type { Schema } from '~/types/directus'

export function useDirectusItems<C extends keyof Schema>(
  collection: C,
  params?: {
    filter?: Record<string, unknown>
    search?: string
    fields?: string[]
    sort?: string[] | string
    page?: number
    limit?: number
  },
  opts?: Parameters<typeof useAsyncData>[2]
) {
  const client = useDirectusClient()
  const key = `${String(collection)}:${JSON.stringify(params || {})}`
  return useAsyncData(key, () => client.request(readItems(String(collection), params as any)), opts)
}
```

## Fetch Single Item
Typed single item retrieval with optional query params.

```ts
// composables/useDirectusItem.ts
import { readItem } from '@directus/sdk'
import type { Schema } from '~/types/directus'

export function useDirectusItem<C extends keyof Schema>(
  collection: C,
  id: string | number,
  params?: {
    fields?: string[]
  },
  opts?: Parameters<typeof useAsyncData>[2]
) {
  const client = useDirectusClient()
  const key = `${String(collection)}:${String(id)}:${JSON.stringify(params || {})}`
  return useAsyncData(key, () => client.request(readItem(String(collection), id, params as any)), opts)
}
```

## Mutations
Typed create, update, delete helpers.

```ts
// composables/useDirectusMutations.ts
import { createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Schema } from '~/types/directus'

export function useDirectusCreate<C extends keyof Schema>(collection: C) {
  const client = useDirectusClient()
  return async (payload: Partial<Schema[C]>) =>
    client.request(createItem(String(collection), payload as any))
}

export function useDirectusUpdate<C extends keyof Schema>(collection: C) {
  const client = useDirectusClient()
  return async (id: string | number, payload: Partial<Schema[C]>) =>
    client.request(updateItem(String(collection), id, payload as any))
}

export function useDirectusDelete<C extends keyof Schema>(collection: C) {
  const client = useDirectusClient()
  return async (id: string | number) =>
    client.request(deleteItem(String(collection), id))
}
```

## Filtering and Searching
Use SDK query params with Directus operators.

```ts
// examples/filtering.ts
const { data } = await useDirectusItems('articles', {
  filter: {
    status: { _eq: 'published' },
    category: { _in: ['news', 'blog'] },
    _and: [{ created_at: { _gte: '2024-01-01' } }]
  },
  search: 'jizou',
  sort: ['-created_at'],
  fields: ['id', 'title', 'slug', 'created_at'],
  page: 1,
  limit: 12
})
```

## SSR and Caching
- Use stable `useAsyncData` keys derived from collection and params
- Prefer server-side fetching for lists; hydrate on client when necessary

## Error Handling
- Surface user-friendly errors; avoid leaking tokens or URLs
- Wrap mutations in try/catch and propagate typed failures

## Security
- Configure Directus URL and token via `runtimeConfig`
- Do not hardcode secrets in composables or examples

## Acceptance Criteria
- Composables compile with TypeScript and infer collection types from `Schema`
- Filtering and searching use supported Directus operators and `search` param
- SSR-friendly data fetching with stable keys
- No secrets logged or embedded

## Example Usage

```ts
const articles = await useDirectusItems('articles', { search: 'nuxt', limit: 5 })

const article = await useDirectusItem('articles', 'abc123', {
  fields: ['id', 'title', 'slug']
})

const create = useDirectusCreate('articles')
await create({ title: 'New', status: 'draft' })
```
