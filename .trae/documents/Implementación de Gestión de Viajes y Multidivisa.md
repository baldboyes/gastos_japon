# Plan Final: Gestión Multi-Usuario y Organización Desglosada del Viaje

Este plan asegura que toda la información esté correctamente vinculada al **Viaje** y sea accesible por todos sus **Colaboradores**, permitiendo una gestión compartida real.

## 1. Estructura de Datos en Directus (Backend)

Crearemos 5 nuevas colecciones. Cada una tendrá una relación obligatoria con `viajes` y seguimiento de autoría:

1.  **`vuelos`**: Trayectos aéreos.
2.  **`alojamientos`**: Hoteles y estancias.
3.  **`transportes`**: Pases (JR Pass, etc.) y billetes específicos.
4.  **`actividades`**: Entradas a museos, parques y eventos.
5.  **`cambios_moneda`**: Registros de EUR a JPY (Efectivo/Banco).

**Campos comunes obligatorios en todas:**
*   `viaje_id`: Relación (M2O) con la colección `viajes`.
*   `user_created`: Campo de sistema para saber qué usuario creó el registro.
*   `moneda`: Selector (EUR/JPY) para cada gasto asociado.

## 2. Modelo de Permisos Colaborativos
Para que varios usuarios gestionen el mismo viaje, configuraremos las reglas de Directus de la siguiente manera:
*   **Regla de Acceso**: Un usuario puede Ver/Crear/Editar/Borrar registros en estas colecciones SI el `viaje_id` asociado tiene a ese usuario en su lista de `colaboradores` (`viajes_usuarios`).
*   **Resultado**: Si tú invitas a un amigo a tu viaje, ambos veréis los mismos vuelos, hoteles y cambios de moneda en tiempo real.

## 3. Lógica de Negocio y Finanzas (Frontend)

*   **Composables**:
    *   `useTripOrganization.ts`: Gestionará el CRUD de las 4 categorías operativas.
    *   `useWallet.ts`: Calculará el saldo de Yenes "compartido" del viaje basándose en los cambios de moneda realizados por cualquier miembro del grupo.
*   **Multidivisa**: Soporte para introducir precios en EUR (para reservas previas) o JPY (para compras en destino), con conversión visual informativa.

## 4. Interfaz de Usuario (UI por Pestañas)

Refactorizaremos `/trips/[id].vue` utilizando el componente `Tabs`:

1.  **Pestaña "Diario"**: Gastos comunes del día a día.
2.  **Pestaña "Logística"**:
    *   Secciones desglosadas para **Vuelos**, **Alojamiento**, **Transportes** y **Actividades**.
    *   Cada sección permitirá añadir nuevos elementos vinculados automáticamente al viaje actual.
3.  **Pestaña "Caja" (Wallet)**:
    *   Historial de cambios de moneda.
    *   Balance de yenes disponibles (Efectivo vs. Banco).
    *   Resumen de quién ha aportado cuánto al fondo común del viaje.

## 5. Pasos de Implementación
1.  **Backend**: Crear colecciones y configurar la lógica de permisos relacionales.
2.  **Frontend Logic**: Implementar los composables de organización y billetera.
3.  **Frontend UI**: Diseñar los formularios y las vistas de lista dentro de las nuevas pestañas.
4.  **Sincronización**: Asegurar que los cambios de un usuario se reflejen instantáneamente para los demás colaboradores.