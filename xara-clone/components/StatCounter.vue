<script setup lang="ts">
// Count-up stat, matching the original Counter.vue: starts when scrolled
// into view, 2s duration, ease-out-quart, floored integer values.
const props = withDefaults(defineProps<{
  target: number
  prefix?: string
  suffix?: string
  duration?: number
}>(), { prefix: '', suffix: '', duration: 2000 })

const el = ref<HTMLElement | null>(null)
const value = ref(0)

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const startTs = Date.now()
      const tick = () => {
        const progress = Math.min((Date.now() - startTs) / props.duration, 1)
        const eased = 1 - Math.pow(1 - progress, 4)
        value.value = Math.floor(props.target * eased)
        if (progress < 1) requestAnimationFrame(tick)
        else value.value = props.target
      }
      tick()
    })
  }, { threshold: 0.1 })
  if (el.value) observer.observe(el.value)
})
</script>

<template>
  <span ref="el">{{ prefix }}{{ value }}{{ suffix }}</span>
</template>
