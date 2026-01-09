# Plan de Instalación de Directus CMS

Este plan tiene como objetivo desplegar Directus en `api.mevoyajapon.com`, conectarlo a la base de datos PostgreSQL existente y asegurar que se ejecute automáticamente.

## 1. Preparación de la Instalación
- **Ubicación:** `/var/www/api.mevoyajapon.com` (Directorio ya creado).
- **Base de Datos:** Se usará la DB `directus` y usuario `directus` creados anteriormente.
- **Seguridad:** Se generarán claves únicas (`KEY` y `SECRET`) para la seguridad de la API.

## 2. Automatización (Script `install_directus.sh`)
Crearé un script que se ejecutará en el servidor para realizar las siguientes acciones sin intervención manual:
1.  **Instalar Dependencias:** Instalar el paquete `directus` vía NPM en el directorio del proyecto.
2.  **Configuración (.env):** Generar el archivo de configuración con:
    -   Conexión a BD: `postgres://directus:DirectusPass2025!Secure@localhost:5432/directus`
    -   Credenciales Admin: `admin@mevoyajapon.com` / `DirectusAdmin2026!`
    -   Puerto: `8055`
3.  **Inicialización (Bootstrap):** Ejecutar el comando para crear las tablas en la base de datos.
4.  **Gestión de Procesos (PM2):**
    -   Iniciar Directus con PM2.
    -   Guardar la configuración para que arranque al reiniciar el servidor.

## 3. Verificación
- Comprobar que el error "502 Bad Gateway" desaparece y es reemplazado por la API de Directus.
- Validar acceso a `https://api.mevoyajapon.com/admin`.

## Credenciales Generadas (Guardar)
Al finalizar, tendrás un nuevo acceso para el panel de Directus:
- **URL:** `https://api.mevoyajapon.com/admin`
- **Usuario:** `admin@mevoyajapon.com`
- **Contraseña:** `DirectusAdmin2026!`
