I will implement the income management functionality (`ingresos`) integrated with the existing financial module.

### 1. Backend (Directus)
I will create a new collection `ingresos` to store income records.
*   **Fields**:
    *   `id`: Integer (Auto-increment)
    *   `status`: String (Default: 'published')
    *   `fecha`: Timestamp
    *   `concepto`: String (Title)
    *   `monto`: Integer (Amount)
    *   `moneda`: String (Dropdown: 'JPY', 'EUR', 'USD')
    *   `categoria`: String (Dropdown: 'deposit', 'refund', 'gift', 'other')
    *   `descripcion`: Text
    *   `viaje_id`: Many-to-One relationship to `viajes`

### 2. Frontend Logic (Composables)
*   **Create `app/composables/useTripIncomes.ts`**:
    *   Implement `fetchIncomes`, `createIncome`, `deleteIncome` using Directus SDK.
    *   Manage reactive state for `incomes`.
*   **Update `app/composables/useWallet.ts`**:
    *   Integrate `useTripIncomes` to include income in the financial calculations.
    *   Update `totalJPYAcquired` to include income in JPY.
    *   Update `currentJPYBalance` to reflect the new income.

### 3. User Interface (Wallet Page)
*   **Update `app/pages/trips/[id]/wallet.vue`**:
    *   Add a new section or tab for "Ingresos" alongside "Cambios".
    *   Add a list view for incomes.
    *   Add a generic "Añadir Ingreso" button and modal form (Concept, Amount, Currency, Category).
    *   Update the summary cards to reflect the consolidated balance (Exchange + Income).
