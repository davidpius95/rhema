# Xara site clone

A pixel-faithful, editable rebuild of the Xara marketing site (usexara.ai) as a
Nuxt 3 application. The original is a Nuxt/Vue SSR site; this project reproduces
every public page, all assets, and the interactive behaviors as maintainable
source code rather than a static scrape.

## What's included

Pages (`pages/`):

- `/` — homepage (hero, transfer/spending/support/context feature sections,
  security cards, "everyday life" band, FAQ, instant-block CTA)
- `/ambassadors` — ambassador program (photo marquee, count-up stats,
  "who should join" grid, how-it-works, benefits carousel, FAQ, CTA)
- `/ambassadors/join` — application form
- `/careers` — open roles
- `/privacy-policy`, `/terms-of-service` — legal pages
- `/auth/block-account`, `/auth/unblock-account` — account security forms
- `error.vue` — the 404 page

Shared UI lives in `components/` (`SiteHeader`, `SiteFooter`, `StatCounter`,
`AmbassadorMarquee`, `BenefitsCarousel`).

## How the fidelity is achieved

- **Markup & styling.** Each page's server-rendered DOM was captured and turned
  into a Vue single-file component, preserving the original class names and
  scoped-style `data-v-*` attributes. The site's own compiled stylesheets and
  inline critical CSS are served verbatim from `public/_nuxt/` and
  `assets/css/inline-critical.css`, so the original CSS applies 1:1.
- **Fonts & images.** The Altone and Switzer font families, all section images,
  icons, and the favicon are downloaded into `public/`.
- **Animations.** `plugins/scroll-animate.client.ts` recreates the original
  `<animated>` wrapper: `.defaut-animate` elements start hidden and fade in
  (default `fade-up`) via an IntersectionObserver when scrolled into view; lazy
  images fade in on load. Stat numbers count up with the same 2s ease-out-quart
  curve (`StatCounter.vue`).
- **Interactivity.** FAQ accordions (exclusive open, plus/minus icon swap), the
  mobile nav overlay, and the benefits carousel (arrows + autoplay + hover
  pause) are reimplemented to match the original behavior.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

Production:

```bash
npm run build
node .output/server/index.mjs
```

## Notes on backend-dependent flows

The account block/unblock and ambassador-application forms POST to Xara's
server-side API, which is not part of the public site bundle. The forms include
full client-side validation and are wired to call an endpoint when
`NUXT_PUBLIC_API_BASE` is set; without it they show a clear demo-mode message
instead of failing silently. Point that variable at the real API (and adjust the
paths in the auth pages) to connect them.
