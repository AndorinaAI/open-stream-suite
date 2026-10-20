#!/usr/bin/env bash
# ====================================================================
# OPEN STREAM SUITE — ASISTENTE AUTOMÁTICO VPS + REVERSE SSH TUNNEL
# ====================================================================
set -e

VPS_HOST="$1"       # ej: root@vps.tudominio.com o usuario@123.45.67.89
SUBDOMAIN="$2"      # ej: stream.tudominio.com
LOCAL_PORT="${3:-8080}"
VPS_PORT="${4:-8080}"

if [ -z "$VPS_HOST" ] || [ -z "$SUBDOMAIN" ]; then
    echo "Uso: ./scripts/setup_vps_tunnel.sh <usuario@vps> <subdominio> [puerto_local] [puerto_remoto_vps]"
    echo "Ejemplo: ./scripts/setup_vps_tunnel.sh root@vps.tudominio.com stream.tudominio.com"
    exit 1
fi

SUBDOMAIN=$(echo "$SUBDOMAIN" | sed -e 's|^[^/]*//||' -e 's|/.*$||')

echo "--------------------------------------------------------"
echo "🖥️  CONFIGURADOR AUTOMÁTICO DE TÚNEL VPS + NGINX/TRAEFIK"
echo "VPS: $VPS_HOST"
echo "Subdominio: $SUBDOMAIN"
echo "Redirigiendo: VPS:$VPS_PORT ➔ Localhost:$LOCAL_PORT"
echo "--------------------------------------------------------"

# 1. Generar bloque de Nginx para el VPS
NGINX_CONF_FILE="scripts/nginx_${SUBDOMAIN}.conf"
cat <<EOF > "$NGINX_CONF_FILE"
# ====================================================================
# Configuración Nginx para tu VPS ($SUBDOMAIN)
# Guardar en: /etc/nginx/sites-available/$SUBDOMAIN
# Activar con: sudo ln -s /etc/nginx/sites-available/$SUBDOMAIN /etc/nginx/sites-enabled/
# Certificado SSL: sudo certbot --nginx -d $SUBDOMAIN
# ====================================================================

server {
    server_name $SUBDOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$VPS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
EOF
echo "✓ 1/3 Archivo de configuración Nginx generado en: $NGINX_CONF_FILE"

# 2. Generar servicio systemd local para que el túnel SSH nunca se caiga y auto-reconecte
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_USER_DIR"
SERVICE_FILE="$SYSTEMD_USER_DIR/taller-vps-tunnel.service"

cat <<EOF > "$SERVICE_FILE"
[Unit]
Description=Open Stream Suite Reverse SSH Tunnel hacia VPS ($SUBDOMAIN)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/ssh -N -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R $VPS_PORT:localhost:$LOCAL_PORT $VPS_HOST
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF
echo "✓ 2/3 Servicio systemd local generado en: $SERVICE_FILE"

# 3. Actualizar donations_config.json
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$DIR/donations_config.json" ]; then
    python3 -c "
import json
try:
    with open('$DIR/donations_config.json', 'r') as f:
        d = json.load(f)
    d['tunnelUrl'] = 'https://$SUBDOMAIN'
    with open('$DIR/donations_config.json', 'w') as f:
        json.dump(d, f, indent=2)
    print('✓ Configuración del panel actualizada a https://$SUBDOMAIN')
except Exception as e:
    pass
"
fi

echo "--------------------------------------------------------"
echo "🎉 ¡LISTO! Sigue estos 2 sencillos pasos:"
echo ""
echo "👉 En tu VPS:"
echo "   1. Copia $NGINX_CONF_FILE a /etc/nginx/sites-available/$SUBDOMAIN"
echo "   2. Ejecuta: sudo certbot --nginx -d $SUBDOMAIN (para SSL gratis)"
echo ""
echo "👉 En tu PC Local (para activar el túnel automático):"
echo "   systemctl --user daemon-reload"
echo "   systemctl --user enable --now taller-vps-tunnel.service"
echo ""
echo "Estado del túnel: systemctl --user status taller-vps-tunnel.service"
echo "--------------------------------------------------------"
