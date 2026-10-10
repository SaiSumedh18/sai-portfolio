import { useEffect, useRef } from 'react'
import { SiReact, SiNodedotjs, SiRedis, SiPostgresql } from 'react-icons/si'
import { FaLayerGroup, FaArrowDown } from 'react-icons/fa'
import type { CSSProperties } from 'react'

const layers = [
  { name: 'Interface', tech: 'React · TypeScript', icon: SiReact, detail: 'Accounts, budgets, and cash flow in one workspace.' },
  { name: 'API', tech: 'Node.js · Express', icon: SiNodedotjs, detail: 'Authenticated requests and per-user data isolation.' },
  { name: 'Cache', tech: 'Redis', icon: SiRedis, detail: 'Dashboard cache keys include a database-managed user revision.' },
  { name: 'Persistence', tech: 'PostgreSQL', icon: SiPostgresql, detail: 'Financial writes and revision changes commit together.' },
  { name: 'Background jobs', tech: 'BullMQ · CSV imports', icon: FaLayerGroup, detail: 'Atomic imports, idempotent retries, and a durable database outbox.' },
]

export default function ArchitectureShowcase() {
  const section = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = section.current
    if (!element) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const paint = () => {
      frame = 0
      const box = element.getBoundingClientRect()
      const travel = Math.max(1, box.height - window.innerHeight)
      const progress = preference.matches ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.15 - box.top) / travel))
      element.style.setProperty('--unfold', String(progress))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    paint()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    preference.addEventListener('change', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      preference.removeEventListener('change', schedule)
    }
  }, [])
  return <section className="architecture-showcase" ref={section} aria-labelledby="architecture-title">
    <div className="architecture-sticky">
      <div className="architecture-intro">
        <p className="eyebrow">BENEATH THE INTERFACE</p>
        <h2 id="architecture-title">A simple dashboard.<br/><span>A considered system.</span></h2>
        <p>FinSight, opened up. Five parts that turn financial data into a fast dashboard and recoverable background work.</p>
        <a className="architecture-source" href="https://github.com/SaiSumedh18/finsight" target="_blank" rel="noopener noreferrer">Explore the implementation <span aria-hidden="true">↗</span></a>
        <p className="architecture-scroll"><FaArrowDown aria-hidden="true"/> Scroll to unfold the system</p>
      </div>
      <div className="architecture-stage" aria-hidden="true">
        <div className="architecture-orbit"/>
        {layers.map(({name, tech, icon: LayerIcon}, index) => <div className="system-layer" key={name} style={{ '--layer': index } as CSSProperties}>
          <span className="system-icon"><LayerIcon/></span><div><strong>{name}</strong><span>{tech}</span></div><span className="system-status"/>
        </div>)}
        <span className="architecture-stage-caption">FINSIGHT / SYSTEM VIEW</span>
      </div>
      <ol className="architecture-explainer">{layers.map(({name, detail, icon: LayerIcon}) => <li key={name}><LayerIcon aria-hidden="true"/><div><h3>{name}</h3><p>{detail}</p></div></li>)}</ol>
    </div>
  </section>
}
