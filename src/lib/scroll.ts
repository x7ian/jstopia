function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function smoothScrollTo(targetY: number, duration = 520) {
  const startY = window.scrollY
  const delta = targetY - startY
  const start = performance.now()

  function step(now: number) {
    const elapsed = now - start
    const progress = Math.min(1, elapsed / duration)
    const eased = easeOutCubic(progress)
    window.scrollTo(0, startY + delta * eased)
    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

export function scrollToId(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const rect = target.getBoundingClientRect()
  const offset = rect.top + window.scrollY - 16
  smoothScrollTo(Math.max(0, offset))
}
