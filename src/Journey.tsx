import { memo, useEffect, useRef, useState } from 'react'

type Stop = { when: string; place: string; where: string; badge: string; title: string; note: string; tags: string[]; color: string; at: [number, number] }

const stops: Stop[] = [
  { when: '2021', place: 'VNR VJIET', where: 'Hyderabad, Telangana', badge: 'VNR', title: 'Picked computer science, with a data science twist.', note: 'Started a B.Tech in Computer Science (Data Science), learning to code and to ask what the numbers mean.', tags: ['B.Tech CS (Data Science)'], color: '#7aa6d9', at: [380, 1080] },
  { when: 'May 2024', place: 'Prodigy Infotech', where: 'Telangana, India', badge: 'PI', title: 'First internship, first real datasets.', note: 'Visualized World Bank data, built a Decision Tree classifier and a sentiment-analysis pipeline.', tags: ['Python', 'scikit-learn'], color: '#9a8fd6', at: [640, 840] },
  { when: 'Oct 2024', place: 'INCOIS', where: 'Hyderabad, Telangana', badge: 'IN', title: 'A century of weather, one pipeline.', note: 'Built a Python regression pipeline over 100+ years of global meteorological data for climate forecasting, and fell for the engineering behind it.', tags: ['Pandas', 'NumPy', 'scikit-learn'], color: '#5fb3a6', at: [900, 1090] },
  { when: 'May 2025', place: 'Graduated', where: 'Hyderabad, Telangana', badge: '🎓', title: 'B.Tech done, with an 8.93 / 10.', note: 'Wrapped up undergrad with the data side down cold, and a growing pull toward the systems under the models.', tags: ['GPA 8.93 / 10'], color: '#e5c15a', at: [760, 600] },
  { when: '2025', place: 'NC State', where: 'Raleigh, North Carolina', badge: 'NC', title: 'Moved 13,000 km for a master’s.', note: 'M.S. in Computer Science. Built FinSight, TaskFlow, InsightChat AI and more: backends that stay correct, measured to the millisecond.', tags: ['M.S. CS', 'GPA 3.72'], color: '#e0544b', at: [1800, 720] },
  { when: 'Aug 2026', place: 'Teaching Assistant', where: 'Raleigh, North Carolina', badge: 'TA', title: '162 students. A lot of SQL joins.', note: 'Graduate TA for BUS 351 and BUS 458: 12–15 hours a week helping students with Python, SQL and analytics.', tags: ['Python', 'SQL', 'Teaching'], color: '#e0956b', at: [2040, 980] },
  { when: 'May 2027', place: 'Next stop', where: 'Open to relocation', badge: '→', title: 'Your team, hopefully.', note: 'Graduating in May 2027 and looking for software engineering roles where data meets dependable systems.', tags: ['New grad SWE', 'May 2027'], color: '#ffd84d', at: [2240, 600] },
]

type P = [number, number]
// One cubic curve per leg; the Graduated → NC State leg is the long flight across the ocean.
const curves: [P, P, P, P][] = stops.slice(1).map((stop, i) => {
  const [x0, y0] = stops[i].at, [x1, y1] = stop.at
  if (i === 3) return [[x0, y0], [x0 + 300, y0 - 520], [x1 - 380, y1 - 560], [x1, y1]]
  const bend = i % 2 ? 90 : -90
  return [[x0, y0], [x0 + (x1 - x0) / 3 + bend, y0 + (y1 - y0) / 3 + bend], [x0 + (x1 - x0) * 2 / 3 + bend, y0 + (y1 - y0) * 2 / 3 + bend], [x1, y1]]
})
// The legs join end to end, so the route is one continuous path (dashes don't restart).
const route = `M${stops[0].at[0]} ${stops[0].at[1]}` + curves.map(([, b, c, d]) => ` C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}`).join('')

// Sample each curve into an arc-length table, so positions along the route are pure math.
const bezier = ([a, b, c, d]: [P, P, P, P], t: number): P => {
  const u = 1 - t
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]
}
const tables = curves.map(curve => {
  const points = Array.from({ length: 241 }, (_, i) => bezier(curve, i / 240))
  const lengths = [0]
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  return { points, lengths, total: lengths[lengths.length - 1] }
})
const total = tables.reduce((sum, t) => sum + t.total, 0)
function along(leg: number, fraction: number) {
  const { points, lengths, total: legLength } = tables[leg]
  const target = fraction * legLength
  let i = 1
  while (i < lengths.length - 1 && lengths[i] < target) i++
  const span = lengths[i] - lengths[i - 1] || 1, f = (target - lengths[i - 1]) / span
  const [x0, y0] = points[i - 1], [x1, y1] = points[i]
  return { point: [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f] as P, heading: Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI, done: tables.slice(0, leg).reduce((sum, t) => sum + t.total, 0) + target }
}
const MAP = { w: 2600, h: 1500 }

