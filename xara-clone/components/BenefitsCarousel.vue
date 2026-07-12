<script setup lang="ts">
// "What is in it for you" carousel on /ambassadors. Card data and classes
// recovered from the site's compiled BenefitsSection chunk. The original
// used Swiper (slides-per-view auto, 24px gap, loop, autoplay 3s); this
// implementation reproduces that behavior with a scrollable track.
const benefits = [
  {
    title: 'Referral bonuses',
    description: 'Earn cash rewards for every active referral that completes qualifying transactions within the onboarding window. (₦200 - ₦2,000 per referral)',
    iconBg: '#0A0D14',
    bgColor: '#F3F4F6',
    icon: 'arrow-right-up',
  },
  {
    title: 'Official Xara merch',
    description: 'Get access to branded T-shirts, bags, caps, journals, wristbands reserved for verified ambassadors.',
    iconBg: '#EC4899',
    bgColor: '#FCE7F3',
    icon: 'gift',
  },
  {
    title: 'Scholarships & sponsored courses',
    description: 'Selected ambassadors receive fully or partially sponsored learning opportunities to grow their skills.',
    iconBg: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'graduation-cap',
  },
  {
    title: 'Paid internships opportunities',
    description: 'Top performers may be offered internships, or contract roles in Xara or partner teams.',
    iconBg: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'briefcase',
  },
]

// Inline Remix Icon paths (ri:arrow-right-up-line, ri:gift-line,
// ri:graduation-cap-line, ri:briefcase-line) so no runtime Iconify fetch
// is needed.
const iconPaths: Record<string, string> = {
  'arrow-right-up': 'M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z',
  'gift': 'M14.5 2C16.1569 2 17.5 3.34315 17.5 5C17.5 5.35064 17.4398 5.68722 17.3293 6.00007L21 6C21.5523 6 22 6.44772 22 7V11C22 11.5523 21.5523 12 21 12H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V12H3C2.44772 12 2 11.5523 2 11V7C2 6.44772 2.44772 6 3 6L6.67071 6.00007C6.56015 5.68722 6.5 5.35064 6.5 5C6.5 3.34315 7.84315 2 9.5 2C10.4508 2 11.2984 2.44231 11.848 3.13246L12 3.35418L12.152 3.13246C12.7016 2.44231 13.5492 2 14.5 2ZM18 12H6V20H18V12ZM20 8H4V10H20V8ZM9.5 4C8.94772 4 8.5 4.44772 8.5 5C8.5 5.55228 8.94772 6 9.5 6H11V5C11 4.44772 10.5523 4 9.5 4ZM14.5 4C13.9477 4 13.5 4.44772 13.5 5V6H14.5C15.0523 6 15.5 5.55228 15.5 5C15.5 4.44772 15.0523 4 14.5 4Z',
  'graduation-cap': 'M12 3L1 9L5 11.18V17.18L12 21L19 17.18V11.18L21 10.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 15.99L12 18.72L7 15.99V12.27L12 15L17 12.27V15.99Z',
  'briefcase': 'M7 5V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V6C2 5.44772 2.44772 5 3 5H7ZM4 16V19H20V16H4ZM4 14H20V7H4V14ZM9 3V5H15V3H9ZM11 11H13V13H11V11Z',
}

const track = ref<HTMLElement | null>(null)
let autoplayTimer: ReturnType<typeof setInterval> | null = null

const cardStep = () => 350 + 24

const scrollByCards = (dir: number) => {
  const el = track.value
  if (!el) return
  const maxScroll = el.scrollWidth - el.clientWidth
  const atEnd = el.scrollLeft >= maxScroll - 4
  const atStart = el.scrollLeft <= 4
  // wrap at the ends like the original's loop:true
  if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' })
  else if (dir < 0 && atStart) el.scrollTo({ left: maxScroll, behavior: 'smooth' })
  else el.scrollBy({ left: dir * cardStep(), behavior: 'smooth' })
}

const startAutoplay = () => {
  stopAutoplay()
  autoplayTimer = setInterval(() => scrollByCards(1), 3000)
}
const stopAutoplay = () => {
  if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null }
}

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <section class="w-full bg-white py-20">
    <div class="mx-auto">
      <div class="text-center mb-12 w-contain">
        <h2 class="text-4xl md:text-5xl font-bold text-[#0A0D14] mb-2 md:mb-4 tracking-[-1%]">
          What is in it for you
        </h2>
        <p class="text-[#525866] text-base md:text-lg max-w-2xl px-3 md:px-0 mx-auto">
          Discover the rewards, opportunities, and real benefits you unlock as a Xara Ambassador.
        </p>
      </div>
      <div class="relative overflow-hidden">
        <div
          ref="track"
          class="benefits-track flex gap-6 overflow-x-auto w-full !pl-6 md:!pl-[calc((100vw-1152px)/2+24px)] pr-6"
          @mouseenter="stopAutoplay"
          @mouseleave="startAutoplay"
        >
          <div v-for="(benefit, i) in benefits" :key="`benefit-${i}`" class="w-[350px] shrink-0 h-auto">
            <div class="rounded-3xl p-8 h-full min-h-[320px] flex flex-col" :style="{ backgroundColor: benefit.bgColor }">
              <div class="w-16 h-16 rounded-full flex items-center justify-center mb-6" :style="{ backgroundColor: benefit.iconBg }">
                <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path :d="iconPaths[benefit.icon]" />
                </svg>
              </div>
              <h3 class="text-[#0A0D14] text-xl font-semibold mb-3">{{ benefit.title }}</h3>
              <p class="text-[#525866] text-sm leading-[160%]">{{ benefit.description }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-center gap-4 mt-8">
        <button
          type="button"
          class="w-12 h-12 rounded-full border-2 border-[#E5E7EB] flex items-center justify-center hover:border-[#0347F5] hover:text-[#0347F5] transition-colors"
          aria-label="Previous slide"
          @click="scrollByCards(-1)"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M13.9142 12.0001L18.7071 16.793L17.2929 18.2072L11.0858 12.0001L17.2929 5.79297L18.7071 7.20718L13.9142 12.0001Z" transform="scale(-1,1) translate(-24,0)" /></svg>
        </button>
        <button
          type="button"
          class="w-12 h-12 rounded-full border-2 border-[#E5E7EB] flex items-center justify-center hover:border-[#0347F5] hover:text-[#0347F5] transition-colors"
          aria-label="Next slide"
          @click="scrollByCards(1)"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z" /></svg>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Layout is defined here rather than with Tailwind utilities because the
   original site's compiled CSS only contains classes its own source used. */
.benefits-track {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
}
.benefits-track::-webkit-scrollbar {
  display: none;
}
.benefits-track > div {
  flex: 0 0 350px;
  width: 350px;
  scroll-snap-align: start;
}
</style>
