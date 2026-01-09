# Plan de Reestructuración: Organización del Viaje en Páginas Independientes

Actualmente, toda la gestión del viaje está en pestañas dentro de `/trips/[id].vue`. Vamos a separar cada sección logística (Vuelos, Hoteles, etc.) en su propia página para mejorar la navegación y permitir funcionalidades más ricas, como la **subida de archivos PDF**.

## 1. Nueva Estructura de Rutas
Crearemos sub-rutas anidadas bajo `/trips/[id]/`:
*   `/trips/[id]/flights`: Gestión de vuelos + subida de billetes.
*   `/trips/[id]/accommodation`: Gestión de hoteles + subida de reservas.
*   `/trips/[id]/transport`: Gestión de trenes/buses + subida de pases.
*   `/trips/[id]/activities`: Gestión de entradas + subida de tickets.
*   `/trips/[id]/insurance`: Gestión de seguros + subida de pólizas.
*   `/trips/[id]/wallet`: (Opcional, o mantener en dashboard) Gestión de divisas.

La página `/trips/[id]/index.vue` actuará como un "Dashboard" resumen, con enlaces rápidos a estas secciones.

## 2. Gestión de Archivos (PDFs)
Para permitir adjuntar PDFs (reservas, billetes) a cada elemento:
*   **Backend (Directus)**:
    *   Las colecciones (`vuelos`, `alojamientos`, etc.) ya soportan relaciones con `directus_files`.
    *   Crearemos un campo `adjuntos` (M2M con `directus_files`) en cada colección logística.
*   **Frontend**:
    *   Implementar un componente `FileUploader.vue` que permita subir archivos a Directus y vincularlos al registro.
    *   Visualizar los archivos adjuntos como una lista con botón de descarga/vista previa.

## 3. Navegación (Layout)
*   Crearemos un **Layout Específico** para el detalle del viaje (`layouts/trip.vue` o un componente `TripSidebar`) que muestre un menú lateral o superior persistente para navegar entre las secciones del viaje (Vuelos, Hoteles, etc.) sin perder el contexto.

## 4. Pasos de Ejecución
1.  **Backend**: Crear campo `adjuntos` en las 5 colecciones (`vuelos`, `alojamientos`, `transportes`, `actividades`, `seguros`).
2.  **Frontend (Rutas)**: Crear la estructura de carpetas `pages/trips/[id]/...`.
3.  **Frontend (Componentes)**:
    *   Migrar la lógica de `TripLogistics.vue` a componentes/páginas individuales.
    *   Crear componente `FileUploader`.
4.  **Frontend (Navegación)**: Implementar el menú de navegación del viaje.