# 🌐 GUÍA COMPLETA: CONECTAR TU DOMINIO PROPIO A OPEN STREAM SUITE
## Cómo recibir Webhooks de Ko-fi, PayPal y Buy Me a Coffee en tu PC local con HTTPS permanente

<p align="center">
  <b>Español</b> | <a href="DOMINIO_PROPIO_Y_WEBHOOKS.en.md">English</a>
</p>

Esta guía explica detalladamente y paso a paso cómo hacer que un **dominio propio** (por ejemplo `stream.tudominio.com` o `alertas.miweb.es`) apunte directamente a tu servidor local de **Open Stream Suite** (puerto `8080`), de manera **permanente**, **gratuita** y **con HTTPS válido**.

---

## ⚠️ ¿Por qué es necesario configurar esto?

1. **Tu PC está en una red privada local (`localhost` / `192.168.x.x`)**:
   Los servidores de Ko-fi o PayPal en internet no pueden enviar peticiones a `http://localhost:8080` porque esa dirección solo existe dentro de tu ordenador.
2. **PayPal y Ko-fi exigen HTTPS obligatoriamente**:
   Por motivos de seguridad, las pasarelas de pago rechazan cualquier URL de webhook que empiece por `http://` no cifrado. Necesitas un certificado SSL (`https://`).

Existen dos formas de configurarlo. **El Método 1 (Cloudflare Tunnel) es el 100% recomendado para streamers**.

---

## 🏆 MÉTODO 1 (Recomendado): Cloudflare Tunnel con tu Dominio
> **Ventajas**:
> - ✅ **Cero puertos abiertos**: No tienes que entrar a la configuración de tu router ni tocar el firewall.
> - ✅ **Tu IP de casa queda 100% oculta**: Máxima protección contra ataques DDoS o filtración de tu ubicación real.
> - ✅ **Funciona aunque tu IP cambie** (IP dinámica habitual de fibra doméstica).
> - ✅ **HTTPS y certificado SSL automático y gratuito de por vida**.
> - ✅ **100% Gratis** (con cualquier cuenta gratuita de Cloudflare).

### Requisitos previos:
- Tener un dominio (por ejemplo comprado en Namecheap, GoDaddy, DonDominio, etc.).
- Tener los servidores DNS (Nameservers) de ese dominio apuntando a una cuenta gratuita de Cloudflare.

---

### ⚡ Vía Automática con Asistente (Recomendado):
La suite incluye un script en `scripts/setup_cloudflare.sh` que descarga el conector oficial, autoriza el dominio, genera el túnel y enruta el DNS automáticamente:
```bash
./scripts/setup_cloudflare.sh stream.tudominio.com 8080
```

---

### 🖥️ Vía Alternativa con Servidor VPS Propio (`scripts/setup_vps_tunnel.sh`):
Si ya dispones de tu propio servidor VPS en la nube (Hetzner, DigitalOcean, OVH, etc.) y prefieres no usar Cloudflare:
```bash
./scripts/setup_vps_tunnel.sh usuario@vps.tudominio.com stream.tudominio.com 8080 8080
```
Este asistente genera automáticamente:
1. El archivo de configuración de Nginx listo para tu subdominio con WebSockets (`scripts/nginx_stream.tudominio.com.conf`).
2. Un servicio `systemd` local con reconexión automática (`~/.config/systemd/user/taller-vps-tunnel.service`) para que el túnel inverso SSH se mantenga activo permanentemente sin interrupciones.

---

### Paso a Paso Manual para Linux (Ubuntu / Debian / Mint):

#### 1. Instalar el conector oficial `cloudflared`
Abre una terminal y ejecuta:
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```
*(Para Windows o macOS, descárgalo desde la página oficial de Cloudflare).*

#### 2. Iniciar sesión con tu cuenta de Cloudflare
```bash
cloudflared tunnel login
```
Te mostrará un enlace web. Al abrirlo, selecciona tu dominio en Cloudflare y autoriza la conexión. Se guardará un certificado de autorización en tu ordenador (`~/.cloudflared/cert.pem`).

#### 3. Crear tu túnel permanente
Dale un nombre identificativo a tu túnel, por ejemplo `mi-stream`:
```bash
cloudflared tunnel create mi-stream
```
*(Anotará un ID de túnel único, ej: `8b72e123-4567-...`)*.

#### 4. Asociar tu subdominio al túnel
Elige el subdominio que quieras usar (ej: `stream.tudominio.com`):
```bash
cloudflared tunnel route dns mi-stream stream.tudominio.com
```
*Cloudflare creará automáticamente el registro DNS CNAME apuntando a tu túnel sin que tengas que tocar nada manual.*

#### 5. Arrancar el túnel apuntando a tu servidor local (puerto 8080)
```bash
cloudflared tunnel run --url http://localhost:8080 mi-stream
```
¡Listo! En cuanto lo ejecutes, si abres en tu navegador `https://stream.tudominio.com/api/status`, verás la respuesta de tu servidor local con candado verde HTTPS seguro.

