# Deploying arisestack.com to the VPS

The VPS (31.12.74.172) already serves **bod.sial.com.pk** and **feedback.sial.com.pk**
through Caddy. Adding arisestack.com is one more site block in the same Caddyfile —
**do not touch the existing site blocks or the pm2 apps.** This site is static files
only; it uses no port and cannot clash with the apps on :3000.

## 1. Clone the site

```bash
cd ~
git clone https://github.com/saleemakhtar88/arisestack-site.git
# later updates:  cd ~/arisestack-site && git pull
```

## 2. Cloudflare Origin Certificate (recommended)

Cloudflare dashboard → arisestack.com → **SSL/TLS → Origin Server → Create Certificate**
→ RSA, hosts `arisestack.com, *.arisestack.com`, 15 years. Save the two blocks on the VPS:

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/arisestack.com.pem   # paste the Origin Certificate
sudo nano /etc/ssl/cloudflare/arisestack.com.key   # paste the Private Key
sudo chmod 600 /etc/ssl/cloudflare/arisestack.com.key
```

Then in Cloudflare: **SSL/TLS → Overview → set mode to “Full (strict)”.**

## 3. Caddy site block

Append to the Caddyfile (usually `/etc/caddy/Caddyfile`):

```caddy
arisestack.com, www.arisestack.com {
    root * /home/YOUR_USER/arisestack-site
    file_server
    encode gzip
    tls /etc/ssl/cloudflare/arisestack.com.pem /etc/ssl/cloudflare/arisestack.com.key

    header {
        X-Content-Type-Options nosniff
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

Replace `YOUR_USER` with the actual home directory, then validate and reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

> Alternative to step 2: omit the `tls` line entirely and let Caddy fetch a Let's
> Encrypt certificate automatically. This works behind Cloudflare's proxy via the
> HTTP-01 challenge, but renewals can break once the origin firewall is locked down
> to Cloudflare IP ranges — the Origin Certificate avoids that, which is why it is
> the recommended path.

## 4. Verify

```bash
curl -sI https://arisestack.com | head -5        # expect HTTP/2 200 via Cloudflare
```

If the browser still shows the old GoDaddy page, it is DNS/browser cache — the
nameserver change (2026-07-12) can take up to ~48 h to reach every resolver.
Hard-refresh (Ctrl+Shift+R) or test from another network.

## 5. (Later) Lock down the origin

Once the site works: firewall ports 80/443 to Cloudflare's published IP ranges only,
and add a catch-all Caddy block so direct-IP requests get nothing. Planned in the
My-ARISESTACK project notes (`origin-lockdown-security`).
