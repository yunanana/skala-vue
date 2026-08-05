<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

// 'rain' | 'snow' | 'clear' | 'cloud' | 'none'
const props = defineProps({
  mode: {
    type: String,
    default: 'none',
  },
})

const canvasRef = ref(null)
let ctx = null
let raf = null
let particles = []
let w = 0
let h = 0

const resize = () => {
  const c = canvasRef.value
  if (!c) return
  w = c.width = window.innerWidth
  h = c.height = window.innerHeight
}

/** 구름 한 덩이는 원 여러 개를 겹쳐 만든다 */
const makeCloud = () => {
  const scale = 0.5 + Math.random() * 0.9
  return {
    x: Math.random() * w,
    // 화면 위쪽 40%에만 띄운다 (본문 글자를 가리지 않도록)
    y: 60 + Math.random() * (h * 0.35),
    speed: (0.12 + Math.random() * 0.22) * scale,
    scale,
    alpha: 0.1 + Math.random() * 0.1,
    // 덩이를 이루는 원들의 상대 위치 [x, y, 반지름]
    puffs: [
      [0, 0, 26],
      [22, -8, 20],
      [44, 2, 24],
      [-20, 4, 18],
      [12, 10, 22],
    ],
  }
}

/** 현재 모드에 맞는 입자를 만든다 */
const seed = () => {
  if (props.mode === 'clear') {
    // 해는 하나. 아주 느리게 위아래로 떠다닌다
    particles = [{ phase: 0, baseY: 120 }]
    return
  }

  if (props.mode === 'cloud') {
    particles = Array.from({ length: 5 }, makeCloud)
    return
  }

  const count = props.mode === 'rain' ? 160 : props.mode === 'snow' ? 90 : 0
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    // 비는 길고 빠르게, 눈은 작고 느리게 떨어진다
    len: props.mode === 'rain' ? 14 + Math.random() * 20 : 2.5 + Math.random() * 4,
    speed: props.mode === 'rain' ? 5 + Math.random() * 6 : 0.5 + Math.random() * 1.1,
    drift: props.mode === 'rain' ? 0.8 : Math.random() * 0.8 - 0.4,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.4 + Math.random() * 0.45,
    // 굵기를 입자마다 조금씩 다르게 줘서 원근감을 만든다
    weight: props.mode === 'rain' ? 1.5 + Math.random() * 2 : 1,
  }))
}

const step = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  // 배경 도트가 흑백이므로 입자도 같은 톤(현재 글자색)으로 그린다
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#000'

  if (props.mode === 'rain') {
    ctx.strokeStyle = ink
    ctx.lineCap = 'round'
    for (const p of particles) {
      ctx.globalAlpha = p.alpha
      ctx.lineWidth = p.weight
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - p.drift * 2, p.y + p.len)
      ctx.stroke()

      p.y += p.speed
      p.x -= p.drift
      if (p.y > h) {
        p.y = -p.len
        p.x = Math.random() * w
      }
    }
  } else if (props.mode === 'clear') {
    // 검은 해 — 둥근 몸통에 짧은 빛살을 두른다
    const sun = particles[0]
    sun.phase += 0.008

    const cx = w - 150
    const cy = sun.baseY + Math.sin(sun.phase) * 16
    const r = 34

    ctx.strokeStyle = ink
    ctx.fillStyle = ink
    ctx.globalAlpha = 0.16
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    for (let i = 0; i < 12; i++) {
      // 빛살이 아주 천천히 돈다
      const angle = (i / 12) * Math.PI * 2 + sun.phase * 0.4
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * (r + 12), cy + Math.sin(angle) * (r + 12))
      ctx.lineTo(cx + Math.cos(angle) * (r + 26), cy + Math.sin(angle) * (r + 26))
      ctx.stroke()
    }
  } else if (props.mode === 'cloud') {
    ctx.fillStyle = ink
    for (const cloud of particles) {
      ctx.globalAlpha = cloud.alpha
      ctx.beginPath()
      for (const [dx, dy, radius] of cloud.puffs) {
        ctx.moveTo(cloud.x + (dx + radius) * cloud.scale, cloud.y + dy * cloud.scale)
        ctx.arc(
          cloud.x + dx * cloud.scale,
          cloud.y + dy * cloud.scale,
          radius * cloud.scale,
          0,
          Math.PI * 2,
        )
      }
      ctx.fill()

      cloud.x += cloud.speed
      // 오른쪽 끝으로 나가면 왼쪽에서 다시 들어온다
      if (cloud.x - 90 > w) {
        cloud.x = -90
        cloud.y = 60 + Math.random() * (h * 0.35)
      }
    }
  } else if (props.mode === 'snow') {
    ctx.fillStyle = ink
    for (const p of particles) {
      ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.len, 0, Math.PI * 2)
      ctx.fill()

      p.phase += 0.02
      p.y += p.speed
      p.x += Math.sin(p.phase) * 0.6 + p.drift
      if (p.y > h) {
        p.y = -4
        p.x = Math.random() * w
      }
    }
  }

  ctx.globalAlpha = 1
  raf = requestAnimationFrame(step)
}

const start = () => {
  stop()
  if (props.mode === 'none') {
    if (ctx) ctx.clearRect(0, 0, w, h)
    return
  }
  seed()
  raf = requestAnimationFrame(step)
}

const stop = () => {
  if (raf) cancelAnimationFrame(raf)
  raf = null
}

const onResize = () => {
  resize()
  if (props.mode !== 'none') seed()
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  resize()
  start()
  window.addEventListener('resize', onResize)
})

// 날씨가 바뀌면 입자를 새로 만든다
watch(() => props.mode, start)

// 화면에서 사라질 때 애니메이션과 이벤트를 정리한다
onUnmounted(() => {
  stop()
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <canvas ref="canvasRef" class="weather-fx" aria-hidden="true"></canvas>
</template>

<style scoped>
.weather-fx {
  position: fixed;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
