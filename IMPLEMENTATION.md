# Gastos Japón - Implementation Plan

## Project Overview
Expense tracking application for a trip to Japan. Mobile-first design with localStorage persistence (no backend). Daily budget of ¥8,000 with real-time tracking.

## Data Structure

### localStorage Schema
```typescript
interface Budget {
  dailyLimit: number        // 8000 yenes
  startDate: string         // ISO date string
}

interface Location {
  lat: number
  lng: number
  city: string
  prefecture: string
}

interface Expense {
  id: string                // UUID
  timestamp: string         // ISO datetime string
  placeName: string         // User input
  amount: number            // Yenes
  category: 'food' | 'transport' | 'accommodation' | 'entertainment' | 'shopping' | 'other'
  notes: string             // Optional description
  location: Location        // Auto-captured
  paymentMethod: 'cash' | 'card'
  shared: boolean           // If expense was shared with someone
  photo?: string            // Optional base64 or URL
}

interface AppData {
  budget: Budget
  expenses: Expense[]
}
```

### localStorage key
- Key: `gastos-japon`
- Value: JSON.stringify(AppData)

## Implementation Phases

### Phase 1: Core Setup
**Files to create:**
- `app/composables/useExpenses.ts` - Main composable for expense management
- `app/composables/useGeolocation.ts` - Geolocation handling
- `app/types/index.ts` - TypeScript interfaces
- `app/utils/currency.ts` - Currency formatting utilities
- `app/utils/dates.ts` - Date formatting utilities

**shadcn components to add:**
```bash
npx shadcn-vue@latest add card
npx shadcn-vue@latest add input
npx shadcn-vue@latest add label
npx shadcn-vue@latest add select
npx shadcn-vue@latest add textarea
npx shadcn-vue@latest add badge
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add toast
npx shadcn-vue@latest add separator
npx shadcn-vue@latest add tabs
```

### Phase 2: Dashboard/Home Page (`/`)
**Route:** `app/pages/index.vue`

**Components to create:**
- `app/components/DailyBudgetCard.vue` - Shows today's budget status
- `app/components/ExpenseList.vue` - List of expenses
- `app/components/ExpenseCard.vue` - Individual expense display
- `app/components/QuickStats.vue` - Summary stats widget

**Features:**
- Display daily budget: ¥8,000
- Show spent today / remaining today
- Visual progress bar (green if under, yellow if near, red if over)
- List of today's expenses
- Quick summary: total trip expenses, days elapsed
- Floating Action Button (FAB) to add expense

**UI Layout:**
```
┌─────────────────────────┐
│   [≡]  Gastos Japón [👤]│
├─────────────────────────┤
│  Today's Budget         │
│  ¥8,000                 │
│                         │
│  Spent: ¥5,430          │
│  Remaining: ¥2,570      │
│  [████████░░]  68%      │
├─────────────────────────┤
│  📅 18 May 2025         │
├─────────────────────────┤
│  🍜 Ichiran Ramen       │
│     ¥1,200  12:30       │
│     📍 Shibuya, Tokyo    │
├─────────────────────────┤
│  🚇 Metro Card          │
│     ¥500  10:15         │
│     📍 Tokyo             │
└─────────────────────────┘
              [+] Add
```

### Phase 3: Add Expense Page/Modal
**Route:** `app/pages/add.vue` or modal component

**Components:**
- `app/components/AddExpenseForm.vue` - Main form
- `app/components/CategorySelector.vue` - Visual category picker

**Form Fields:**
1. Amount (¥) - Number input, auto-focus
2. Place Name - Text input
3. Category - Icon selector (6 categories)
4. Date/Time - Default to now, can edit
5. Payment Method - Toggle cash/card
6. Shared - Checkbox
7. Notes - Expandable textarea
8. Photo - Optional file upload (convert to base64)
9. Location - Auto-captured button + manual override

**Category Icons:**
- 🍜 Food & Drink (food)
- 🚇 Transport (transport)
- 🏨 Accommodation (accommodation)
- 🎭 Entertainment (entertainment)
- 🛍️ Shopping (shopping)
- 📦 Other (other)

**Geolocation Flow:**
1. On form mount, request geolocation permission
2. Get coordinates via browser API
3. Reverse geocode to city/prefecture (OpenStreetMap Nominatim API - free)
4. Show captured location with option to edit
5. If permission denied, allow manual input

### Phase 4: History Page (`/history`)
**Route:** `app/pages/history.vue`

**Components:**
- `app/components/ExpenseFilters.vue` - Filter controls
- `app/components/ExpenseListGrouped.vue` - Grouped by date
- `app/components/ExpenseDetail.vue` - Detailed view modal

**Features:**
- List all expenses grouped by day
- Total per day
- Search by place name
- Filter by:
  - Date range
  - Category
  - City
  - Payment method
