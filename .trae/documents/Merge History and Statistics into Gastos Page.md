# Merge History and Statistics into Gastos Page

## 1. Create New Page `app/pages/gastos.vue`
Create a new file `app/pages/gastos.vue` that consolidates the functionality of `history.vue` and `stats.vue`.
- **Structure**:
    - Use `Tabs` component to switch between three views: "Historial" (List), "Mapa" (Map), and "Estadísticas" (Stats).
    - Default view will be "Historial".
- **Logic**:
    - **Imports**: Combine imports from both source files (components, composables, types, utils).
    - **State**: Add `viewMode` state ('list', 'map', 'stats').
    - **Filters**: Include the filter logic from `history.vue`. These filters will apply to the "List" and "Map" views.
    - **Data**: 
        - Use `filteredExpenses` for List and Map views.
        - Use raw `expenses` for Stats view (preserving original behavior), or potentially `filteredExpenses` if it makes sense (I will stick to raw `expenses` to match `stats.vue` unless it's easy to make it reactive to filters, but `stats.vue` logic is extensive so I'll keep it isolated first). Actually, using filtered expenses for stats is a great feature, but I will stick to original behavior first to ensure correctness, or maybe just use `expenses` as `stats.vue` did.
- **Components**:
    - **Historial Tab**: `ExpensesFilters`, `ExpensesGroupedList`.
    - **Mapa Tab**: `MapsView`.
    - **Estadísticas Tab**: `DashboardStatsCard`, `ChartsDailySpending`, `ChartsCategoryBreakdown`, `ChartsPaymentMethod`, `Card` (Top Expenses).

## 2. Update Navigation
Modify `app/layouts/default.vue`:
- Remove links to `/history` and `/stats`.
- Add a new link to `/gastos` with a suitable icon (e.g., List icon).

## 3. Cleanup
- Delete `app/pages/history.vue`.
- Delete `app/pages/stats.vue`.
