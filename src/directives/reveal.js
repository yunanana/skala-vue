/**
 * v-reveal — 화면에 들어올 때 요소를 부드럽게 등장시킨다
 *
 * 처음에는 살짝 아래에 흐리게 두었다가, 뷰포트에 들어오면 제자리로 올린다.
 * 스크롤할 때마다 다시 숨기지는 않는다. (한 번 보인 것은 그대로 둔다)
 *
 * 사용: <div v-reveal>…</div>  또는  <div v-reveal="120">  (120ms 늦게 등장)
 */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      const delay = Number(entry.target.dataset.revealDelay ?? 0)
      setTimeout(() => entry.target.classList.add('is-revealed'), delay)

      observer.unobserve(entry.target)
    })
  },
  // 요소가 조금 걸치기 시작할 때 미리 켠다
  { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
)

export const reveal = {
  mounted(el, binding) {
    // 움직임을 줄이도록 설정한 사용자에게는 애니메이션을 걸지 않는다
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    el.classList.add('reveal')
    if (binding.value) el.dataset.revealDelay = String(binding.value)

    observer.observe(el)
  },

  unmounted(el) {
    observer.unobserve(el)
  },
}
