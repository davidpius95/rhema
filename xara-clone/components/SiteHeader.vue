<script setup lang="ts">
const menuOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { menuOpen.value = false })

const links = [
  { label: 'Use Cases', to: '/#use-cases' },
  { label: 'Features', to: '/#features' },
  { label: 'Security', to: '/#security' },
  { label: 'Ambassadors', to: '/ambassadors' },
  { label: 'FAQ', to: '/#faqs' },
]
</script>

<template>
<header class="border-b border-[#F6F8FA] lg:border-b-0" data-v-bbc6a700><nav class="py-5 flex justify-between items-center w-contain bg-white"><a aria-current="page" href="/" class="router-link-active router-link-exact-active logo-link"><img src="/logo-dark.svg" alt="Logo" class="max-w-[120px] w-full h-full"></a><ul class="hidden items-center gap-8 md:flex"><li v-for="link in links" :key="link.to"><a :href="link.to" class="font-switzer font-[400]">{{ link.label }}</a></li></ul><a href="https://api.whatsapp.com/send?phone=2349119994024&amp;text=Hi%20Xara" class="btn-primary p-3 !hidden md:!block">Try it Out</a><button class="md:hidden" aria-label="Open menu" @click="menuOpen = true"><svg class="w-6 h-6 w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg></button></nav>
<Transition name="menu-slide">
<div v-if="menuOpen" class="mobile-menu-overlay md:hidden">
  <div class="py-5 flex justify-between items-center w-contain">
    <a href="/" class="logo-link"><img src="/logo-dark.svg" alt="Logo" class="max-w-[120px] w-full h-full"></a>
    <button aria-label="Close menu" @click="menuOpen = false"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
  </div>
  <ul class="flex flex-col gap-6 px-6 mt-8">
    <li v-for="link in links" :key="link.to"><a :href="link.to" class="font-switzer font-[400] text-xl" @click="menuOpen = false">{{ link.label }}</a></li>
    <li class="mt-4"><a href="https://api.whatsapp.com/send?phone=2349119994024&amp;text=Hi%20Xara" class="btn-primary p-3 inline-block">Try it Out</a></li>
  </ul>
</div>
</Transition>
</header>
</template>

<style scoped>
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #fff;
  overflow-y: auto;
}
.menu-slide-enter-active,
.menu-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.menu-slide-enter-from,
.menu-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
