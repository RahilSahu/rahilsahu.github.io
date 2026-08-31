# rahilsahu.github.io

Personal portfolio for Rahil Sahu — Application Security Engineer, Indore, India.

## Live

https://rahilsahu.github.io/

## What it is

A single-page portfolio styled like a professional pen-test deliverable — report header, terminal-styled evidence panel, capabilities matrix, engagement timeline, filterable toolchain, credentials with real IDs, interactive CTF playground, curated learning resources, and an AI × Security research index.

## Design

- **System font stack + JetBrains Mono fallback** — zero external font requests, zero third-party resources
- **Functional severity palette** — Critical / High / Medium / Low / Info map to real vulnerability severities
- **Report / terminal duality** — light theme reads like paper, dark theme reads like a terminal, both use the same content
- **Matrix rain background** — subtle canvas effect (10-14% opacity), respects `prefers-reduced-motion`, opt-out toggle in header

## Interactive Playground

Four browser-only challenges (no server, no execution of user input):

1. **XSS filter bypass** — regex sanitiser + DOMParser-based verifier
2. **Hidden flag hunt** — flag lives in an HTML comment; teaches DevTools use
3. **JWT decoding** — base64url payload extraction
4. **Cipher chain** — rot13 → base64 → base64 reversal

All checks are read-only and run in-tab. Verifiable in DevTools → Network (zero outbound requests).

## Security posture

| Control | Method |
|---|---|
| **Strict CSP** | `default-src 'none'`, hash-locked inline JSON-LD, no `unsafe-inline`, no `unsafe-eval` |
| **No third-party requests** | System fonts, no CDN, no analytics, no trackers — verified in Playwright |
| **Referrer-Policy** | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | camera, mic, geolocation, payment, USB, FLoC disabled |
| **Clickjacking** | `frame-ancestors 'none'` in CSP |
| **MIME sniffing** | `X-Content-Type-Options: nosniff` |
| **Tab-nabbing** | Every `target="_blank"` carries `rel="noopener noreferrer"` |
| **RFC 9116** | `security.txt` at `/.well-known/security.txt` |
| **Form abuse** | Honeypot field + client-side validation before `mailto:` |
| **State** | Only theme + FX preferences in `localStorage`. No cookies, no tracking. |
| **Content integrity** | No user-input HTML is ever rendered. CTF checks use DOMParser (inert). |

For platforms that permit true HTTP headers (Netlify, Cloudflare Pages), the `_headers` file also sets HSTS, X-Frame-Options: DENY, COOP, CORP, and immutable asset caching.

## Deployment

Uses `.github/workflows/pages.yml` to deploy via GitHub Actions on push to `main`.

1. Push to `main`
2. Repo → Settings → Pages → **Source: GitHub Actions**
3. Workflow deploys the whole tree as-is (no Jekyll processing — `.nojekyll` present)

## Structure

```
index.html          single page, sections 00–08
404.html            custom not-found (terminal aesthetic)
assets/
  styles.css        21 numbered CSS sections
  main.js           11 numbered JS modules (all CSP-safe, no inline)
  404.css
  favicon.svg
.well-known/
  security.txt      RFC 9116, expires 2027-12-31
.github/workflows/
  pages.yml         GitHub Actions Pages deploy
_headers            Netlify/Cloudflare header rules (unused on GH Pages)
_config.yml         Jekyll passthrough config (bypassed by .nojekyll)
.nojekyll           tells GH Pages: don't process, serve as static files
robots.txt          allow all + sitemap ref
sitemap.xml         single-page sitemap
site.webmanifest    PWA manifest
humans.txt          attribution
resume.pdf          served at /resume.pdf
```

## Notes

- The CSP `script-src` includes a SHA-256 hash for the inline JSON-LD Person block. If that block is edited, recompute the hash and update the meta CSP.
- `frame-ancestors` in meta CSP is advisory only; the real header must come from the edge if the site is ever proxied.

Built with intent. Strict CSP, no cookies, no trackers, no third-party requests.
