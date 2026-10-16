import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import Hero from './Hero'

const Valley = lazy(() => import('./three/Valley'))

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// If the 3D scene fails, show the illustrated hero instead.
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function ValleyHero() {
  const section = useRef<HTMLElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(true)

  // Stop rendering while the hero is off screen.
  useEffect(() => {
    const element = section.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // The headline drifts up and fades as you scroll into the valley.
  useEffect(() => {
    if (reduceMotion) return
    let frame = 0
    const paint = () => {
      frame = 0
      const y = Math.min(window.scrollY, window.innerHeight)
      if (copy.current) {
        copy.current.style.transform = `translateY(${y * -0.25}px)`
        copy.current.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.6)))
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    window.addEventListener('scroll', schedule, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule) }
  }, [reduceMotion])

  return <section className="hero hero-3d" id="top" ref={section} aria-labelledby="hero-title">
    <div className="valley" aria-hidden="true">
      <Suspense fallback={null}>
        <Valley reduceMotion={reduceMotion} paused={!visible} eventSource={section}/>
      </Suspense>
    </div>
    <div className="hero-copy wrap" ref={copy}>
      <p className="hero-hey"><span className="wave" aria-hidden="true">👋</span> hey, I’m Sai</p>
      <h1 id="hero-title">Building apps that don’t <span className="scribble">fall over.</span></h1>
      <p className="hero-sub">Software engineer. Data science grad who got hooked on what’s underneath.</p>
    </div>
  </section>
}

export default function HeroSwitch() {
  const [webgl] = useState(hasWebGL)
  if (!webgl) return <Hero/>
  return <SceneBoundary fallback={<Hero/>}><ValleyHero/></SceneBoundary>
}
