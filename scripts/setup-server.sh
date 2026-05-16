#!/bin/bash
# One-shot Ubuntu server setup for prestige-assets
# Run as root: bash setup-server.sh
set -e

REPO="https://github.com/youngy911-ops/prestige-assets.git"
APP_DIR="/var/www/prestige-assets"
DOMAIN="assetbookintool.com"

echo "=== [1/7] Installing Node.js 20, Nginx, Git ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pm2

echo "=== [2/7] Cloning repo ==="
if [ -d "$APP_DIR" ]; then
  echo "Directory exists — pulling latest..."
  git -C "$APP_DIR" pull
else
  # If you have a GitHub token, run:
  #   GITHUB_TOKEN=ghp_xxx bash setup-server.sh
  if [ -n "$GITHUB_TOKEN" ]; then
    git clone "https://${GITHUB_TOKEN}@github.com/youngy911-ops/prestige-assets.git" "$APP_DIR"
  else
    git clone "$REPO" "$APP_DIR"
  fi
fi

echo "=== [3/7] Setting up environment variables ==="
if [ ! -f "$APP_DIR/.env.local" ]; then
  cp "$APP_DIR/.env.local.example" "$APP_DIR/.env.local"
  echo ""
  echo ">>> IMPORTANT: Fill in .env.local before continuing:"
  echo "    nano $APP_DIR/.env.local"
  echo ""
  echo "Required keys:"
  echo "  NEXT_PUBLIC_SUPABASE_URL"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  OPENAI_API_KEY"
  echo "  SALESFORCE_CLIENT_ID (optional for demo)"
  echo "  SALESFORCE_CLIENT_SECRET (optional for demo)"
  echo ""
  read -p "Press Enter once .env.local is filled in..."
else
  echo ".env.local already exists — skipping."
fi

echo "=== [4/7] Installing dependencies and building ==="
cd "$APP_DIR"
npm ci
npm run build

echo "=== [5/7] Starting app with PM2 ==="
pm2 delete prestige-assets 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || true

echo "=== [6/7] Configuring Nginx ==="
cp "$APP_DIR/nginx.conf" /etc/nginx/sites-available/prestige-assets
ln -sf /etc/nginx/sites-available/prestige-assets /etc/nginx/sites-enabled/prestige-assets
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "=== [7/7] SSL (requires DNS to be pointed first) ==="
echo ""
echo "If DNS for $DOMAIN already points to this server, run:"
echo "  apt install -y certbot python3-certbot-nginx"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "=== DONE ==="
echo "App running at http://$(curl -s ifconfig.me):3000"
echo "Once DNS is live: https://$DOMAIN"
pm2 status
