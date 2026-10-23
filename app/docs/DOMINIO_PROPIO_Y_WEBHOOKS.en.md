# 🌐 COMPLETE GUIDE: CONNECTING YOUR CUSTOM DOMAIN TO OPEN STREAM SUITE
## How to Receive Ko-fi, PayPal & Buy Me a Coffee Webhooks on Your Local PC with Permanent HTTPS

<p align="center">
  <a href="DOMINIO_PROPIO_Y_WEBHOOKS.md">Español</a> | <b>English</b>
</p>

This guide explains how to route a **custom domain** (e.g. `stream.yourdomain.com` or `alerts.mysite.com`) directly to your local **Open Stream Suite** server (port `8080`), **permanently**, **for free**, and **with valid HTTPS certificates**.

---

## ⚠️ Why Is This Configuration Needed?

1. **Your PC Sits on a Private Local Network (`localhost` / `192.168.x.x`)**:
   External web servers from Ko-fi, PayPal, or Buy Me a Coffee cannot push requests to `http://localhost:8080` because loopback addresses exist only inside your local machine.
2. **Payment Gateways Enforce HTTPS**:
   For security, webhook providers reject unencrypted `http://` webhook endpoints. A valid SSL/TLS certificate (`https://`) is strictly required.

---

## 🏆 METHOD 1 (Recommended): Cloudflare Tunnel with Your Domain

> **Advantages**:
> - ✅ **Zero Open Ports**: No router port forwarding or firewall modifications required.
> - ✅ **Home IP Remains 100% Hidden**: Total protection against DDoS attacks or geo-location leaks.
> - ✅ **Dynamic IP Resilient**: Works smoothly even when residential ISP IP addresses rotate.
> - ✅ **Automatic Free SSL Certificate**: Managed and auto-renewed by Cloudflare.
> - ✅ **100% Free** (with any standard Cloudflare account).

---

### ⚡ Automated 1-Click Setup Assistant (Recommended):
The suite includes an automated assistant script in `scripts/setup_cloudflare.sh` that installs the connector, logs in, creates the tunnel, and routes your DNS:
```bash
./scripts/setup_cloudflare.sh stream.yourdomain.com 8080
```

---

### 🖥️ Alternative via Your Own VPS Server (`scripts/setup_vps_tunnel.sh`):
If you operate your own cloud VPS (Hetzner, DigitalOcean, OVH, etc.) and prefer an independent SSH reverse tunnel:
```bash
./scripts/setup_vps_tunnel.sh user@vps.yourdomain.com stream.yourdomain.com 8080 8080
```
This script automatically generates:
1. An Nginx reverse proxy configuration block with WebSocket pass-through (`scripts/nginx_stream.yourdomain.com.conf`).
2. A persistent local `systemd` user service (`~/.config/systemd/user/taller-vps-tunnel.service`) with automatic auto-reconnect.

---

### Manual Step-by-Step for Linux (Ubuntu / Debian / Mint):

#### 1. Install the Official `cloudflared` Connector
Open a terminal and execute:
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```

#### 2. Log In to Cloudflare
```bash
cloudflared tunnel login
```
Select your domain to authorize the connection. The certificate will be stored at `~/.cloudflared/cert.pem`.

#### 3. Create a Permanent Tunnel
```bash
cloudflared tunnel create my-stream
```

#### 4. Route Your Subdomain
```bash
cloudflared tunnel route dns my-stream stream.yourdomain.com
```

#### 5. Configure the Tunnel
Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <YOUR-TUNNEL-UUID>
credentials-file: /home/<user>/.cloudflared/<YOUR-TUNNEL-UUID>.json

ingress:
  - hostname: stream.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

#### 6. Run the Tunnel Service
```bash
cloudflared tunnel run my-stream
```
Your local Open Stream Suite is now securely reachable from anywhere at `https://stream.yourdomain.com`!
