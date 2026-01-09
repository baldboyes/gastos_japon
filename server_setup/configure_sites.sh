#!/bin/bash
set -e

# Log output
exec > >(tee -i /var/log/site_config.log)
exec 2>&1

echo "Starting Site Configuration..."

# 1. Database Setup
echo "Configuring PostgreSQL..."
# Switch to postgres user to run psql
# Check if user exists first to avoid error
if ! sudo -u postgres psql -t -c '\du' | grep -qw directus; then
    sudo -u postgres psql -c "CREATE USER directus WITH PASSWORD 'DirectusPass2025!Secure';"
    sudo -u postgres psql -c "CREATE DATABASE directus OWNER directus;"
    echo "Database and user created."
else
    echo "User directus already exists."
fi

# 2. Nginx Configuration for mevoyajapon.com
echo "Configuring Nginx for mevoyajapon.com..."
cat <<EOF > /etc/nginx/sites-available/mevoyajapon.com
server {
    listen 80;
    server_name mevoyajapon.com www.mevoyajapon.com;
    root /var/www/mevoyajapon.com/html;
    index index.html index.htm;

    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

# 3. Nginx Configuration for api.mevoyajapon.com
echo "Configuring Nginx for api.mevoyajapon.com..."
cat <<EOF > /etc/nginx/sites-available/api.mevoyajapon.com
server {
    listen 80;
    server_name api.mevoyajapon.com;
    root /var/www/api.mevoyajapon.com;

    # Increase upload size limit to 50MB
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:8055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable sites
ln -sf /etc/nginx/sites-available/mevoyajapon.com /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.mevoyajapon.com /etc/nginx/sites-enabled/

# Disable default if exists
rm -f /etc/nginx/sites-enabled/default

# Test and Reload
nginx -t
systemctl reload nginx

# 4. Firewall
echo "Configuring UFW..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
# We assume we are connected via SSH, enabling UFW shouldn't kill us if we allowed OpenSSH
echo "y" | ufw enable

# 5. Certbot
echo "Installing and Running Certbot..."
apt-get install -y certbot python3-certbot-nginx

# Request certificates
# We use --non-interactive and --agree-tos. We need an email. 
# I'll use a placeholder email admin@mevoyajapon.com
certbot --nginx -d mevoyajapon.com -d www.mevoyajapon.com --non-interactive --agree-tos -m admin@mevoyajapon.com --redirect

certbot --nginx -d api.mevoyajapon.com --non-interactive --agree-tos -m admin@mevoyajapon.com --redirect

# 6. Maintenance Scripts
echo "Creating backup script..."
mkdir -p /home/ubuntu/scripts
cat <<EOF > /home/ubuntu/scripts/backup.sh
#!/bin/bash
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p \$BACKUP_DIR

# Backup Nginx
cp -r /etc/nginx/sites-available \$BACKUP_DIR/nginx_sites_\$TIMESTAMP

# Backup DB
pg_dump -U directus -h localhost directus > \$BACKUP_DIR/db_directus_\$TIMESTAMP.sql
# Note: This requires .pgpass or password in env. 
# For now, we rely on peer auth or manual setup, but let's set PGPASSWORD env var for the script
EOF
chmod +x /home/ubuntu/scripts/backup.sh

echo "Site Configuration Complete!"