- Sort by date (desc/asc) or amount
- Swipe actions: Edit / Delete
- Tap expense to see full details
- Edit/Delete functionality

**UI Layout:**
```
┌─────────────────────────┐
│   History        [🔍]   │
├─────────────────────────┤
│ [Filters: All ▾]        │
│ [Search place...]       │
├─────────────────────────┤
│ 📅 18 May 2025 - ¥5,430 │
│                         │
│  🍜 Ichiran Ramen       │
│     ¥1,200  12:30       │
│     Shibuya, Tokyo      │
│                         │
│  🚇 Metro Card          │
│     ¥500  10:15         │
├─────────────────────────┤
│ 📅 17 May 2025 - ¥7,890 │
│  ...                    │
└─────────────────────────┘
```

### Phase 5: Statistics Page (`/stats`)
**Route:** `app/pages/stats.vue`

**Libraries needed:**
- Chart.js via `chart.js` + `vue-chartjs`
```bash
npm install chart.js vue-chartjs
```

**Components:**
- `app/components/stats/TotalSummary.vue` - Overview cards
- `app/components/stats/CategoryChart.vue` - Pie chart
- `app/components/stats/DailyChart.vue` - Line/Bar chart
- `app/components/stats/LocationBreakdown.vue` - By prefecture
- `app/components/stats/TopExpenses.vue` - Most expensive items

**Statistics to show:**
1. **Summary Cards (top):**
   - Total spent in trip
   - Days elapsed
   - Average daily spending
   - Budget adherence rate

2. **Category Breakdown (Pie Chart):**
   - Percentage per category
   - Amount per category

3. **Daily Spending (Line Chart):**
   - X-axis: Days
   - Y-axis: Amount
   - Reference line at ¥8,000 budget
   - Show over/under budget days

4. **Location Stats:**
   - Expenses by prefecture
   - Expenses by city
   - Most expensive cities

5. **Top Expenses:**
   - 5 most expensive single purchases
   - Most visited category

6. **Payment Method:**
   - Cash vs Card breakdown (pie chart)

**UI Layout:**
```
┌─────────────────────────┐
│   Statistics            │
├─────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │Total│ │Days │ │ Avg │ │
│ │¥XX  │ │  X  │ │¥XX  │ │
│ └─────┘ └─────┘ └─────┘ │
├─────────────────────────┤
│  Expenses by Category   │
│  [  Pie Chart Here  ]   │
├─────────────────────────┤
│  Daily Spending Trend   │
│  [  Line Chart Here ]   │
├─────────────────────────┤
│  By Location            │
│  Tokyo: ¥XX,XXX         │
│  Osaka: ¥XX,XXX         │
└─────────────────────────┘
```

### Phase 6: Map View (`/map`) - FINAL
**Route:** `app/pages/map.vue`

**Library:**
- MapBox GL JS
```bash
npm install mapbox-gl @types/mapbox-gl
```

**Features:**
- Show all expenses as markers on map
- Color-coded by category
- Marker clusters for dense areas
- Click marker to show expense details
- Filter markers by category
- Center map on Japan
- Zoom to city when filtering

## Navigation Structure

**Bottom Navigation (Mobile) or Sidebar (Desktop):**
- 🏠 Home (`/`)
- 📝 History (`/history`)
- 📊 Stats (`/stats`)
- 🗺️ Map (`/map`)

**Layout:**
- `app/layouts/default.vue` - Main layout with navigation

## Composables API

### useExpenses()
```typescript
// app/composables/useExpenses.ts
export function useExpenses() {
  const expenses = ref<Expense[]>([])
  const budget = ref<Budget>({ dailyLimit: 8000, startDate: '' })

  // CRUD operations
  function addExpense(expense: Omit<Expense, 'id'>): void
  function updateExpense(id: string, expense: Partial<Expense>): void
  function deleteExpense(id: string): void
  function getExpense(id: string): Expense | undefined

  // Queries
  function getExpensesByDate(date: string): Expense[]
  function getExpensesInRange(start: string, end: string): Expense[]
  function getTodayExpenses(): Expense[]

  // Calculations
  function getTotalSpent(): number
  function getTodaySpent(): number
  function getTodayRemaining(): number
  function getAverageDailySpending(): number
  function getExpensesByCategory(): Record<string, number>
  function getExpensesByLocation(): Record<string, number>

  // Persistence
  function loadFromStorage(): void
  function saveToStorage(): void
  function exportData(): string // JSON export
  function importData(json: string): void

  return {
    expenses: readonly(expenses),
    budget: readonly(budget),
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    getExpensesByDate,
    getExpensesInRange,
    getTodayExpenses,
    getTotalSpent,
    getTodaySpent,
    getTodayRemaining,
    getAverageDailySpending,
    getExpensesByCategory,
    getExpensesByLocation,
    loadFromStorage,
    saveToStorage,
    exportData,
    importData
  }
}
```

