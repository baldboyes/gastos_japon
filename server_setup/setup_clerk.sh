#!/bin/bash
set -e

ENV_FILE="/var/www/directus.jizou.io/.env"
ISSUER_URL="https://full-adder-12.clerk.accounts.dev"

echo "Configuring Clerk Authentication..."

# Backup .env
cp $ENV_FILE $ENV_FILE.bak

# Check if AUTH_PROVIDERS exists, if so, replace/update, else append
if grep -q "AUTH_PROVIDERS" $ENV_FILE; then
    # We will just append the specific clerk configs if they don't exist, 
    # but to be safe and clean, let's append them to the end if not present
    echo "Updating existing configuration..."
else
    echo "Appending Clerk configuration..."
fi

# Append config (simplest way to ensure it's there, Directus takes last value if duplicated usually, 
# but better to check. For simplicity in this script, we append.
# A cleaner way is to remove lines starting with AUTH_CLERK and append new ones.)

sed -i '/^AUTH_PROVIDERS=/d' $ENV_FILE
sed -i '/^AUTH_CLERK_/d' $ENV_FILE

cat <<EOF >> $ENV_FILE

# Clerk Authentication
AUTH_PROVIDERS="clerk"
AUTH_CLERK_DRIVER="openid"
AUTH_CLERK_ISSUER_URL="$ISSUER_URL"
AUTH_CLERK_CLIENT_ID="directus"
AUTH_CLERK_CLIENT_SECRET="placeholder"
AUTH_CLERK_IDENTIFIER_KEY="email"
AUTH_CLERK_ALLOW_PUBLIC_REGISTRATION="true"
EOF

echo "Configuration applied. Restarting Directus..."
pm2 restart directus-api

echo "Clerk Setup Complete!"
