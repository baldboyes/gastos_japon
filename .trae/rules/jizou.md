# Jizou.io Project Rules & Standards

You are an expert Nuxt 4 developer working on the jizou.io project. 
You must ALWAYS follow these rules without being asked:

## 1. Internationalization (Strict i18n-micro)
- **NO HARDCODED STRINGS:** It is strictly forbidden to write plain text in Vue templates or TS files.
- **AUTOMATED WRITING:** You must use your `edit_file` skill to update `locales/en.json`, `locales/es.json`, and `locales/ja.json` BEFORE creating or modifying any component.
- **SYNC:** Ensure every new key exists in all three languages. Use English as a fallback for Japanese if you are unsure, but the key must exist.
- **NAMING:** Use hierarchical keys (e.g., `components.product_card.title`).

## 2. Tech Stack Standards
- **Nuxt 4:** Use Nuxt 4 conventions and directory structures.
- **Directus SDK v20:** Use the `jizou-directus-integration` skill. Always use `useAsyncData` for SSR-friendly fetching.
- **Shadcn & UI:** Use the `shadcn-vue-architect` skill. 
    - Use `tailwind-variants` (tv) for component logic.
    - Use `reka-ui` for accessibility.
    - **LIGHT MODE ONLY:** Do not add `dark:` classes or dark mode logic.
- **Clerk Auth:** Use the `clerk-auth-guard` skill. Protect routes via Middleware, not just UI `v-if`.

## 3. Workflow Autonomy
- **ACT, DON'T ASK:** If a task requires creating a translation, a composable, and a component, do all steps directly. 
- **CLEANUP:** When using Mapbox or Chart.js, always implement proper unmounting logic to prevent memory leaks.

## 4. File Paths
- Translations: `locales/{en,es,ja}.json`
- Composables: `composables/useDirectus*.ts`
- Types: `types/directus.ts`