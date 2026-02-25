#!/bin/bash
set -e

# Log output
exec > >(tee -i /var/log/directus_install.log)
exec 2>&1

echo "Starting Directus Installation..."

PROJECT_DIR="/var/www/directus.jizou.io"
DB_USER="directus"
DB_PASS="DirectusPass2025!Secure"
DB_NAME="directus"
ADMIN_EMAIL="admin@mevoyajapon.com"
ADMIN_PASS="DirectusAdmin2026!"

# Generate random keys
KEY=$(openssl rand -base64 32)
SECRET=$(openssl rand -base64 32)

cd $PROJECT_DIR

echo "Initializing Node project..."
# Initialize package.json if not exists
if [ ! -f package.json ]; then
    npm init -y
fi

echo "Installing Directus..."
npm install directus pg

echo "Configuring environment..."
cat <<EOF > .env
HOST="0.0.0.0"
PORT=8055
KEY="$KEY"
SECRET="$SECRET"

ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_PASSWORD="$ADMIN_PASS"

DB_CLIENT="pg"
DB_HOST="localhost"
DB_PORT="5432"
DB_DATABASE="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASS"
DB_SSL=false

PUBLIC_URL="https://directus.jizou.io"
EOF

echo "Bootstrapping Database..."
# Run bootstrap to setup DB schema
npx directus bootstrap

echo "Configuring PM2..."
# Start Directus with PM2
# Check if already running
if pm2 list | grep -q "directus-api"; then
    pm2 restart directus-api
else
    pm2 start npx --name "directus-api" -- directus start
fi

# Save PM2 list and generate startup script
pm2 save
pm2 startup | tail -n 1 | bash || true # Execute the command pm2 startup tells us to run, ignore if fails (might need sudo manually if not root, but we run as root/sudo)

echo "Directus Installation Complete!"