// Streets for the two cities, generated once: a slightly rotated grid plus a few arterials.
function cityGrid(cx: number, cy: number, w: number, h: number, step: number, angle: number) {
  const lines: string[] = []
  for (let x = -w / 2; x <= w / 2; x += step) lines.push(`M${x} ${-h / 2} L${x} ${h / 2}`)
  for (let y = -h / 2; y <= h / 2; y += step * 0.8) lines.push(`M${-w / 2} ${y} L${w / 2} ${y}`)
  return { d: lines.join(' '), transform: `translate(${cx} ${cy}) rotate(${angle})` }
}
const cities = [cityGrid(640, 880, 1100, 1000, 46, -8), cityGrid(2010, 780, 900, 900, 42, 6)]
const blocks = (() => {
  let s = 11
  const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
  return Array.from({ length: 140 }, (_, i) => {
    const left = i < 80
    return { x: (left ? 160 : 1600) + r() * (left ? 980 : 820), y: (left ? 420 : 380) + r() * (left ? 900 : 800), w: 14 + r() * 26, h: 10 + r() * 20 }
  })
})()

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t) }

const intro = 0.08
const PLANE = 'M0 -12 C 1.6 -12 2 -9 2 -6 L 2 -2 L 11 3 L 11 6 L 2 3.5 L 2 8 L 5 10.5 L 5 12.5 L 0 11 L -5 12.5 L -5 10.5 L -2 8 L -2 3.5 L -11 6 L -11 3 L -2 -2 L -2 -6 C -2 -9 -1.6 -12 0 -12 Z'
const ARROW = 'M0 -10 L 7 7 L 0 3 L -7 7 Z'

// Where everything is for a given scroll progress (0..1 through the section).
function frameAt(progress: number) {
  // The first slice zooms from the overview into stop 1; the rest drives the route, pausing at
  // each stop (travel happens in the middle of each leg's share of the scroll).
  const drive = clamp((progress - intro) / (1 - intro))
  const legFloat = drive * (stops.length - 1)
  const leg = Math.min(stops.length - 2, Math.floor(legFloat))
  const travel = smooth(0.3, 0.8, legFloat - leg)
  const active = drive >= 1 ? stops.length - 1 : travel < 0.5 ? leg : leg + 1
  return { ...along(leg, travel), active, zoomIn: smooth(0, intro, progress), flying: leg === 3 && travel > 0.04 && travel < 0.96 }
}

// The map itself never changes, so it renders once; only the viewBox moves.
const StaticMap = memo(function StaticMap() {
  return <>
    <defs>
      <radialGradient id="city-edge"><stop offset="0.6" stopColor="#1b1d27" stopOpacity="0"/><stop offset="1" stopColor="#1b1d27"/></radialGradient>
      <linearGradient id="sea" x1="0" x2="1"><stop offset="0" stopColor="#1b1d27"/><stop offset="0.25" stopColor="#1c2b47"/><stop offset="0.75" stopColor="#1c2b47"/><stop offset="1" stopColor="#1b1d27"/></linearGradient>
    </defs>
    <rect x="-2000" y="-2000" width={MAP.w + 4000} height={MAP.h + 4000} fill="#1b1d27"/>
    {cities.map((c, i) => <g key={i}>
      <path d={c.d} transform={c.transform} className="map-street"/>
      {blocks.filter((_, b) => (b < 80) === (i === 0)).map((b, k) => <rect key={k} x={b.x} y={b.y} width={b.w} height={b.h} rx="2" className="map-block"/>)}
      <path d={i ? 'M1500 860 C 1900 800 2200 900 2600 820' : 'M0 960 C 500 900 820 980 1180 900'} className="map-highway"/>
    </g>)}
    {/* soft edges: the background colour fades in around each city, cheaper than a mask */}
    <ellipse cx="640" cy="880" rx="700" ry="640" fill="url(#city-edge)"/>
    <ellipse cx="2010" cy="780" rx="620" ry="600" fill="url(#city-edge)"/>
    <path d="M1120 -2000 C 1060 200 1190 520 1110 760 C 1030 980 1170 1260 1110 3500 L 1640 3500 C 1690 1200 1560 980 1620 700 C 1680 420 1580 200 1660 -2000 Z" fill="url(#sea)"/>
    {[300, 520, 760, 1000, 1240].map(y => <path key={y} d={`M${1270 + (y % 3) * 30} ${y} q 30 -12 60 0 t 60 0`} className="map-wave"/>)}
    <text x="1370" y="1180" className="map-water">13,000 km</text>
    <ellipse cx="520" cy="660" rx="90" ry="46" className="map-park"/>
    <ellipse cx="1930" cy="560" rx="80" ry="40" className="map-park"/>
    <text x="560" y="520" className="map-city">HYDERABAD</text>
    <text x="1960" y="420" className="map-city">RALEIGH</text>
    <path d={route} className="route-ahead"/>
  </>
})

