#!/bin/bash
# Script to update Nginx client_max_body_size for api.mevoyajapon.com

CONFIG_FILE="/etc/nginx/sites-available/api.mevoyajapon.com"

echo "Updating Nginx configuration for upload limit..."

if grep -q "client_max_body_size" "$CONFIG_FILE"; then
    echo "client_max_body_size already exists in $CONFIG_FILE. Checking value..."
    grep "client_max_body_size" "$CONFIG_FILE"
else
    echo "Adding client_max_body_size 50M to $CONFIG_FILE"
    # Insert after 'root ...;' line
    sudo sed -i '/root \/var\/www\/api.mevoyajapon.com;/a \    \n    # Increase upload size limit\n    client_max_body_size 50M;' "$CONFIG_FILE"
fi

echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    echo "Done! Upload limit increased to 50MB."
else
    echo "Nginx configuration test failed. Please check the config file manually."
    exit 1
fi
