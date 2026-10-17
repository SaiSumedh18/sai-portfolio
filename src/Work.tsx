import { useEffect, useRef, useState } from 'react'
import { FaGithub } from 'react-icons/fa'

const base = import.meta.env.BASE_URL
const github = 'https://github.com/SaiSumedh18'

const projects = [
  {
    name: 'FinSight', tag: 'The Cache That Never Lies', metric: '83%', metricLabel: 'faster dashboard',
    colors: ['#3aa17c', '#1d5c47'],
    summary: 'Personal finance tracking with a backend that stays correct through retries, cache hits and queue failures.',
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'BullMQ', 'Docker'],
    image: 'finsight.png', alt: 'FinSight dashboard with cash flow, budgets, and recent transactions',
    proof: [['83%', 'lower dashboard p95, 18.9 → 3.1 ms'], ['6.9×', 'throughput, 763 → 5,236 requests/sec'], ['19', 'PostgreSQL and Redis integration tests']],
    repo: 'finsight', demo: 'https://sai-finsight-demo.onrender.com',
    demoNote: 'Free hosting, so the first visit can take about a minute to wake up.',
    notes: 'PostgreSQL triggers bump a per-user revision in every write, and that revision is part of the Redis key, so cached reads are never stale. CSV imports of up to 10,000 rows run through BullMQ with idempotency keys, atomic commits and a database outbox that recovers accepted imports after a queue failure.',
    method: 'Measured locally with k6: 10 concurrent users, 10,000 synthetic transactions. Not a production benchmark.',
  },
  {
    name: 'TaskFlow', tag: 'The Bouncer', metric: '31', metricLabel: 'integration tests',
    colors: ['#4f82e8', '#22468f'],
    summary: 'A team Kanban board where access is checked on every request, so a removed member is out right away.',
    stack: ['Java 21', 'Spring Boot', 'Spring Security', 'JPA', 'PostgreSQL', 'React', 'Docker'],
    image: 'taskflow.png', alt: 'TaskFlow Kanban board with to-do, in-progress, and completed tasks',
    proof: [['31', 'JUnit 5 + MockMvc tests on real PostgreSQL'], ['0', 'breaking changes migrating Node.js to Java 21']],
    repo: 'taskflow', demo: 'https://sai-taskflow-demo.onrender.com',
    demoNote: 'The Spring Boot backend can take about a minute to wake up.',
    notes: 'JWT auth with role-based access checks project membership on every request. Removing a member clears their assignments in one transaction. Row-level locks stop two people from overwriting each other’s edits. The old Node.js backend stays as a rollback option.',
    method: 'Tests run in GitHub Actions CI against a real PostgreSQL database.',
  },
  {
    name: 'InsightChat AI', tag: 'The Honest Analyst', metric: '94%', metricLabel: 'fewer tokens, at best',
    colors: ['#9a72e0', '#563a9e'],
    summary: 'Upload a CSV and ask it questions. The math happens in code; the model only explains it.',
    stack: ['React', 'TypeScript', 'Express', 'PostgreSQL', 'OpenAI API', 'SSE', 'Playwright'],
    image: 'insightchat.png', alt: 'InsightChat workspace with dataset charts, statistics, and a contextual chat',
    proof: [['80–94%', 'fewer evidence tokens on a 10,000-row dataset'], ['38', 'backend and Playwright end-to-end tests']],
    repo: 'insightchat-ai', demo: 'https://sai-insightchat-demo.onrender.com',
    demoNote: 'Uploads and charts work in the demo. AI chat is off until an API budget is set.',
    notes: 'Each question gets only the columns and aggregates it needs, and the model is told to decline anything the data can’t support. Answers stream over Server-Sent Events; close the tab and the model call is cancelled, with nothing half-saved.',
    method: 'Token savings estimated on three local question fixtures, evidence only.',
  },
  {
    name: 'FORM / 65', tag: 'The Keyboard Builder', metric: '27', metricLabel: 'possible builds',
    colors: ['#ee8a55', '#a8482a'],
    summary: 'Configure a mechanical keyboard and watch it assemble, layer by layer, as you scroll.',
    stack: ['React', 'TypeScript', 'Vite', 'CSS 3D', 'GitHub Actions'],
    image: 'form65.png', alt: 'FORM / 65 interactive keyboard assembly with separated layers',
    proof: [['27', 'finish, keycap and switch combinations'], ['4', 'layers in the scroll-driven assembly']],
    repo: 'form65', demo: 'https://saisumedh18.github.io/form65/',
    demoNote: 'A product demo with no checkout. Builds save in your browser.',
    notes: 'Every build lives in the URL, so sharing a link shares the exact keyboard. The cart persists locally, and reduced-motion settings get a calm, static assembly.',
    method: 'Counts describe what’s built, not performance.',
  },
  {
    name: 'Inkwell Slate', tag: 'The Honest Checkout', metric: '0', metricLabel: 'prices trusted from the browser',
    colors: ['#2340c7', '#14287f'],
    summary: 'An Apple-style store for a made-up e-ink notebook, from a scroll-written hero to a checkout backed by a real orders API.',
    stack: ['Next.js 16', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Upstash Redis', 'Vercel'],
    image: 'inkwell.jpg', alt: 'Inkwell Slate: a handwritten note being written by a stylus on a ruled e-ink page',
    proof: [['0', 'client-sent prices accepted; every total is recalculated on the server'], ['3', 'API routes: place an order, look it up, and a password-protected admin list']],
    repo: 'inkwell-slate', demo: 'https://inkwell-slate.vercel.app',
    demoNote: 'A demo store: orders are saved so you can look them up, but nothing is charged or shipped.',
    notes: 'Scrolling the hero writes a note by hand, then turns it into typed text. A configurator previews finish, pen, storage, cover and engraving live, and the bag survives reloads. Checkout posts to a Next.js route handler that validates every field, reprices from the catalogue and stores the order in Redis; lookups need the matching email, and the admin list uses a timing-safe password check.',
    method: 'Counts describe what’s built, not performance.',
  },
  {
    name: 'Create Daily', tag: 'The Paper Koi', metric: '0', metricLabel: '3D models downloaded',
    colors: ['#e5392b', '#a3170f'],
    summary: 'A procedurally folded origami koi that swims across a red page, follows your cursor, and swims over to eat the food you drop.',
    stack: ['TypeScript', 'Three.js', 'Vite', 'GitHub Actions'],
    image: 'create-daily.jpg', alt: 'Create Daily: a faceted origami koi swimming across giant white CREATE DAILY type on a red page',
    proof: [['0', 'downloaded models or textures; every fold is generated in code'], ['~720', 'lines of TypeScript and Three.js']],
    repo: 'create-daily', demo: 'https://saisumedh18.github.io/create-daily/',
    demoNote: 'Move to lead the koi, click to feed it. Works with touch.',
    notes: 'The body is built from rings with a faceted diamond cross-section, coloured face by face like folded paper. A travelling sine wave bends it as it swims, its tail beats faster at speed, and it steers toward your pointer or the nearest pellet. Reduced-motion settings get a slow, still drift.',
    method: 'A creative coding study, separate from the engineering projects above.',
  },
]
type Project = typeof projects[number]

