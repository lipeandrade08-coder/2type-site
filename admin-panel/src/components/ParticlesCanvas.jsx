'use client'
import { useEffect, useRef } from 'react'

export default function ParticlesCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let w, h, dpr, animId
    let particles = [], sparks = [], waves = []
    let mouse = { x: -1000, y: -1000, active: false }

    class Node {
      constructor() {
        this.reset()
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * window.innerHeight
      }
      reset() {
        this.x = -50
        this.y = Math.random() * window.innerHeight
        this.vx = Math.random() * 0.4 + 0.1
        this.vy = (Math.random() - 0.5) * 0.3
        this.radius = Math.random() * 1.5 + 0.5
        this.pulse = Math.random() * Math.PI
        this.baseAlpha = Math.random() * 0.3 + 0.1
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.pulse += 0.03
        if (mouse.active) {
          const dx = mouse.x - this.x, dy = mouse.y - this.y
          const dist = Math.hypot(dx, dy)
          if (dist < 150) { this.x -= dx * 0.015; this.y -= dy * 0.015 }
        }
        if (this.x > window.innerWidth + 50) this.reset()
        if (this.y < -50 || this.y > window.innerHeight + 50) this.vy *= -1
      }
      draw() {
        const pSize = this.radius * (1 + Math.sin(this.pulse) * 0.3)
        ctx.beginPath()
        ctx.arc(this.x, this.y, pSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139,92,246,${(this.baseAlpha + Math.sin(this.pulse) * 0.08)})`
        ctx.fill()
      }
    }

    class Spark {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * (window.innerHeight + 100)
        this.size = Math.random() * 1.8 + 0.3
        this.speed = Math.random() * 0.3 + 0.08
        this.alpha = Math.random() * 0.25 + 0.05
      }
      update() { this.y -= this.speed; if (this.y < -20) this.reset() }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167,139,250,${this.alpha})`
        ctx.fill()
      }
    }

    const waveColors = [
      'rgba(139,92,246,0.15)', 'rgba(91,106,247,0.12)',
      'rgba(0,242,255,0.08)',  'rgba(167,139,250,0.10)',
    ]

    class WaveLayer {
      constructor(offsetY, color, amplitude, frequency) {
        this.offsetY = offsetY; this.color = color
        this.amplitude = amplitude; this.frequency = frequency
        this.phase = Math.random() * Math.PI * 2
      }
      draw(t) {
        ctx.beginPath()
        ctx.strokeStyle = this.color
        ctx.lineWidth = 1.0
        for (let x = -50; x <= window.innerWidth + 50; x += 8) {
          const normX = (x + 50) / (window.innerWidth + 100)
          ctx.globalAlpha = 0.04 + normX * 0.12
          const y = window.innerHeight / 2 +
            Math.sin(x * this.frequency + t * 0.0008 + this.phase) * this.amplitude + this.offsetY
          x === -50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    const initElements = () => {
      const count = window.innerWidth < 768 ? 40 : 80
      particles = Array.from({ length: count }, () => new Node())
      sparks    = Array.from({ length: 60 }, () => new Spark())
      waves     = waveColors.map((c, i) => new WaveLayer(
        (i - 1.5) * 50 + (Math.random() - 0.5) * 20, c,
        30 + Math.random() * 25, 0.003 + Math.random() * 0.003
      ))
    }

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      w = canvas.width  = window.innerWidth  * dpr
      h = canvas.height = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth  + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.resetTransform()
      ctx.scale(dpr, dpr)
      initElements()
    }

    const onMouseMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true }
    const onVisChange = () => {
      if (document.hidden) { cancelAnimationFrame(animId); animId = null }
      else if (!animId) animId = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('visibilitychange', onVisChange)

    const animate = t => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      sparks.forEach(s => { s.update(); s.draw() })

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      waves.forEach(w => w.draw(t))
      ctx.restore()

      particles.forEach((p, i) => {
        p.update(); p.draw()
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist < 150) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(139,92,246,${0.12 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      })

      animId = requestAnimationFrame(animate)
    }

    resize()
    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
