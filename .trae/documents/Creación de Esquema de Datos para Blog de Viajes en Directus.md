# Plan de Integración API Clerk + Directus (Gratuito)

Configuraremos el servidor para que acepte usuarios autenticados por tu instancia de Clerk sin necesidad de configuraciones OIDC complejas o de pago.

## 1. Configuración del Servidor
Usaré tus credenciales para configurar el driver de autenticación en `/var/www/directus.jizou.io/.env`.

**Variables a inyectar:**
-   `AUTH_PROVIDERS="clerk"`
-   `AUTH_CLERK_DRIVER="openid"`
-   `AUTH_CLERK_ISSUER_URL="https://full-adder-12.clerk.accounts.dev"` (Extraído de tu PK)
-   `AUTH_CLERK_IDENTIFIER_KEY="email"` (Usaremos el email como identificador único)
-   `AUTH_CLERK_ALLOW_PUBLIC_REGISTRATION="true"` (Crear usuarios automáticamente al primer uso)
-   `AUTH_CLERK_CLIENT_ID="directus"` (Valor placeholder necesario para la config, aunque solo validemos tokens)
-   `AUTH_CLERK_CLIENT_SECRET="placeholder"`

## 2. Reinicio del Servicio
Reiniciaré PM2 para que Directus cargue la nueva configuración de seguridad.

## 3. Verificación
Podrás probar la integración desde tu frontend simplemente haciendo una llamada a la API con el header:
`Authorization: Bearer <TOKEN_DE_CLERK>`

Si el token es válido, Directus responderá con los datos y creará el usuario en su base de datos si no existe.
