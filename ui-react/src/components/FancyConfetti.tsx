import { useEffect, useRef } from 'react'

interface FancyConfettiProps {
  active: boolean
  duration?: number // total duration of bursts in ms
  onComplete?: () => void
}

// A canvas-based confetti/fireworks renderer with layered bursts, gravity, drag, spin, and shimmering
export default function FancyConfetti({ active, duration = 2200, onComplete }: FancyConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const startedAtRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const burstsRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    startedAtRef.current = performance.now()
    particlesRef.current = []
    burstsRef.current = 0

    // Schedule multiple staggered bursts
    const burstSchedule = [0, 200, 400, 700, 1000, 1300]
    burstSchedule.forEach((t) => {
      setTimeout(() => {
        burstsRef.current += 1
        spawnBurst(canvas.width, canvas.height, particlesRef.current)
      }, t)
    })

    const loop = () => {
      const now = performance.now()
      const elapsed = now - startedAtRef.current

      // clear with slight alpha for motion trails
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(0,0,0,0)'
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // draw with additive for glow
      ctx.globalCompositeOperation = 'lighter'

      // update and render particles
      const gravity = 0.08
      const drag = 0.995
      const wind = Math.sin(now / 700) * 0.02

      particlesRef.current.forEach((p) => {
        p.vx = (p.vx + wind) * drag
        p.vy = (p.vy + gravity) * drag
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        p.life -= 1
        // shimmer
        const shimmer = 0.85 + Math.sin((p.life + p.seed) * 0.2) * 0.15
        const alpha = Math.max(0, Math.min(1, p.life / p.maxLife)) * shimmer

        // draw
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        const grd = ctx.createLinearGradient(-p.size, -p.size, p.size, p.size)
        grd.addColorStop(0, p.colorA)
        grd.addColorStop(1, p.colorB)
        ctx.fillStyle = hexToRgba(grd ? p.colorA : p.colorB, alpha) // fallback
        ctx.strokeStyle = hexToRgba(p.outline, alpha)

        // layered fill to enhance glow
        ctx.fillStyle = hexToRgba(p.colorA, alpha)
        drawShape(ctx, p.shape, p.size)
        ctx.fill()
        ctx.lineWidth = 0.7
        ctx.stroke()
        ctx.restore()
      })

      // cull dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0 && p.y < canvas.height + 100)

      if (elapsed < duration + 400 || particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(loop)
      } else {
        if (onComplete) onComplete()
      }
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [active, duration, onComplete])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}
    />
  )
}

// Helpers
function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, size: number) {
  switch (shape) {
    case 'rect':
      ctx.beginPath()
      ctx.rect(-size, -size, size * 2, size * 2)
      break
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size, size)
      ctx.lineTo(-size, size)
      ctx.closePath()
      break
    case 'ribbon':
      // wavy ribbon
      ctx.beginPath()
      const w = size * 2
      const h = size * 0.6
      ctx.moveTo(-w / 2, 0)
      ctx.quadraticCurveTo(-w / 4, -h, 0, 0)
      ctx.quadraticCurveTo(w / 4, h, w / 2, 0)
      ctx.quadraticCurveTo(w / 4, -h, 0, 0)
      ctx.quadraticCurveTo(-w / 4, h, -w / 2, 0)
      ctx.closePath()
      break
  }
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r},${g},${b},${a})`
}

type Shape = 'rect' | 'circle' | 'triangle' | 'ribbon'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  spin: number
  size: number
  life: number
  maxLife: number
  colorA: string
  colorB: string
  outline: string
  shape: Shape
  seed: number
}

function spawnBurst(w: number, h: number, particles: Particle[]) {
  const palette = [
    ['#F87171', '#F59E0B'],
    ['#34D399', '#22D3EE'],
    ['#60A5FA', '#A78BFA'],
    ['#F472B6', '#FB7185'],
    ['#FBBF24', '#FCA5A5']
  ]
  const outlines = ['#ffffff', '#000000']
  const shapes: Shape[] = ['rect', 'circle', 'triangle', 'ribbon']

  // center top-ish, and two side bursts
  const sources = [
    { x: w * 0.5, y: h * 0.25, spread: Math.PI * 1.2 },
    { x: w * 0.2, y: h * 0.35, spread: Math.PI * 0.9 },
    { x: w * 0.8, y: h * 0.35, spread: Math.PI * 0.9 }
  ]

  sources.forEach((s) => {
    const count = 70 + Math.floor(Math.random() * 40)
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * s.spread - Math.PI / 2
      const speed = 3 + Math.random() * 6
      const size = 2 + Math.random() * 4.5
      const life = 80 + Math.random() * 60
      const [ca, cb] = palette[Math.floor(Math.random() * palette.length)]
      const shape = shapes[Math.floor(Math.random() * shapes.length)]
      const outline = outlines[Math.floor(Math.random() * outlines.length)]

      particles.push({
        x: s.x,
        y: s.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        size,
        life,
        maxLife: life,
        colorA: ca,
        colorB: cb,
        outline,
        shape,
        seed: Math.random() * 1000,
      })
    }
  })
}

