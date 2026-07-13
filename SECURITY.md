# Security Audit & Hardening — arisestack.com

**Scope:** the public marketing website `arisestack.com` (static HTML/CSS/JS served by
Caddy, behind Cloudflare). **Date:** 2026-07-13. **Type:** code review + configuration
hardening (grey-box VAPT of a static site).

## TL;DR

The site is a **static brochure** — no database, no server-side code, no login, no
forms, no cookies, no user input, and no third-party JavaScript. That removes the
entire class of attacks that break most websites (SQL injection, auth bypass, XSS via
stored input, SSRF, deserialization, etc.). What remains is **transport, headers, and
origin exposure** — all now hardened below.

**Residual risk after hardening: Low.**

## 1. Application-layer review (the code)

| Check | Result |
|-------|--------|
| Inline `<script>` / `eval` / `document.write` | ✅ None — all JS is one external file, so a strict `script-src 'self'` CSP applies |
| `innerHTML` / DOM-injection sinks | ✅ None — JS only sets classes and CSSOM styles, never HTML |
| Inline event handlers (`onclick`, `onerror`) | ✅ None |
| User input / forms / query-string handling | ✅ None — nothing to inject into |
| `target="_blank"` tab-nabbing | ✅ Both external links carry `rel="noopener"` |
| Mixed content (`http://` assets) | ✅ None — the only `http://` is an SVG XML namespace, not a request |
| Secrets in the repo | ✅ None — the origin TLS **private key lives only on the VPS** (`/etc/ssl/cloudflare/`), never committed |
| Dependencies / supply chain | ✅ Zero JS libraries. Only external resource is Google Fonts (CSS + woff2), pinned in CSP |

**Verdict:** clean. No code-level vulnerabilities found.

## 2. HTTP security headers (added in the Caddy config — see DEPLOY.md)

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | The big one. `script-src 'self'` blocks any injected/third-party JS; `frame-ancestors 'none'` blocks framing; `object-src 'none'`, `base-uri 'none'`, `form-action 'none'` close remaining vectors. Only Google Fonts hosts are allowlisted. |
| `Strict-Transport-Security` | Forces HTTPS for 2 years (+ subdomains, preload-ready). Stops SSL-strip / downgrade. |
| `X-Frame-Options: DENY` | Anti-clickjacking (legacy backup to `frame-ancestors`). |
| `X-Content-Type-Options: nosniff` | Stops MIME-sniffing content attacks. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` — minimises URL leakage to other sites. |
| `Permissions-Policy` | Disables camera, mic, geolocation, payment, USB, FLoC — none are used. |
| `-Server` | Removes the server-software banner (less fingerprinting). |

> Known accepted item: `style-src` keeps `'unsafe-inline'`. This is standard for sites
> using Google Fonts and is **low risk** — CSS cannot execute JavaScript. Script
> execution, the actual XSS vector, is fully locked to `'self'`. To reach an A+ with
> zero `unsafe-inline`, self-host the fonts (see §5).

## 3. Transport / TLS

- Cloudflare SSL mode **Full (strict)** — encrypted and certificate-validated end to end. ✅
- Origin uses a **Cloudflare Origin Certificate** (RSA, expires 2041). ✅
- Recommended in DEPLOY.md §5: **Min TLS 1.2**, **Always Use HTTPS**, HSTS. ✅

## 4. Infrastructure / origin exposure

| Item | Status |
|------|--------|
| Traffic proxied through Cloudflare (real IP hidden) | ✅ Orange-cloud, WAF + DDoS in front |
| Cloudflare **WAF managed ruleset + Bot Fight Mode** | ⏳ enable in dashboard (DEPLOY.md §5) |
| **Origin firewall** — 80/443 only from Cloudflare IPs | ⏳ **highest-value remaining task** (DEPLOY.md §6) — until done, someone who learns `31.12.74.172` can bypass Cloudflare entirely and reach the shared box (which also hosts a sensitive portal) |
| Catch-all Caddy block (`444` for unknown host / direct IP) | ⏳ DEPLOY.md §6 |
| Directory listing | ✅ Caddy `file_server` never lists directories |
| Hidden-file exposure (`.git/`, dotfiles) | ✅ Blocked (returns 404); only `/.well-known/` is reachable |
| Server software banner | ✅ Stripped |

## 5. Optional upgrade — A+ / zero third parties

Self-host the three fonts (Sora, Space Grotesk, Outfit) as local `woff2` files. Then the
CSP can drop the Google hosts and `'unsafe-inline'` entirely
(`style-src 'self'`), removing the only external dependency for a perfect score and
better privacy (no Google request from visitors). Ask and I'll do it.

## 6. What was NOT applicable (and why)

Because the site is static with no dynamic surface, these common VAPT findings **do not
exist here**: SQL/NoSQL injection, command injection, authentication/session flaws,
IDOR, CSRF (no state-changing endpoints), file-upload abuse, SSRF, XXE, rate-limiting
of app endpoints (Cloudflare handles edge rate-limiting). If a contact form or any
dynamic feature is added later, this audit must be revisited.

## Action checklist

- [x] Security headers + CSP in the Caddy config
- [x] Dotfile/`.git` blocking
- [x] `robots.txt`, `sitemap.xml`, `security.txt`
- [x] Origin Certificate + Full (strict) SSL
- [ ] **Enable Cloudflare WAF managed ruleset + Bot Fight Mode** (dashboard)
- [ ] **Lock the origin firewall to Cloudflare IPs + catch-all 444** ← do this next
- [ ] (Optional) self-host fonts for a strict-`style-src` CSP
