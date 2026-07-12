# arisestack.com — Under-Construction Page

The landing page served at **https://arisestack.com** while the full site is being built.

Static site — no build step, no dependencies, no server-side code. Caddy serves the
files directly.

```
index.html          the page (self-contained CSS/JS)
assets/
  logo.png          AriseStack mark, transparent (from the brand kit)
  mark.svg          AriseStack mark, vector
  lockup.svg        full logo lockup, vector
  favicon.ico       browser tab icon
  icon-1024.png     app icon / apple-touch-icon
  og.jpg            social-share preview image (Open Graph)
```

Brand palette (from the AriseStack Brand Guide): background `#161210`, deep copper
`#92400E`, amber `#D97706`, gold `#FCD34D`, warm white `#FEF8EC`, taupe `#9A8163`.
Fonts: Sora (wordmark), Space Grotesk (labels), Outfit (body) — loaded from Google Fonts.

**Deploying to the VPS:** see [DEPLOY.md](DEPLOY.md).

**Local preview:** `python -m http.server 8931` in the repo root, then open
http://127.0.0.1:8931/ (opening index.html via `file://` also works, minus the fonts).
