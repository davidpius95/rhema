// Recreates the site's <animated> wrapper behavior for the statically
// captured markup: every .defaut-animate element starts at opacity 0
// (see animated.*.css) and receives its fade class when it first scrolls
// into view. The fade type defaults to fade-up and can be overridden per
// element with data-animate="fade-down|fade-left|fade-right".
export default defineNuxtPlugin((nuxtApp) => {
  const animate = () => {
    const els = document.querySelectorAll<HTMLElement>('.defaut-animate:not([data-animated])')
    if (!els.length) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          el.classList.add(el.dataset.animate || 'fade-up')
          observer.unobserve(el)
        }
      })
    }, { threshold: 0.1 })
    els.forEach((el) => {
      el.dataset.animated = ''
      observer.observe(el)
    })
  }
  // Images marked .lazy-fade start transparent (opacity 0 in CSS) and fade
  // in once their bytes arrive, mirroring the original handleOnImageLoaded.
  const revealImages = () => {
    document.querySelectorAll<HTMLImageElement>('img.lazy-fade').forEach((img) => {
      const show = () => { img.style.opacity = '1' }
      img.complete && img.naturalWidth > 0 ? show() : img.addEventListener('load', show, { once: true })
    })
  }
  // FAQ accordions: exclusive-open within a .questions group, mirroring the
  // original FaqAccordion (closed: max-h-0 overflow-hidden, open: h-auto
  // mt-3; the plus icon becomes a minus while open).
  const PLUS_PATH = 'M6 6V0H8V6H14V8H8V14H6V8H0V6H6Z'
  const MINUS_PATH = 'M0 6H14V8H0V6Z'
  const setOpen = (item: HTMLElement, open: boolean) => {
    const answer = item.querySelector<HTMLElement>(':scope > div:last-child')
    const icon = item.querySelector<SVGPathElement>(':scope svg path')
    if (!answer) return
    answer.classList.toggle('max-h-0', !open)
    answer.classList.toggle('overflow-hidden', !open)
    answer.classList.toggle('h-auto', open)
    answer.classList.toggle('mt-3', open)
    icon?.setAttribute('d', open ? MINUS_PATH : PLUS_PATH)
    item.dataset.open = open ? '1' : ''
  }
  const bindFaqs = () => {
    document.querySelectorAll<HTMLElement>('.questions').forEach((group) => {
      if (group.dataset.faqBound) return
      group.dataset.faqBound = '1'
      group.addEventListener('click', (e) => {
        const headerRow = (e.target as HTMLElement).closest('.cursor-pointer')
        if (!headerRow || !group.contains(headerRow)) return
        const item = headerRow.parentElement as HTMLElement
        const wasOpen = item.dataset.open === '1'
        group.querySelectorAll<HTMLElement>('[data-open="1"]').forEach((other) => setOpen(other, false))
        if (!wasOpen) setOpen(item, true)
      })
    })
  }

  const run = () => { animate(); revealImages(); bindFaqs() }
  nuxtApp.hook('page:finish', () => run())
  if (import.meta.client) nuxtApp.hook('app:mounted', () => run())
})