export default function Work() {
  const [open, setOpen] = useState<Project | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [open])

  return <section className="work" id="work" aria-labelledby="work-title">
    <div className="wrap">
      <header className="section-intro">
        <p className="kicker">Selected work</p>
        <h2 id="work-title">Things I built, and the numbers they moved.</h2>
        <p>Six projects, all live and open source. Pick a card from the box.</p>
      </header>

      <div className="box">
        <div className="box-back" aria-hidden="true"/>
        <ul className="cards">
          {projects.map((project, i) => <li key={project.name} style={{ '--i': i, '--c1': project.colors[0], '--c2': project.colors[1] } as React.CSSProperties}>
            <button type="button" className="card" onClick={() => setOpen(project)}>
              <span className="card-tag">{project.tag}</span>
              <span className="card-metric">{project.metric}</span>
              <span className="card-metric-label">{project.metricLabel}</span>
              <span className="card-name">{project.name}</span>
            </button>
          </li>)}
        </ul>
        <div className="box-front" aria-hidden="true"><span>sai’s projects · handle with care</span></div>
      </div>

      <ol className="work-list">
        {projects.map(project => <li key={project.name}><button type="button" onClick={() => setOpen(project)}><strong>{project.tag}</strong><span>{project.name}</span></button></li>)}
      </ol>
    </div>

    <dialog ref={dialog} className="case" onClose={() => setOpen(null)} aria-labelledby="case-title">
      {open && <div className="case-inner" style={{ '--c1': open.colors[0], '--c2': open.colors[1] } as React.CSSProperties}>
        <div className="case-top">
          <div><p className="kicker">{open.tag}</p><h3 id="case-title">{open.name}</h3></div>
          <button type="button" className="round" onClick={() => setOpen(null)} aria-label="Close" autoFocus>×</button>
        </div>
        <img src={`${base}${open.image}`} alt={open.alt}/>
        <p className="case-summary">{open.summary}</p>
        <ul className="case-proof">{open.proof.map(([value, label]) => <li key={label}><strong>{value}</strong><span>{label}</span></li>)}</ul>
        <p className="case-notes">{open.notes}</p>
        <ul className="case-stack">{open.stack.map(tech => <li key={tech}>{tech}</li>)}</ul>
        <div className="case-actions">
          <a className="btn btn-yellow" href={open.demo} target="_blank" rel="noopener noreferrer">Open live demo ↗</a>
          <a className="btn" href={`${github}/${open.repo}`} target="_blank" rel="noopener noreferrer"><FaGithub aria-hidden="true"/> Source</a>
        </div>
        <p className="fine">{open.demoNote} {open.method}</p>
      </div>}
    </dialog>
  </section>
}
