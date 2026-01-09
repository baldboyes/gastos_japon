# Plan de Mejora: Transportes con Escalas

Entendido. Un "Trayecto" no siempre es punto A a punto B; puede implicar una ruta con escalas o múltiples segmentos (Tokyo -> Nagoya -> Kyoto).

## 1. Modelo de Datos Actualizado

Para soportar esto sin complicar excesivamente la base de datos (creando una sub-tabla "segmentos"), utilizaremos un enfoque flexible dentro de la colección `transportes`:

*   **Campo `categoria`**: `pase` vs `trayecto`.
*   **Campo `escalas` (JSON/Repeater)**: Solo para `trayecto`. Permitirá añadir múltiples segmentos dentro de un mismo registro de transporte.
    *   Estructura JSON: `[{ origen, destino, medio, fecha_salida, fecha_llegada, notas }]`.
    *   *Ejemplo*:
        1.  Tokyo -> Nagoya (Shinkansen Hikari)
        2.  Nagoya -> Takayama (JR Hida)
*   **Fechas Globales**:
    *   `fecha_inicio`: Inicio del primer segmento (o del pase).
    *   `fecha_fin`: Llegada del último segmento (o fin del pase).

## 2. Interfaz de Usuario (UI)

*   **Modo Pase**: Simple (Nombre, Inicio Validez, Fin Validez).
*   **Modo Trayecto**:
    *   Formulario "Multi-etapa": Permitirá añadir tramos dinámicamente.
    *   Visualización: Mostrará el origen inicial y destino final, con un desglose desplegable de las escalas intermedias si las hay.

## 3. Ejecución

1.  **Backend**: Añadir campo `escalas` (tipo JSON) a `transportes` y actualizar `fecha_inicio`/`fecha_fin` a timestamp.
2.  **Frontend**:
    *   Actualizar `useTripOrganization.ts` para manejar el campo JSON.
    *   Rehacer el formulario de Transporte en `TripLogistics.vue` para soportar la adición dinámica de escalas.

Esta solución permite registrar un viaje complejo como una sola unidad organizativa ("Viaje a los Alpes Japoneses") manteniendo el detalle de cada tren/bus.