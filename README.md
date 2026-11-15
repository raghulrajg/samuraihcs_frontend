# Samurai HealthCare Private Limited: website

The official website of **Samurai HealthCare Private Limited**, Chennai, India: suppliers of surgical lights,
surgical tables, OT accessories and multi-brand operation theatre service support.

It is a fast, accessible, dependency-free static site. It needs no build step and no framework, and runs on any web host.

## Highlights

| Area | What's included |
| --- | --- |
| **Responsive** | Mobile-first layout tested from 320px phones to 1920px desktops, with no horizontal scrolling. Safe-area insets support notched phones. |
| **Transitions** | Hero entrance and slow zoom, staggered scroll-reveal, animated counters, a sliding mobile menu, card hover lifts, an animated product modal, a scroll progress bar and a back-to-top progress ring. Everything respects *prefers-reduced-motion*. |
| **Accessibility** | Built to WCAG 2.2 AA: semantic landmarks, a skip link, visible focus styles, a keyboard focus trap in the menu, an accessible `<dialog>`, labelled form errors, and AA colour contrast. axe-core reports 0 violations. |
| **Performance** | Self-hosted variable fonts, responsive WebP images with JPEG fallback, hero preloading, lazy-loaded media, and Google Maps loaded only on demand. Lighthouse (mobile): Performance 98, Accessibility 100, Best Practices 100, SEO 100. |
| **SEO** | Meta and Open Graph/Twitter tags, a canonical URL, JSON-LD structured data (Organization, LocalBusiness, WebSite), `sitemap.xml`, `robots.txt` and a web app manifest. |
| **Security** | `.htaccess` with HTTPS redirect, a strict Content-Security-Policy, HSTS, nosniff, Referrer-Policy and Permissions-Policy. There is no inline JavaScript. |
| **Compliance** | The landing page shows the registered office address, phone and email, as Rule 26 of the Companies (Incorporation) Rules, 2014 requires. |

## Project structure

```
.
├── index.html              # Home page (all sections)
├── 404.html                # Custom "page not found"
├── .htaccess               # Apache/LiteSpeed: redirects, security & caching headers
├── .nojekyll               # GitHub Pages: publish files as-is
├── contact-us/index.html   # Redirects the old /contact-us/ URL to the contact form
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── favicon.ico
└── assets/
    ├── css/main.css        # All styles (design tokens at the top)
    ├── js/boot.js          # Tiny pre-paint script (enables reveal animations safely)
    ├── js/main.js          # All interactions
    ├── fonts/              # Inter & Plus Jakarta Sans (SIL OFL)
    ├── icons/              # Favicons, app icons, Lucide icon licence
    └── img/                # Optimised WebP/JPEG images, Open Graph image
```

## Run locally

Any static file server works, for example:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Editing content

All content is in `index.html`; search for the section comment, e.g. `<!-- ============ Products ============ -->`.

- **Statistics:** each number in the *Stats* section has a `data-count` attribute (the animated value) and the same number as text (shown without JavaScript). Update both.
- **Products:** each product is an `<li class="product-card">`. The short text is on the card. The text inside its `<template data-product-details>` appears in the "View details" popup. `data-interest` must match an option in the contact form's *I'm interested in* list, and `data-brochure` (optional) adds a *View brochure* link.
- **Colours and fonts:** change the design tokens at the top of `assets/css/main.css`.

## Contact form

By default the form needs no server. When someone submits it, their email app opens with the message ready to send to `contact@samuraihcs.com`.

To receive submissions directly instead, set a form endpoint (for example Formspree, Getform, Basin or your own API) on the form in `index.html`:

```html
<form ... data-endpoint="https://formspree.io/f/your-id">
```

Then allow that endpoint in the Content-Security-Policy in `.htaccess` by adding its origin to `connect-src`:

```
connect-src 'self' https://formspree.io;
```

The form has client-side validation, a spam honeypot, and success and error messages.

## Deployment

Upload the repository contents (except `README.md` and `LICENSE`, which are optional) to the web root.

- **Apache / LiteSpeed (cPanel, most shared hosting):** `.htaccess` is applied automatically. It also redirects the old WordPress URLs (`/contact-us/`, `/contact/`, `/blog/`) to the new page.
- **Nginx, Netlify, Cloudflare Pages, Vercel and others:** copy the headers and redirects from `.htaccess` into that platform's configuration.

### GitHub Pages

1. GitHub Pages needs a **public** repository on a free plan, or GitHub Pro/Team for a private one:
   **Settings → General → Danger Zone → Change visibility**.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then choose the branch
   (e.g. `main`) and the `/ (root)` folder, and click **Save**.
3. After a minute or two the site is live at `https://<user>.github.io/samuraihcs_frontend/`.

To serve it on **samuraihcs.com**:

1. At your domain's DNS provider, point the domain at GitHub. Leave the **MX** (email) records unchanged.

   | Type | Name | Value |
   | --- | --- | --- |
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `<user>.github.io` |

   Remove any other `A`/`AAAA` records for `@` (the old host's). Optionally add the matching `AAAA` records:
   `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
2. **Settings → Pages → Custom domain:** enter `samuraihcs.com` and save. This adds a `CNAME` file to the branch.
3. Once the DNS check passes, tick **Enforce HTTPS**.
4. Recommended: verify the domain under your account's **Settings → Pages** so that no one else can claim it.

Notes for GitHub Pages:

- `.nojekyll` tells Pages to publish the files exactly as they are, without running Jekyll.
- Pages ignores `.htaccess`, so its custom security headers and redirects don't apply there. GitHub provides HTTPS.
  The old `/contact-us/` link still works through `contact-us/index.html`.
- `404.html` uses root paths (`/assets/…`). It displays correctly on `samuraihcs.com`, but appears unstyled on the
  `github.io/samuraihcs_frontend/` preview address.

Static assets are cached for 30 days. After changing a CSS, JS or image file, rename it or add a version query (e.g. `main.css?v=2`) so returning visitors get the update.

## Before going live

- [ ] Add the company's **CIN** (Corporate Identity Number) in the footer. There is a placeholder comment in `index.html`; Indian companies must show it on their website.
- [ ] Confirm the statistics (99% client retention, 15+ years, 80+ professionals, 10M+ project value) and product descriptions are accurate.
- [ ] Add social media links to the footer if the company has active profiles.
- [ ] Set a contact form endpoint (optional, see above).
- [ ] Submit `https://samuraihcs.com/sitemap.xml` in Google Search Console.

## Credits & licences

- Code: see `LICENSE`.
- Fonts: [Inter](https://rsms.me/inter/) and [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans), SIL Open Font License 1.1 (licence files in `assets/fonts/`).
- Icons: [Lucide](https://lucide.dev), ISC License (`assets/icons/LICENSE-Lucide.txt`).
- Photography and product imagery: Samurai HealthCare Private Limited and its manufacturing partners.
