export default defineNuxtConfig({
  compatibilityDate: '2026-07-12',
  devtools: { enabled: false },
  app: {
    // The captured site serves its hashed assets from /_nuxt/. We keep those
    // files at the same URLs in public/_nuxt/, so Nuxt's own build assets
    // must live somewhere else.
    buildAssetsDir: '/_fresh/',
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'GuildPay - Your Personal AI Financial Assistant on WhatsApp',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'title', content: 'GuildPay - Your Personal AI Financial Assistant on WhatsApp' },
        { name: 'description', content: 'Unlock smarter financial choices with GuildPay, your AI-powered assistant on WhatsApp, making every transaction simpler and more intuitive.' },
        { name: 'twitter:title', content: 'GuildPay - Your Personal AI Financial Assistant on WhatsApp' },
        { name: 'twitter:description', content: 'Unlock smarter financial choices with GuildPay, your AI-powered assistant on WhatsApp, making every transaction simpler and more intuitive.' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://useguildpay.ai/images/open-graph.png' },
        { name: 'twitter:image:alt', content: 'GuildPay AI Financial Assistant' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'GuildPay - Your Personal AI Financial Assistant on WhatsApp' },
        { property: 'og:description', content: 'Unlock smarter financial choices with GuildPay, your AI-powered assistant on WhatsApp, making every transaction simpler and more intuitive.' },
        { property: 'og:image', content: 'https://useguildpay.ai/images/open-graph.png' },
        { property: 'og:image:alt', content: 'GuildPay AI Financial Assistant' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Original compiled stylesheets, served verbatim from public/_nuxt/
        { rel: 'stylesheet', href: '/_nuxt/entry.8924fc0b.css' },
        { rel: 'stylesheet', href: '/_nuxt/FooterSection.4df342f3.css' },
        { rel: 'stylesheet', href: '/_nuxt/animated.2a5c6eba.css' },
        { rel: 'stylesheet', href: '/_nuxt/avanda.be66d30c.css' },
        { rel: 'stylesheet', href: '/_nuxt/JobList.3d1bd3b6.css' },
        { rel: 'stylesheet', href: '/_nuxt/VInput.ff317e5c.css' },
        { rel: 'stylesheet', href: '/_nuxt/VCountryCodeInput.4bcf84d2.css' },
        { rel: 'stylesheet', href: '/_nuxt/loader-icon.921dcde0.css' },
      ],
    },
  },
  css: ['~/assets/css/inline-critical.css'],
})
