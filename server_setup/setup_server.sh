#!/bin/bash
set -e

# Log output
exec > >(tee -i /var/log/server_setup.log)
exec 2>&1

echo "Starting Server Configuration..."

# 1. Update System
echo "Updating system..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# 2. Install Basic Tools
echo "Installing basic tools..."
apt-get install -y git curl wget unzip build-essential acl

# 3. Install Nginx
echo "Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# 4. Install Node.js v22
echo "Installing Node.js v22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node -v
npm -v

# 5. Install PM2
echo "Installing PM2..."
npm install -g pm2

# 6. Install PostgreSQL
echo "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# 7. Setup Directories
echo "Setting up directories..."
mkdir -p /var/www/mevoyajapon.com/html
mkdir -p /var/www/directus.jizou.io

# Create a placeholder index.html for main domain
echo "<h1>Bienvenido a mevoyajapon.com</h1><p>Sitio en construcción.</p>" > /var/www/mevoyajapon.com/html/index.html

# Create a placeholder for API (just a simple json file for now to test)
echo '{"status": "API Ready"}' > /var/www/directus.jizou.io/index.json

# 8. Permissions
echo "Setting permissions..."
# Ensure www-data group exists (it should with nginx installed)
chown -R ubuntu:www-data /var/www/mevoyajapon.com
chown -R ubuntu:www-data /var/www/directus.jizou.io
chmod -R 775 /var/www/mevoyajapon.com
chmod -R 775 /var/www/directus.jizou.io

# Add ubuntu to www-data group just in case
usermod -aG www-data ubuntu

echo "Phase 1 Setup Complete!"
