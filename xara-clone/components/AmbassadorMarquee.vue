<script setup lang="ts">
// Continuous photo strip on the ambassadors hero. The original used
// vue3-marquee (duration 25s, clone, pause-on-hover); this reproduces the
// same effect with a CSS keyframe over a duplicated track.
const images = [
  '/images/ambassadors/img-1.png',
  '/images/ambassadors/img-2.png',
  '/images/ambassadors/img-3.png',
  '/images/ambassadors/img-4.png',
  '/images/ambassadors/img-5.png',
  '/images/ambassadors/img-6.png',
]
</script>

<template>
  <div class="xmarquee py-8 z-[1]">
    <div class="xmarquee-track">
      <template v-for="copy in 2" :key="copy">
        <div v-for="(img, i) in images" :key="`${copy}-${i}`" class="mx-3 grid gap-2 shrink-0">
          <img
            :src="img"
            :alt="`GuildPay Ambassador ${i + 1}`"
            :loading="i < 3 ? 'eager' : 'lazy'"
            width="300"
            height="500"
            class="w-[300px] h-[340px] md:w-[300px] md:h-[500px] object-cover object-[center_30px] max-w-none"
          >
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.xmarquee {
  overflow: hidden;
  width: 100%;
}
.xmarquee-track {
  display: flex;
  width: max-content;
  animation: xmarquee-scroll 25s linear infinite;
}
.xmarquee:hover .xmarquee-track {
  animation-play-state: paused;
}
@keyframes xmarquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
</style>