### useGeolocation()
```typescript
// app/composables/useGeolocation.ts
export function useGeolocation() {
  const location = ref<Location | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function getCurrentLocation(): Promise<Location | null>
  async function reverseGeocode(lat: number, lng: number): Promise<{ city: string, prefecture: string }>

  return {
    location: readonly(location),
    loading: readonly(loading),
    error: readonly(error),
    getCurrentLocation,
    reverseGeocode
  }
}
```

## Utilities

### Currency Formatting
```typescript
// app/utils/currency.ts
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function parseYen(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, '')) || 0
}
```

### Date Formatting
```typescript
// app/utils/dates.ts
export function formatDate(date: string | Date): string
export function formatTime(date: string | Date): string
export function formatDateTime(date: string | Date): string
export function isToday(date: string | Date): boolean
export function getDaysElapsed(startDate: string): number
export function groupByDate(expenses: Expense[]): Record<string, Expense[]>
```

## Styling Considerations

**Color Scheme:**
- Primary: Teal/Turquoise (#40C4AA) - like the reference image
- Secondary: Navy (#1E293B) for text
- Success: Green for under-budget
- Warning: Yellow/Orange for near-budget
- Danger: Red for over-budget
- Background: Light gray (#F8FAFC)

**Mobile-First:**
- All pages should be optimized for mobile (320px+)
- Large touch targets (min 44px)
- Floating Action Button for primary actions
- Bottom navigation for easy thumb access
- Swipe gestures where appropriate

**Tailwind Classes to use:**
- Cards: rounded-3xl for modern look
- Shadows: shadow-lg for depth
- Spacing: generous padding (p-6, p-8)
- Typography: font-bold for amounts, font-medium for labels

## Progressive Web App (PWA) - ESSENTIAL

**Required for offline usage in Japan**

### Phase 1.5: PWA Setup (After Core Setup)

**Module to install:**
```bash
npm install @vite-pwa/nuxt -D
```

**Configuration in nuxt.config.ts:**
```typescript
modules: [
  'shadcn-nuxt',
  '@vite-pwa/nuxt'
],
pwa: {
  registerType: 'autoUpdate',
  manifest: {
    name: 'Gastos Japón',
    short_name: 'Gastos',
    description: 'Expense tracker for Japan trip',
    theme_color: '#40C4AA',
    background_color: '#F8FAFC',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  },
  workbox: {
    navigateFallback: '/',
    globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'geocoding-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
          }
        }
      }
    ]
  },
  devOptions: {
    enabled: true,
    type: 'module'
  }
}
```

**Icons needed:**
- Create `public/icon-192x192.png` - App icon 192x192
- Create `public/icon-512x512.png` - App icon 512x512
- Create `public/favicon.ico` - Browser favicon

**Offline Strategy:**
- All app assets cached on first load
- localStorage persists all expense data
- Geolocation works offline (if permission granted)
- Reverse geocoding cached for 1 week
- If geocoding fails offline, save coordinates only, resolve later when online

**Features:**
- ✅ Install to home screen (iOS/Android)
- ✅ Works completely offline after first load
- ✅ Auto-updates when new version available
- ✅ Background sync for geocoding when coming back online
- ✅ No data loss - everything in localStorage

**User Flow:**
1. First visit: App caches all resources
2. Install prompt: "Add to Home Screen"
3. Offline: Full functionality except new geocoding
4. Online again: Resolves any pending geocoding

## Testing Checklist

**Data Persistence:**
- [ ] Expenses persist after page reload
- [ ] Export/import works correctly
- [ ] Large datasets don't cause performance issues

**Geolocation:**
- [ ] Permission request handled gracefully
- [ ] Fallback to manual entry if denied
- [ ] Reverse geocoding returns correct prefecture
- [ ] Works offline with cached geocoding

**PWA:**
- [ ] Install prompt appears correctly
- [ ] App works offline after installation
- [ ] Service worker caches all assets
- [ ] App updates automatically when online
- [ ] Icons display correctly on home screen (iOS/Android)

**Calculations:**
- [ ] Daily budget calculates correctly
- [ ] Category totals sum properly
- [ ] Date filtering works across timezones

**UI/UX:**
- [ ] Responsive on all screen sizes
- [ ] Form validation provides clear feedback
- [ ] Loading states visible during async operations
- [ ] Error messages are user-friendly
- [ ] Works on iPhone and Android devices

## Next Steps

1. ✅ Create this implementation document
2. Setup types and data structure
3. Implement useExpenses composable
4. Setup PWA configuration and icons
5. Build dashboard page
6. Create add expense form with offline geolocation
7. Implement history page
8. Build statistics page with charts
9. Add map view with MapBox
10. Test PWA installation and offline mode
11. Polish UI and add animations
12. Test on real device during trip!

---

Ready to start implementation! 🇯🇵
