# 🌐 COMPLETE GUIDE: CONNECTING YOUR CUSTOM DOMAIN TO OPEN STREAM SUITE
> **Abridged translation.** This English version is a summary. The canonical, complete guide is [Español](DOMINIO_PROPIO_Y_WEBHOOKS.md).

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

---

## 🥉 METHOD 3 (Zero cost): a permanent public URL without buying a domain

You do **not** need to buy a domain to receive webhooks: PayPal, Ko-fi and Buy Me a
Coffee only require a **public, stable HTTPS URL**, and there are free ways to get one.

> ⚠️ **What to avoid**: one-click tunnels with a temporary domain (`*.trycloudflare.com`,
> random ngrok subdomains, `localtunnel`…). They change on every restart, so you would have
> to paste the new URL into each platform **every time**. With the options below you paste
> the URLs **once**.

| Option | Own domain? | Cost | Stable URL | Open ports |
|---|---|---|---|---|
| METHOD 1: Cloudflare Tunnel + domain | Yes | domain (~€10-15/year) | ✅ | No |
| **Option A: ngrok free static domain** | **No** | **€0** | ✅ | No |
| **Option B: Tailscale Funnel** | **No** | **€0** | ✅ | No |
| Option C: DDNS (DuckDNS) + Caddy | No (free hostname) | €0 | ✅ | Yes (80/443) |
| Own VPS | Yes | ~€4-5/month | ✅ | No |
| Quick tunnel (temporary) | No | €0 | ❌ | No |

### 🅰️ Option A — ngrok free static domain (fastest)
1. Create a free [ngrok](https://ngrok.com/) account and copy your **authtoken** and your
   **free static domain** (something like `something.ngrok-free.app`).
2. Install the client and authenticate:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```
3. Publish the app port **always with that same domain**:
   ```bash
   ngrok http 8080 --url=https://something.ngrok-free.app
   ```
   *(Older ngrok versions use `--domain` instead of `--url`.)*
4. Paste `https://something.ngrok-free.app` into the panel and use the URLs it generates.

> **Pros**: ✅ €0 · ✅ stable URL without buying anything · ✅ no open ports · ✅ home IP hidden.
> **Keep in mind**: the free plan has usage limits (far beyond donation webhooks) and the
> tunnel must be running when you want to receive donations.

### 🅱️ Option B — Tailscale Funnel (free, no domain, no open ports)
1. Create a free [Tailscale](https://tailscale.com/) account and install the client.
2. Sign in and publish the app port:
   ```bash
   tailscale up
   tailscale funnel 8080
   ```
   *(The first time it asks you to enable **Funnel/HTTPS** for the machine: accept the link.)*
3. You get a stable URL like `https://your-machine.your-tailnet.ts.net`. Paste it in the panel.

> **Pros**: ✅ €0 · ✅ automatic HTTPS · ✅ permanent stable URL · ✅ router untouched.
> **Keep in mind**: the address carries your tailnet name (less "pretty" than your own
> domain, but perfectly valid for webhooks).

### 🅲 Option C — Free DDNS hostname (DuckDNS) + Caddy
1. Create a free hostname at [DuckDNS](https://www.duckdns.org/) (e.g. `mystream.duckdns.org`)
   and keep its **updater** running so it always points at your public IP.
2. Forward ports **80** and **443** on your router to your PC (as in METHOD 2).
3. Install Caddy and use your hostname in the `Caddyfile`:
   ```caddy
   mystream.duckdns.org {
       reverse_proxy localhost:8080
   }
   ```
4. Paste `https://mystream.duckdns.org` into the panel.

> **Pros**: ✅ €0 with your own hostname (DuckDNS-branded).
> **Keep in mind**: it requires **open ports** and **exposes your public IP**, so it is the
> last option if privacy matters to you.

### 🔎 Notes that apply to every method
- **Streamlabs needs none of this**: it connects through its *socket* with your token, so
  its donations work with no domain, no tunnel and no URLs to paste.
- Whichever tunnel you use, you paste **one base address** in the panel and it generates the
  **three full URLs** (Ko-fi, PayPal and Buy Me a Coffee).
- **Changing the URL is not enough in the panel**: you must update it in each platform too.
  Pick a **stable** URL from the start.
- Configure each webhook **secret** (Ko-fi, BMC, PayPal) so nobody can inject fake donations:
  see [`WEBHOOKS_SEGURIDAD.md`](WEBHOOKS_SEGURIDAD.md).
