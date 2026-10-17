import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import Hero from './Hero'
import type { PlaceId } from './three/Valley'

const Valley = lazy(() => import('./three/Valley'))
const resume = `${import.meta.env.BASE_URL}Sai-Sumedh-Kaveti-Resume.pdf`

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

type Place = { name: string; role: string; when: string; title: string; story: string; stats: [string, string][]; action: { label: string; href: string; external?: boolean }; color: string }

// The story card for each place in the valley.
const places: Record<PlaceId, Place> = {
  incois: {
    name: 'INCOIS', role: 'Machine Learning Intern', when: 'Oct 2024 – Apr 2025, Hyderabad', color: '#5fb3a6',
    title: 'A century of weather, one pipeline.',
    story: 'At the Indian National Centre for Ocean Information Services, I built an end-to-end Python regression pipeline over 100+ years of global meteorological data for climate forecasting, then turned the preprocessing into reusable modules.',
    stats: [['100+ years', 'of weather data'], ['End to end', 'regression pipeline']],
    action: { label: 'Walk the journey', href: '#journey' },
  },
  vnr: {
    name: 'VNR VJIET', role: 'B.Tech, Computer Science (Data Science)', when: '2021 – 2025, Hyderabad', color: '#7aa6d9',
    title: 'Where the data science started.',
    story: 'Four years of algorithms, statistics and machine learning, plus a first internship at Prodigy Infotech building classifiers and visualizations on real datasets.',
    stats: [['8.93 / 10', 'GPA'], ['2025', 'Graduated']],
    action: { label: 'Walk the journey', href: '#journey' },
  },
  ncstate: {
    name: 'NC State', role: 'M.S. Computer Science, Graduate TA', when: 'Graduating May 2027, Raleigh', color: '#e0544b',
    title: 'Where the backends got serious.',
    story: 'I build full-stack systems in Java, Spring Boot, TypeScript and PostgreSQL that stay correct under retries and load. As a Graduate TA, I help 162 students a week with Python and SQL.',
    stats: [['3.72', 'GPA'], ['162', 'students each week']],
    action: { label: 'See my projects', href: '#work' },
  },
  me: {
    name: 'Sai Sumedh Kaveti', role: 'Software engineer, new grad 2027', when: 'Raleigh, NC, open to relocation', color: '#ffd84d',
    title: 'Data and the systems that serve it.',
    story: 'I love both sides: the models and analysis, and the dependable backends underneath them. I’m looking for software engineering roles starting May 2027.',
    stats: [['May 2027', 'Available from'], ['Anywhere', 'Open to relocation']],
    action: { label: 'Open my resume', href: resume, external: true },
  },
}
const order: PlaceId[] = ['vnr', 'incois', 'ncstate', 'me']

function ValleyHero({ night }: { night: boolean }) {
  const section = useRef<HTMLElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLElement>(null)
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visible, setVisible] = useState(true)
  const [active, setActive] = useState<PlaceId | null>(null)
  const [explored, setExplored] = useState(false)

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

  // An open place card closes with Escape, and arrow keys step between places.
  useEffect(() => {
    if (!active) return
    card.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const step = event.key === 'ArrowRight' ? 1 : -1
        setActive(current => current && order[(order.indexOf(current) + step + order.length) % order.length])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const open = (id: PlaceId) => { setActive(id); setExplored(true) }
  const place = active && places[active]

  return <section className={`hero hero-3d${night ? ' is-night' : ''}${active ? ' is-exploring' : ''}`} id="top" ref={section} aria-labelledby="hero-title">
    <div className="valley">
      <Suspense fallback={null}>
        <Valley reduceMotion={reduceMotion} paused={!visible} eventSource={section} night={night} active={active} onSelect={open} showHint={!explored}/>
      </Suspense>
    </div>

    <div className="hero-copy wrap" ref={copy}>
      <p className="hero-hey"><span className="wave" aria-hidden="true">👋</span> hey, I’m <span className="hero-name">Sai Sumedh</span></p>
      <h1 id="hero-title">Building apps that don’t <span className="scribble">fall over.</span></h1>
      <p className="hero-sub">Software engineer who loves data and the systems that serve it.</p>
    </div>

    {place && active && <article className="place-card" ref={card} tabIndex={-1} role="dialog" aria-labelledby="place-title" style={{ '--place': place.color } as React.CSSProperties} key={active}>
      <button type="button" className="place-close" onClick={() => setActive(null)} aria-label="Close and return to the valley">×</button>
      <p className="place-name">{place.name}</p>
      <p className="place-role">{place.role}</p>
      <p className="place-when">{place.when}</p>
      <h2 id="place-title">{place.title}</h2>
      <p className="place-story">{place.story}</p>
      <dl className="place-stats">{place.stats.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>
      <div className="place-actions">
        <a className="btn btn-yellow" href={place.action.href} onClick={() => setActive(null)} {...(place.action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{place.action.label} {place.action.external ? '↗' : '↓'}</a>
        <div className="place-nav">
          <button type="button" aria-label="Previous place" onClick={() => setActive(order[(order.indexOf(active) - 1 + order.length) % order.length])}>←</button>
          <button type="button" aria-label="Next place" onClick={() => setActive(order[(order.indexOf(active) + 1) % order.length])}>→</button>
        </div>
      </div>
    </article>}
  </section>
}

export default function HeroSwitch({ night }: { night: boolean }) {
  const [webgl] = useState(hasWebGL)
  if (!webgl) return <Hero/>
  return <SceneBoundary fallback={<Hero/>}><ValleyHero night={night}/></SceneBoundary>
}
