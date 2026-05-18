#!/usr/bin/env bash
set -euo pipefail
APP_DIR=${APP_DIR:-/var/www/mediavault/backend}
DB_NAME=${DB_NAME:-mediavault}
DB_USER=${DB_USER:-mediavault_app}
DB_PASS=${DB_PASS:-CHANGE_ME_DB_PASSWORD}
if [ -f /etc/os-release ]; then . /etc/os-release; else echo "Unsupported OS"; exit 1; fi
if [[ "$ID" == "amzn" ]]; then
  sudo dnf update -y
  sudo dnf install -y git nginx postgresql15 postgresql15-server postgresql15-contrib
  if [ ! -d /var/lib/pgsql/data/base ]; then sudo postgresql-setup --initdb; fi
  sudo systemctl enable --now postgresql nginx
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
  sudo dnf install -y nodejs
elif [[ "$ID" == "ubuntu" ]]; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg git nginx postgresql postgresql-contrib
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  sudo systemctl enable --now postgresql nginx
else echo "Unsupported OS: $ID"; exit 1; fi
sudo npm i -g pm2
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
sudo -u postgres psql -d "${DB_NAME}" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" /var/www/mediavault
sudo tee /etc/nginx/conf.d/mediavault-api.conf >/dev/null <<'NGINX'
server {
  listen 80;
  server_name _;
  client_max_body_size 60m;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
NGINX
sudo nginx -t && sudo systemctl reload nginx
pm2 startup systemd -u "$USER" --hp "$HOME" || true
printf '\nDONE. DATABASE_URL=postgresql://%s:%s@localhost:5432/%s?schema=public\n' "$DB_USER" "$DB_PASS" "$DB_NAME"
