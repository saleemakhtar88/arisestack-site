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
    encode gzip zstd
    tls /etc/ssl/cloudflare/arisestack.com.pem /etc/ssl/cloudflare/arisestack.com.key

    # --- security headers (see SECURITY.md for the rationale of each) ---
    header {
        # Force HTTPS for 2 years incl. subdomains (only enable once HTTPS is confirmed working)
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        # Lock what the page may load — no third parties except Google Fonts
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://formsubmit.co; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; upgrade-insecure-requests"
        # Anti-clickjacking (belt-and-braces with frame-ancestors)
        X-Frame-Options "DENY"
        # Stop MIME-type sniffing
        X-Content-Type-Options "nosniff"
        # Minimise referrer leakage
        Referrer-Policy "strict-origin-when-cross-origin"
        # Disable powerful browser features this site never uses
        Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
        # Don't advertise the server software
        -Server
    }

    # Block hidden files/dirs (.git, etc.) but keep /.well-known/ reachable
    @hidden {
        path /.*
        not path /.well-known/*
    }
    respond @hidden 404

    file_server
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

> **HSTS caveat:** only keep the `Strict-Transport-Security` line **after** you have
> confirmed `https://arisestack.com` loads correctly. Once a browser sees HSTS it will
> refuse plain HTTP for `max-age`, so shipping it before HTTPS works can lock users out.

## 5. Cloudflare-side hardening (dashboard, 5 minutes)

- **SSL/TLS → Overview:** mode **Full (strict)** ✅ (already set)
- **SSL/TLS → Edge Certificates:** enable **Always Use HTTPS**, **Automatic HTTPS Rewrites**, and set **Minimum TLS Version = 1.2**
- **Security → Settings:** Security Level **Medium/High**, enable **Bot Fight Mode**
- **Security → WAF:** ensure the **Cloudflare Managed Ruleset** is on (covers OWASP-style attacks — SQLi, XSS, path traversal — even though this static site has no such surface, it shields the shared origin)
- **Rules → Settings:** leave **Browser Integrity Check** on
- **Speed / Caching:** fine as default; the site is static so caching is safe

## 6. Lock down the origin (protects ALL sites on the box — bod, feedback, arisestack)

So nobody can bypass Cloudflare by hitting `31.12.74.172` directly. **Test the site
through the domain first**, then firewall ports 80/443 to Cloudflare's published ranges:

```bash
# Allow SSH first so you don't lock yourself out
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS ONLY from Cloudflare's IPv4 + IPv6 ranges
for ip in $(curl -s https://www.cloudflare.com/ips-v4); do sudo ufw allow from $ip to any port 80,443 proto tcp; done
for ip in $(curl -s https://www.cloudflare.com/ips-v6); do sudo ufw allow from $ip to any port 80,443 proto tcp; done

# Deny 80/443 from everyone else, then enable
sudo ufw default deny incoming
sudo ufw --force enable
sudo ufw status numbered
```

Plus a **catch-all Caddy block** at the very top of the Caddyfile so a direct-IP or
unknown-host request gets nothing (defence in depth if the firewall is ever changed):

```caddy
# FIRST block in the Caddyfile — anything not matching a real site name is refused
:80, :443 {
    tls /etc/ssl/cloudflare/arisestack.com.pem /etc/ssl/cloudflare/arisestack.com.key
    respond "" 444
}
```

> Cloudflare IP ranges change rarely; re-run the two `for` loops after a range update.
> Full rationale in the project notes (`origin-lockdown-security`).

A complete written audit of the site — findings, ratings, and status — is in
[SECURITY.md](SECURITY.md).
