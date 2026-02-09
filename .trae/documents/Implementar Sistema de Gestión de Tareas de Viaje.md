Voy a implementar el sistema de gestión de tareas integral siguiendo tu especificación.

### 1. Backend (Directus)
Como no puedo crear colecciones directamente, necesitaré que asegures que existan las siguientes colecciones en Directus antes de que la funcionalidad esté operativa:

*   **task_groups**: `id`, `name`, `description`, `entity_type`, `entity_id`, `created_by`, `viaje_id` (importante para filtrar por viaje).
*   **tasks**: `id`, `title`, `description`, `due_date`, `priority`, `status`, `task_group`, `assigned_to`, `created_by`, `completed_at`, `completed_by`.

### 2. Estructura Frontend (Nuxt)

#### A. Tipos y Composable (`app/types/tasks.ts`, `app/composables/useTripTasks.ts`)
Crearé un composable dedicado para aislar la lógica de tareas:
*   **Estado**: Tareas, grupos, filtros activos.
*   **Acciones**: CRUD completo, asignación de usuarios, cambio de estado.
*   **Integración**: Conectará con `useTripOrganization` para vincular tareas a entidades reales (Vuelos, Alojamientos, etc.).

#### B. Componentes UI (`app/components/tasks/`)
Desarrollaré un set de componentes modulares:
1.  **TaskBoard.vue**: Contenedor principal con vistas conmutables (Lista, Grupos, Calendario).
2.  **TaskGroup.vue**: Visualización de un grupo con sus tareas anidadas.
3.  **TaskItem.vue**: Tarjeta de tarea individual con acciones rápidas (completar, editar).
4.  **TaskModal.vue**: Formulario para crear/editar tareas con selector de entidad inteligente.
5.  **TaskGroupModal.vue**: Formulario para crear grupos de tareas.
6.  **TaskFilters.vue**: Barra lateral o superior para filtrar por prioridad, estado, asignado.

#### C. Página de Tareas (`app/pages/trips/[id]/tasks.vue`)
Una nueva página en la navegación del viaje que alojará el `TaskBoard`.

#### D. Integración de Notificaciones
*   Usaré `useNotifications` para mostrar alertas visuales en la app cuando una tarea se asigne o venza hoy.
*   Implementaré un check al cargar las tareas para identificar las urgentes.

### 3. Vista de Calendario
Utilizaré el componente `Calendar` de shadcn-vue existente en el proyecto, adaptándolo para mostrar indicadores en los días que tienen tareas pendientes.

### Pasos de Implementación
1.  Definir interfaces TypeScript.
2.  Implementar `useTripTasks` con la lógica de negocio.
3.  Crear componentes base (`TaskItem`, `TaskGroup`).
4.  Crear modales de edición.
5.  Construir la página principal y el tablero.
6.  Integrar notificaciones y vistas alternativas.
