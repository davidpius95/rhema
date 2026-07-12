<script setup>
useHead({
  title: "Xara - Your Personal AI Financial Assistant on WhatsApp",
  meta: [{ name: "description", content: "Unlock smarter financial choices with Xara, your AI-powered assistant on WhatsApp, making every transaction simpler and more intuitive." }],
})

const phone = ref('')
const bvn = ref('')
const pin = ref('')
const showPin = ref(false)
const submitting = ref(false)
const message = ref('')

async function onSubmit() {
  message.value = ''
  if (!phone.value || !bvn.value || pin.value.length !== 4) {
    message.value = 'Enter your WhatsApp phone number, BVN, and 4-digit PIN.'
    return
  }
  submitting.value = true
  try {
    // See block-account.vue: the real API endpoint is server-side only and
    // must be wired via NUXT_PUBLIC_API_BASE.
    const apiBase = useRuntimeConfig().public?.apiBase
    if (!apiBase) {
      message.value = 'Demo build: account-unblock API is not configured (set NUXT_PUBLIC_API_BASE).'
      return
    }
    await $fetch('/auth/unblock-account', { baseURL: apiBase, method: 'POST', body: { phone: phone.value, bvn: bvn.value, pin: pin.value } })
    message.value = 'Your account has been unblocked.'
  } catch (e) {
    message.value = 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
<div>
<div><div class="relative"><SiteHeader /><main class="relative mt-10"><div></div><div class="tab-switcher w-full max-w-[320px] md:max-w-[430px] mx-auto bg-[#F5F6F8] p-1 rounded-lg my-10" data-v-360de863><div class="flex" data-v-360de863><button class="tab-button cursor-pointer w-1/2" data-v-360de863> Block Account </button><button class="active tab-button w-1/2 cursor-pointer" data-v-360de863> Unblock Account </button></div></div><form @submit.prevent="onSubmit" class="text-center flex flex-col items-center mb-20 border border-[#F6F8FA] rounded-xl max-w-[350px] md:max-w-[430px] mx-auto bg-white p-4 md:p-8" data-v-360de863><div class="pt-5" data-v-360de863><h2 class="ext-xl md:text-2xl md:leading-[32px] font-[500] font-switzer tracking-[-1%] text-secondary" data-v-360de863>Unblock Account </h2><p class="text-sm md:text-base text-[#868C98] font-[400] md:mt-2 leading-[160%]" data-v-360de863>Restore full access in seconds</p></div><div class="flex flex-col gap-4 w-full mt-8" data-v-360de863><div class="flex flex-col items-start w-full gap-1" data-v-360de863><div class="v-input-wrapper" required data-v-360de863 data-v-cfb7f4a1><div class="label-container text-left" data-v-cfb7f4a1><label for="whatsapp-phone" class="text-secondary font-[400] text-sm md:text-base leading-[160%]" data-v-cfb7f4a1>Whatsapp Phone Number</label></div><div class="country-code-input-container" data-v-cfb7f4a1><div class="country-code-selector" data-v-cfb7f4a1><button type="button" class="country-code-button" aria-expanded="false" aria-haspopup="listbox" data-v-cfb7f4a1><img src="/images/flags/ng.png" alt="Nigeria" class="country-flag" data-v-cfb7f4a1><span class="country-code" data-v-cfb7f4a1>+234</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dropdown-arrow" data-v-cfb7f4a1><polyline points="6 9 12 15 18 9" data-v-cfb7f4a1></polyline></svg></button></div><input id="whatsapp-phone" name="whatsapp-phone" type="number" required v-model="phone" placeholder="(555) 000-0000" class="phone-input input-field" data-v-cfb7f4a1></div></div></div><div class="flex flex-col items-start w-full gap-1" data-v-360de863><div class="label-container" data-v-c8b57538><label for="bvn" class="text-secondary font-[400] text-sm md:text-base leading-[160%]" data-v-c8b57538>BVN</label></div><div class="input-container w-full relative" data-v-c8b57538><input id="bvn" name="bvn" type="text" required v-model="bvn" minlength="11" maxlength="11" placeholder="e.g 12345678901" class="w-full input-field w-full rounded-[8px] text-sm border border-[#E2E8F0] outline-none focus:border-primary" data-v-c8b57538><div class="info-icon-wrapper" data-v-c8b57538><div class="info-icon" tabindex="0" data-v-c8b57538><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-c8b57538><circle cx="10" cy="10" r="8" fill="#94A3B8" data-v-c8b57538></circle><path d="M10 7V10M10 13H10.01" stroke="white" stroke-width="2" stroke-linecap="round" data-v-c8b57538></path></svg></div></div></div></div><div class="flex flex-col items-start w-full gap-1" data-v-360de863><div class="label-container" data-v-c8b57538><label for="pin" class="text-secondary font-[400] text-sm md:text-base leading-[160%]" data-v-c8b57538>PIN</label></div><div class="input-container w-full relative" data-v-c8b57538><input id="pin" name="pin" :type="showPin ? 'text' : 'password'" required v-model="pin" minlength="4" maxlength="4" placeholder="• • • •" class="w-full input-field w-full rounded-[8px] text-sm border border-[#E2E8F0] outline-none focus:border-primary" data-v-c8b57538><div class="password-toggle-wrapper" data-v-c8b57538><button type="button" class="password-toggle" tabindex="-1" aria-label="Toggle password visibility" data-v-c8b57538 @click="showPin = !showPin"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon" data-v-c8b57538><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" data-v-c8b57538></path><line v-if="!showPin" x1="1" y1="1" x2="23" y2="23" data-v-c8b57538></line></svg></button></div></div></div></div><p v-if="message" class="text-sm text-[#DF1C41] text-left w-full" data-v-edf561f4>{{ message }}</p><button type="submit" :disabled="submitting" class="w-full btn-primary mt-10 flex p-3 justify-center text-center" data-v-360de863><span data-v-360de863>{{ submitting ? 'Please wait…' : 'Unblock Account' }}</span></button></form></main><SiteFooter /></div></div>
</div>
</template>