#### 6. (Opcional pero muy recomendado) Hacer que arranque solo al encender el PC
Para no tener que abrir la terminal cada vez que vayas a hacer directo:
```bash
sudo cloudflared service install
```
El túnel se ejecutará en segundo plano como servicio del sistema operativo cada vez que enciendas tu PC.

---

## 🛠️ MÉTODO 2 (Clásico): Registro DNS A + Reverse Proxy Caddy / Nginx

Si no quieres usar Cloudflare y prefieres dirigir el tráfico directamente a tu router:

### 1. Conocer tu IP pública actual
En tu terminal:
```bash
curl -s ifconfig.me
```

### 2. Crear el registro DNS en tu proveedor
En el panel de control de tu dominio (DonDominio, GoDaddy, OVH, etc.):
- **Tipo de registro**: `A`
- **Nombre / Host**: `stream` (o el subdominio que prefieras)
- **Valor / Destino**: Tu IP pública (obtenida en el paso anterior).
- **TTL**: 300 segundos (o automático).

*(Nota: Si tu proveedor de internet cambia tu IP pública periódicamente, necesitarás un cliente de IP dinámica como DuckDNS o ddclient).*

### 3. Abrir los puertos en tu router doméstico (Port Forwarding)
Accede a tu router (`http://192.168.1.1` habitualmente) y en la sección **Reenvío de Puertos / Port Forwarding / Servidor Virtual**:
- Puerto externo `80` (TCP) ➔ IP local de tu PC (ej. `192.168.1.50`), puerto interno `80`.
- Puerto externo `443` (TCP) ➔ IP local de tu PC, puerto interno `443`.

### 4. Instalar Caddy (Emite certificados HTTPS válidos de forma 100% automática)
Caddy es el servidor web más sencillo para Linux y gestiona los certificados Let's Encrypt sin configuración:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Edita `/etc/caddy/Caddyfile`:
```caddy
stream.tudominio.com {
    reverse_proxy localhost:8080
}
```

Reinicia Caddy:
```bash
sudo systemctl reload caddy
```
Caddy se conectará a Let's Encrypt, obtendrá el certificado SSL gratis y reenviará todo el tráfico de `https://stream.tudominio.com` a `http://localhost:8080`.

---

## 📋 Configuración Final en el Panel de Open Stream Suite

Una vez que tu dominio `https://stream.tudominio.com` responda correctamente en internet:

1. Abre el panel de control: `http://localhost:8080/alerts/panel.html`.
2. Pulsa en el botón **💳 Donaciones**.
3. En la **Pestaña 2: Dominio Propio / Webhooks**, introduce tu dirección:
   ```text
   https://stream.tudominio.com
   ```
4. Haz clic en **💾 Guardar URL**.
5. El panel generará tus 3 URLs permanentes:
   - **Ko-fi**: `https://stream.tudominio.com/api/webhooks/kofi`
   - **PayPal**: `https://stream.tudominio.com/api/webhooks/paypal`
   - **Buy Me a Coffee**: `https://stream.tudominio.com/api/webhooks/buymeacoffee`
6. Copia cada URL y pégala en los ajustes de desarrollador / webhooks de cada plataforma.

---

## 🧪 Cómo Comprobar que Todo Funciona

Puedes enviar una prueba con `curl` desde cualquier sitio de internet (incluso desde tu móvil desconectado del WiFi):

```bash
curl -X POST https://stream.tudominio.com/api/webhooks/tip \
  -H "Content-Type: application/json" \
  -d '{"platform":"kofi","user":"PruebaExterna","amount":"5.00","currency":"EUR","message":"¡Probando dominio!"}'
```

Si todo está bien configurado, la notificación aparecerá inmediatamente en tu **Ticker de OBS** y en el monitor en vivo.
