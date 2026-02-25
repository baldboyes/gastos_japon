# Plan de Configuración del Servidor OVH (mevoyajapon.com)

Este plan detalla los pasos para configurar el servidor Ubuntu 22.04/24.04 con Nginx, Node.js, y seguridad SSL para tus dominios.

## Prerrequisitos (Acción del Usuario requerida)
1. **Configuración DNS en OVH:**
   - Accede a tu panel de OVH > Dominios > Zona DNS.
   - Crea/Modifica un registro **A** para `mevoyajapon.com` apuntando a `141.94.23.216`.
   - Crea/Modifica un registro **A** para `www.mevoyajapon.com` apuntando a `141.94.23.216`.
   - Crea/Modifica un registro **A** para `directus.jizou.io` apuntando a `141.94.23.216`.
   *Nota: Esto es crucial para que la emisión de certificados SSL funcione.*

## Fase 1: Acceso y Preparación del Sistema
1. **Verificación de Conexión:** Validar acceso SSH con las credenciales proporcionadas.
2. **Actualización del Sistema:** Ejecutar `apt update` y `apt upgrade` para asegurar parches de seguridad.
3. **Herramientas Base:** Instalar `git`, `curl`, `wget`, `unzip`, y `build-essential`.

## Fase 2: Instalación del Stack Tecnológico
1. **Servidor Web:** Instalar Nginx.
2. **Entorno Node.js:** Instalar Node.js v22 (usando repositorio oficial NodeSource).
3. **Base de Datos:** Instalar PostgreSQL (recomendado para Directus) o MySQL según preferencia. Configurar usuario y base de datos inicial para la futura API.
4. **Gestor de Procesos:** Instalar PM2 para gestionar la futura aplicación Node.js.

## Fase 3: Estructura de Directorios y Permisos
1. **Dominio Principal (`mevoyajapon.com`):**
   - Crear `/var/www/mevoyajapon.com/html`.
   - Asignar propiedad `ubuntu:www-data`.
   - Crear página de prueba "Próximamente".
2. **Subdominio API (`directus.jizou.io`):**
   - Crear `/var/www/directus.jizou.io`.
   - Asignar propiedad `ubuntu:www-data`.

## Fase 4: Configuración de Nginx (Virtual Hosts)
1. **Configuración Principal:** Crear bloque de servidor para `mevoyajapon.com` sirviendo archivos estáticos.
2. **Configuración API:** Crear bloque de servidor para `directus.jizou.io` configurado como Proxy Inverso (preparado para reenviar tráfico al puerto de Directus/Node).

## Fase 5: Seguridad y SSL
1. **Firewall (UFW):**
   - Permitir SSH (Puerto 22).
   - Permitir HTTP/HTTPS (Nginx Full).
   - Habilitar UFW.
2. **Certificados SSL:**
   - Instalar Certbot.
   - Generar certificados Let's Encrypt para ambos dominios.
   - Configurar redirección automática de HTTP a HTTPS.

## Fase 6: Mantenimiento y Extras
1. **Monitoreo Básico:** Instalar un script simple de monitoreo de recursos (espacio en disco/RAM).
2. **Backups:** Crear script en bash para respaldar configuraciones de Nginx y Base de Datos periódicamente en una carpeta local `/backups`.