export default function Journey() {
  const section = useRef<HTMLElement>(null)
  const map = useRef<SVGSVGElement>(null)
  const glow = useRef<SVGPathElement>(null)
  const done = useRef<SVGPathElement>(null)
  const marker = useRef<SVGGElement>(null)
  const markerShape = useRef<SVGPathElement>(null)
  const needle = useRef<HTMLSpanElement>(null)
  const zoom = useRef(1)
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(false)
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // One animation loop drives the map directly (no React render per frame). The displayed
  // progress eases toward the scroll position, so the arrow glides between wheel steps.
  useEffect(() => {
    let frame = 0, last = performance.now(), shownProgress = -1, onScreen = true, lastActive = -1, lastShown: boolean | null = null, lastFlying: boolean | null = null
    const target = () => {
      const box = section.current?.getBoundingClientRect()
      return box ? clamp(-box.top / Math.max(1, box.height - window.innerHeight)) : 0
    }
    const draw = (progress: number) => {
      const f = frameAt(progress)
      const w = window.innerWidth, h = window.innerHeight, narrow = w < 760
      const fit = narrow ? MAP.w * 0.3 : MAP.w * 0.5
      const viewW = (MAP.w * (1 - f.zoomIn) + fit * f.zoomIn) / zoom.current
      const viewH = viewW * (h / Math.max(1, w))
      const focusX = f.point[0] * f.zoomIn + (MAP.w / 2) * (1 - f.zoomIn) - (narrow ? 0 : viewW * 0.16 * f.zoomIn)
      const focusY = f.point[1] * f.zoomIn + (MAP.h / 2) * (1 - f.zoomIn) + (narrow ? viewH * 0.18 * f.zoomIn : 0)
      map.current?.setAttribute('viewBox', `${(focusX - viewW / 2).toFixed(1)} ${(focusY - viewH / 2).toFixed(1)} ${viewW.toFixed(1)} ${viewH.toFixed(1)}`)
      const dash = `${f.done.toFixed(1)} ${total + 10}`
      glow.current?.setAttribute('stroke-dasharray', dash)
      done.current?.setAttribute('stroke-dasharray', dash)
      marker.current?.setAttribute('transform', `translate(${f.point[0].toFixed(1)} ${f.point[1].toFixed(1)}) rotate(${(f.heading + 90).toFixed(1)})`)
      if (f.flying !== lastFlying) { markerShape.current?.setAttribute('d', f.flying ? PLANE : ARROW); lastFlying = f.flying }
      if (needle.current) needle.current.style.transform = `rotate(${(f.heading + 90).toFixed(1)}deg)`
      // React only re-renders when the stop or the overlay visibility actually changes.
      if (f.active !== lastActive) { lastActive = f.active; setActive(f.active) }
      const show = f.zoomIn > 0.6
      if (show !== lastShown) { lastShown = show; setShown(show) }
    }
    const tick = (now: number) => {
      frame = 0
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const goal = target()
      if (shownProgress < 0 || reduce) shownProgress = goal
      else shownProgress += (goal - shownProgress) * (1 - Math.exp(-dt * 9))
      if (Math.abs(goal - shownProgress) < 0.00005) shownProgress = goal
      draw(shownProgress)
      // Keep animating while easing, otherwise sleep until the next scroll or resize.
      if (onScreen && shownProgress !== goal) frame = requestAnimationFrame(tick)
    }
    const wake = () => { if (!frame && onScreen) { last = performance.now(); frame = requestAnimationFrame(tick) } }
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; wake() })
    if (section.current) observer.observe(section.current)
    const onZoom = () => wake()
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', wake)
    window.addEventListener('journey-zoom', onZoom)
    wake()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', wake); window.removeEventListener('resize', wake); window.removeEventListener('journey-zoom', onZoom) }
  }, [reduce])

  const setZoom = (value: number) => { zoom.current = value; window.dispatchEvent(new Event('journey-zoom')) }
  const stop = stops[active]
  const scrollToStop = (i: number) => {
    const box = section.current
    if (!box) return
    const span = box.offsetHeight - window.innerHeight
    const goal = intro + (1 - intro) * (i / (stops.length - 1))
    window.scrollTo({ top: box.offsetTop + span * goal + 2, behavior: reduce ? 'auto' : 'smooth' })
  }

  return <section className="journey" id="journey" ref={section} aria-labelledby="journey-title" style={{ height: `${(stops.length + 1) * 100}vh` }}>
    <div className="journey-pin">
      <svg ref={map} className="journey-map" viewBox={`0 0 ${MAP.w} ${MAP.h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <StaticMap/>
        <path ref={glow} d={route} className="route-glow" strokeDasharray={`0 ${total + 10}`}/>
        <path ref={done} d={route} className="route-done" strokeDasharray={`0 ${total + 10}`}/>
        {stops.map((s, i) => <g key={s.place} transform={`translate(${s.at[0]} ${s.at[1]})`} className={`map-stop${i === active ? ' is-active' : ''}${i < active ? ' is-past' : ''}`} style={{ '--pin': s.color } as React.CSSProperties}>
          <path d="M0 0 C -6 -14 -22 -24 -22 -42 A 22 22 0 1 1 22 -42 C 22 -24 6 -14 0 0 Z" className="map-pin"/>
          <text y="-36" className="map-pin-text">{i + 1}</text>
          <text x="32" y="-34" className="map-pin-label">{s.place}</text>
        </g>)}
        <g ref={marker} transform={`translate(${stops[0].at[0]} ${stops[0].at[1]})`}>
          <circle r="34" className="nav-halo"/>
          <circle r="15" className="nav-dot"/>
          <path ref={markerShape} d={ARROW} className="nav-arrow"/>
        </g>
      </svg>

      <div className="wrap journey-ui">
        <header className={`section-intro journey-intro${shown ? ' is-hidden' : ''}`}>
          <p className="kicker">The journey</p>
          <h2 id="journey-title">Data science by degree, backend by obsession.</h2>
          <p>Seven stops from Hyderabad to Raleigh. Scroll to drive the route.</p>
        </header>

        <article className={`stop-card${shown ? ' is-shown' : ''}`} style={{ '--pin': stop.color } as React.CSSProperties} aria-live="polite">
          <div className="stop-head">
            <span className="stop-badge" aria-hidden="true">{stop.badge}</span>
            <div><p className="stop-place">{stop.place}</p><p className="stop-when">{stop.when}, {stop.where}</p></div>
            <span className="stop-count">{String(active + 1).padStart(2, '0')} / {String(stops.length).padStart(2, '0')}</span>
          </div>
          <div className="stop-body" key={active}>
            <h3>{stop.title}</h3>
            <p>{stop.note}</p>
            <ul className="stop-tags">{stop.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
          </div>
        </article>

        <div className={`compass${shown ? ' is-shown' : ''}`} aria-hidden="true">
          <span className="compass-n">N</span><span className="compass-e">E</span><span className="compass-s">S</span><span className="compass-w">W</span>
          <span ref={needle} className="compass-needle"/>
        </div>
        <div className={`map-controls${shown ? ' is-shown' : ''}`}>
          <button type="button" aria-label="Re-centre the map" onClick={() => setZoom(1)}>◎</button>
          <button type="button" aria-label="Zoom in" onClick={() => setZoom(Math.min(2, +(zoom.current * 1.25).toFixed(2)))}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => setZoom(Math.max(0.5, +(zoom.current / 1.25).toFixed(2)))}>−</button>
        </div>

        <nav className={`trip${shown ? ' is-shown' : ''}`} aria-label="Journey stops">
          <ol>{stops.map((s, i) => <li key={s.place}>
            <button type="button" aria-label={`${s.when}, ${s.place}`} aria-current={i === active ? 'step' : undefined}
              className={i < active ? 'is-past' : undefined} style={{ '--pin': s.color } as React.CSSProperties} onClick={() => scrollToStop(i)}/>
          </li>)}</ol>
          <span>{stop.when}, {stop.place}</span>
        </nav>
      </div>
    </div>
  </section>
}
