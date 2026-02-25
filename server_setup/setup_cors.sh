#!/bin/bash
set -e

ENV_FILE="/var/www/directus.jizou.io/.env"

echo "Configuring CORS..."

# Backup .env
cp $ENV_FILE $ENV_FILE.bak.cors

# Clean previous CORS configs if any
sed -i '/^CORS_/d' $ENV_FILE

# Append CORS configuration
# We enable CORS for all origins for simplicity in dev/prod hybrid usage, 
# or we could specify localhost:3000,mevoyajapon.com
cat <<EOF >> $ENV_FILE

# CORS Configuration
CORS_ENABLED="true"
CORS_ORIGIN="true"
CORS_METHODS="GET,POST,PATCH,DELETE,OPTIONS"
CORS_HEADERS="Content-Type,Authorization"
CORS_EXPOSED_HEADERS="Content-Range"
CORS_CREDENTIALS="true"
EOF

echo "Configuration applied. Restarting Directus..."
pm2 restart directus-api

echo "CORS Setup Complete!"
