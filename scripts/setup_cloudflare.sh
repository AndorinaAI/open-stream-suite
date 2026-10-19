#!/usr/bin/env bash
# ====================================================================
# TALLER LIVE — ASISTENTE AUTOMÁTICO CLOUDFLARE TUNNEL
# ====================================================================
set -e

SUBDOMAIN="$1"
PORT="${2:-8080}"
TUNNEL_NAME="${3:-taller-stream}"

if [ -z "$SUBDOMAIN" ]; then
    echo "Uso: ./scripts/setup_cloudflare.sh <subdominio.com> [puerto_local] [nombre_tunel]"
    echo "Ejemplo: ./scripts/setup_cloudflare.sh stream.tudominio.com 8080"
    exit 1
fi

# Limpiar prefijo https:// si viene incluido
SUBDOMAIN=$(echo "$SUBDOMAIN" | sed -e 's|^[^/]*//||' -e 's|/.*$||')

echo "--------------------------------------------------------"
echo "🚀 CONFIGURADOR AUTOMÁTICO DE CLOUDFLARE TUNNEL"
echo "Subdominio: $SUBDOMAIN"
echo "Puerto Local: $PORT"
echo "--------------------------------------------------------"

# 1. Instalar cloudflared si no está instalado
if ! command -v cloudflared &>/dev/null; then
    echo "📦 1/5 Instalando cloudflared oficial en tu sistema..."
    TMP_DEB=$(mktemp /tmp/cloudflared-XXXXXX.deb)
    curl -fsSL -o "$TMP_DEB" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i "$TMP_DEB" || true
    rm -f "$TMP_DEB"
else
    echo "✓ 1/5 cloudflared ya está instalado."
fi

# 2. Login si no existe cert.pem
if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
    echo "🔑 2/5 Iniciando sesión en Cloudflare..."
    echo "👉 Se abrirá tu navegador para que selecciones tu dominio y autorices."
    cloudflared tunnel login
else
    echo "✓ 2/5 Sesión de Cloudflare activa detectada (~/.cloudflared/cert.pem)."
fi

# 3. Crear el túnel si no existe
echo "🛠️ 3/5 Verificando o creando túnel '$TUNNEL_NAME'..."
cloudflared tunnel create "$TUNNEL_NAME" 2>/dev/null || true

TUNNEL_ID=$(cloudflared tunnel list | grep -E "\b$TUNNEL_NAME\b" | awk '{print $1}' | head -n 1)
if [ -z "$TUNNEL_ID" ]; then
    echo "❌ No se pudo obtener el ID del túnel '$TUNNEL_NAME'."
    exit 1
fi
echo "✓ Túnel ID: $TUNNEL_ID"

# 4. Enrutar el DNS automáticamente
echo "🌐 4/5 Enrutando DNS de Cloudflare para $SUBDOMAIN..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$SUBDOMAIN" 2>/dev/null || true

# 5. Generar archivo de configuración config.yml
mkdir -p "$HOME/.cloudflared"
cat <<EOF > "$HOME/.cloudflared/config.yml"
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $SUBDOMAIN
    service: http://localhost:$PORT
  - service: http_status:404
EOF
echo "✓ 5/5 Archivo de configuración guardado en ~/.cloudflared/config.yml"

# 6. Actualizar donations_config.json
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
    print('Aviso:', e)
"
fi

echo "--------------------------------------------------------"
echo "🎉 ¡CONFIGURACIÓN COMPLETADA CON ÉXITO!"
echo ""
echo "Para arrancar el túnel ahora mismo, ejecuta:"
echo "   cloudflared tunnel run"
echo ""
echo "O para que arranque SOLO con el ordenador (Servicio permanente en segundo plano):"
echo "   sudo cloudflared service install"
echo "--------------------------------------------------------"
