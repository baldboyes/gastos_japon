# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 4 application called "gastos" (expenses) using TypeScript, Vue 3, Tailwind CSS v4, and shadcn-nuxt for UI components. The project uses the "New York" style variant of shadcn components with neutral base color.

## Commands

### Development
```bash
npm install           # Install dependencies (runs nuxt prepare postinstall)
npm run dev           # Start development server at http://localhost:3000
npm run build         # Build for production
npm run preview       # Preview production build locally
npm run generate      # Generate static site
```

Note: No linting or testing scripts are currently configured in package.json.

## Architecture

### Directory Structure
- `app/` - Main application directory (Nuxt 4 convention using `app/` instead of traditional structure)
  - `app.vue` - Root component with NuxtRouteAnnouncer
  - `components/ui/` - shadcn-nuxt UI components (auto-imported without prefix)
  - `lib/utils.ts` - Contains `cn()` helper for merging Tailwind classes
  - `assets/css/tailwind.css` - Tailwind CSS v4 imports and theme variables
  - `plugins/ssr-width.ts` - VueUse SSR width provider (1024px)
- `public/` - Static assets
- `nuxt.config.ts` - Nuxt configuration
- `components.json` - shadcn-nuxt configuration
- `tsconfig.json` - TypeScript project references to `.nuxt/tsconfig.*.json` files

### Key Technologies & Patterns

**Nuxt 4 Conventions:**
- Auto-imports enabled for components, composables, and utilities
- Uses `app/` directory structure (Nuxt 4 default)
- File-based routing (when pages are added)
- TypeScript configured via project references to `.nuxt/tsconfig.*.json`

**Styling Stack:**
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (configured in nuxt.config.ts)
- CSS variables for theming (cssVariables: true in components.json)
- `cn()` utility from `app/lib/utils.ts` combines `clsx` and `tailwind-merge`
- Main stylesheet: `app/assets/css/tailwind.css`

**UI Components (shadcn-nuxt):**
- Based on Reka UI primitives (Vue port of Radix UI)
- Component location: `app/components/ui/`
- Style variant: "new-york" with neutral base color
- Auto-imported globally without prefix (prefix: '' in nuxt.config.ts)
- Icon library: lucide-vue-next
- Add new shadcn components using: `npx shadcn-vue@latest add <component>`

**Path Aliases (components.json):**
```
@/components → app/components
@/composables → app/composables
@/utils → app/lib/utils
@/ui → app/components/ui
@/lib → app/lib
```

### Important Implementation Details

**SSR Hydration:**
- `app/plugins/ssr-width.ts` provides a fixed SSR width (1024px) to VueUse composables
- Prevents hydration mismatches when using VueUse composables that depend on window width
- Loaded automatically via Nuxt's plugin system

**Component Usage:**
- All components in `app/components/` are auto-imported (no import statements needed)
- shadcn components are accessed directly: `<Button />`, `<Card />`, etc.
- Use `cn()` for conditional class merging in component props

**Adding New Features:**
- Pages: Create files in `app/pages/` (will enable file-based routing)
- Components: Add to `app/components/` for auto-import
- Composables: Add to `app/composables/` for auto-import
- Layouts: Create in `app/layouts/` (e.g., `default.vue`)
- Middleware: Add to `app/middleware/`
- Server routes: Add to `server/api/` or `server/routes/`

## Current State

The project is a minimal starter with:
- Single root component ([app/app.vue](app/app.vue:1)) with a centered Button component
- One shadcn UI component installed: Button
- No routing, layouts, or additional pages configured yet
- No API routes or server-side logic
- No test suite or linting configuration

## Sub agents
You have access to 1 sub agent:
- shadcn-ui-expert: all task related to UI building & tweaking HAVE TO consult this agent
Sub agents will do research about the implementation, but you will do the actual implementation;
When passing task to sub agent, make sure you pass the context file, e.g. '.claude/tasks/ session_context_x.md'.
After each sub agent finish the work, make sure you read the related documentation they created to get full context of the plan before you start executing