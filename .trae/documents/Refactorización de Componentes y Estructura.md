Voy a refactorizar los componentes para mejorar la organización y mantenibilidad de la aplicación.

### 1. Reorganización de Directorios
Moveré los componentes de la raíz `app/components` a subdirectorios temáticos para reducir el ruido y agrupar funcionalidades relacionadas:

- **`app/components/expenses/`**:
  - `ExpenseList.vue` → `List.vue`
  - `ExpenseCard.vue` → `Card.vue`
  - `ExpenseDetailDialog.vue` → `DetailDialog.vue`
  - `ExpenseFilters.vue` → `Filters.vue`
  - `ExpensesByDate.vue` → `GroupedList.vue`
  - `PlannedExpenseCard.vue` → `PlannedCard.vue`

- **`app/components/charts/`**:
  - `CategoryBreakdownChart.vue` → `CategoryBreakdown.vue`
  - `DailySpendingChart.vue` → `DailySpending.vue`
  - `PaymentMethodChart.vue` → `PaymentMethod.vue`

- **`app/components/maps/`**:
  - `MapView.vue` → `View.vue`
  - `LocationMap.vue` → `Location.vue`
  - `EditableMap.vue` → `Editable.vue`

- **`app/components/dashboard/`**:
  - `DailyBudgetCard.vue` → `DailyBudget.vue`
  - `QuickStats.vue` → `QuickStats.vue`
  - `StatsCard.vue` → `StatsCard.vue`

- **`app/components/common/`**:
  - `CategorySelector.vue`
  - `DateRangeFilter.vue`

### 2. Creación de Componentes Compartidos
- Crear **`app/components/common/PaymentMethodBadge.vue`**: Para unificar la visualización de métodos de pago (ícono y etiqueta) que actualmente se repite en filtros, tarjetas y gráficos.

### 3. Extracción de Lógica (Composables)
- Crear **`app/composables/useGroupedExpenses.ts`**: Extraer la lógica de agrupación por fechas y paginación de `ExpensesByDate.vue` (ahora `expenses/GroupedList.vue`) para aligerar el componente.

### 4. Actualización de Referencias
- Actualizar todas las importaciones y usos en `pages/` y otros componentes para reflejar la nueva estructura y nombres (ej. `<ExpenseCard />` pasará a ser `<ExpensesCard />` o `<ExpensesCard />` dependiendo de la configuración, asegurando que la aplicación siga funcionando correctamente).

Esta refactorización hará que el código sea más fácil de navegar y escalar.
