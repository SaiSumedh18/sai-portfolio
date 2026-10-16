import { useEffect, useState, type ReactNode } from 'react'
import { BorderBeam } from 'border-beam'
import { MetalFx } from 'metal-fx'
import { FaGithub, FaLinkedin, FaJava, FaEnvelope, FaFilePdf } from 'react-icons/fa'
import { SiSpringboot, SiTypescript, SiReact, SiNodedotjs, SiPostgresql, SiRedis, SiDocker, SiGithubactions, SiPython, SiGit, SiExpress, SiJunit5, SiPandas, SiNginx } from 'react-icons/si'
import type { IconType } from 'react-icons'
import HeroSwitch from './ValleyHero'
import Story from './Story'
import Journey from './Journey'
import Work from './Work'

const resume = `${import.meta.env.BASE_URL}Sai-Sumedh-Kaveti-Resume.pdf`
const links = {
  email: 'mailto:saisumedhkaveti@gmail.com',
  linkedin: 'https://www.linkedin.com/in/saisumedhkaveti/',
  github: 'https://github.com/SaiSumedh18',
}

const tools: { name: string; icon: IconType; color: string; use: string }[] = [
  { name: 'Java', icon: FaJava, color: '#f0874a', use: 'Java 21 services for TaskFlow, with transactions and row locks.' },
  { name: 'Spring Boot', icon: SiSpringboot, color: '#7cc35a', use: 'Rebuilt TaskFlow’s API in Spring Boot with no breaking changes.' },
  { name: 'TypeScript', icon: SiTypescript, color: '#5a9be6', use: 'Front to back in FinSight and InsightChat.' },
  { name: 'React', icon: SiReact, color: '#61dafb', use: 'Every interface here, from dashboards to a 3D keyboard.' },
  { name: 'Node.js', icon: SiNodedotjs, color: '#7cc35a', use: 'FinSight’s API and its background workers.' },
  { name: 'Express', icon: SiExpress, color: '#f5efe4', use: 'REST APIs with JWT auth and per-user data isolation.' },
  { name: 'PostgreSQL', icon: SiPostgresql, color: '#7aa6d9', use: 'Analytics queries, triggers, and row-level locks.' },
  { name: 'Redis', icon: SiRedis, color: '#e5584b', use: 'The cache that made FinSight’s dashboard 83% faster.' },
  { name: 'Docker', icon: SiDocker, color: '#4aa3e8', use: 'Every project ships in containers.' },
  { name: 'GitHub Actions', icon: SiGithubactions, color: '#6aa8ff', use: 'CI that runs the integration tests on every push.' },
  { name: 'JUnit 5', icon: SiJunit5, color: '#3fbf8e', use: '31 MockMvc integration tests against real PostgreSQL.' },
  { name: 'Python', icon: SiPython, color: '#f2c94c', use: 'A century of weather data at INCOIS, and the code I teach.' },
  { name: 'Pandas', icon: SiPandas, color: '#b09cf0', use: 'Data prep for regression and forecasting pipelines.' },
  { name: 'Nginx', icon: SiNginx, color: '#4fbf6a', use: 'Serving and proxying containerized apps.' },
  { name: 'Git', icon: SiGit, color: '#f0674a', use: 'Small commits, clear history.' },
]

const steps = [
  ['Measure first', '763 requests/sec at baseline, with a p95 of 18.9 ms.'],
  ['Find the slow path', 'Every dashboard load re-ran the analytics queries.'],
  ['Cache it safely', 'Redis keys carry a per-user revision that every write bumps.'],
  ['Prove it', '19 integration tests against real PostgreSQL and Redis.'],
  ['Measure again', '5,236 requests/sec, p95 down to 3.1 ms.'],
]

const shortcuts = [
  { key: 'E', label: 'Email', hint: 'Roles, projects, or just hi.', detail: 'saisumedhkaveti@gmail.com', href: links.email, icon: FaEnvelope },
  { key: 'L', label: 'LinkedIn', hint: 'The professional version.', detail: 'in/saisumedhkaveti', href: links.linkedin, icon: FaLinkedin },
  { key: 'G', label: 'GitHub', hint: 'All the code, in public.', detail: '@SaiSumedh18', href: links.github, icon: FaGithub },
  { key: 'R', label: 'Resume', hint: 'One page, one click.', detail: 'PDF', href: resume, icon: FaFilePdf },
]

function Glow({ children }: { children: ReactNode }) {
  return <BorderBeam size="md" colorVariant="sunset" theme="light" strength={0.9} duration={3.2} className="contact-beam">{children}</BorderBeam>
}

function Stack() {
  const [picked, setPicked] = useState(tools[7])
  return <section className="stack" id="stack" aria-labelledby="stack-title">
    <div className="wrap">
      <header className="section-intro">
        <p className="kicker">My stack</p>
        <h2 id="stack-title">Everything I build with, unwrapped.</h2>
        <p>Tap a tool to see what I’ve done with it.</p>
      </header>
      <ul className="stickers">
        {tools.map((tool, i) => {
          const Icon = tool.icon
          return <li key={tool.name} style={{ '--tilt': `${((i * 37) % 9) - 4}deg`, '--tint': tool.color } as React.CSSProperties}>
            <button type="button" aria-pressed={picked.name === tool.name} onClick={() => setPicked(tool)}><Icon aria-hidden="true"/>{tool.name}</button>
          </li>
        })}
      </ul>
      <p className="sticker-note" aria-live="polite"><strong style={{ color: picked.color }}>{picked.name}.</strong> {picked.use}</p>
    </div>
  </section>
}

function HowIWork() {
  return <section className="how" aria-labelledby="how-title">
    <div className="wrap">
      <header className="section-intro">
        <p className="kicker">How I work</p>
        <h2 id="how-title">I start with the numbers, then go find the slow part.</h2>
        <p>FinSight’s dashboard, step by step. It’s how I approach most problems.</p>
      </header>
      <ol className="steps">{steps.map(([title, text], i) => <li key={title} style={{ '--i': i } as React.CSSProperties}><span className="step-num">{i + 1}</span><strong>{title}</strong><p>{text}</p></li>)}</ol>
    </div>
  </section>
}

function Contact() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || document.querySelector('dialog[open]')) return
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable]')) return
      const match = shortcuts.find(item => item.key === event.key.toUpperCase())
      if (!match) return
      if (match.href.startsWith('mailto:')) window.location.href = match.href
      else window.open(match.href, '_blank', 'noopener')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <section className="contact" id="contact" aria-labelledby="contact-title">
    <div className="cloud cloud-a" aria-hidden="true"/><div className="cloud cloud-b" aria-hidden="true"/><div className="cloud cloud-c" aria-hidden="true"/>
    <div className="wrap">
      <h2 id="contact-title">Let’s build something that doesn’t fall over.</h2>
      <p className="contact-sub">Looking for software engineering roles from May 2027. Open to relocation. I reply fast.</p>
      <p className="contact-keys">psst, these work on your keyboard too: {shortcuts.map(item => <kbd key={item.key}>{item.key}</kbd>)}</p>
      <ul className="contact-grid">
        {shortcuts.map(({ key, label, hint, detail, href, icon: Icon }) => {
          const card = <a href={href} {...(href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
            <kbd>{key}</kbd>
            <span className="contact-label"><Icon aria-hidden="true"/>{label}</span>
            <span className="contact-hint">{hint}</span>
            <span className="contact-detail">{detail}</span>
          </a>
          // Email is the main ask, so it gets a slow sunset glow around its border.
          return <li key={key}>{key === 'E' ? <Glow>{card}</Glow> : card}</li>
        })}
      </ul>
    </div>
  </section>
}

export default function App() {
  const [active, setActive] = useState('')
  useEffect(() => {
    const ids = ['journey', 'work', 'contact']
    const update = () => {
      const current = ids.filter(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) < window.innerHeight * 0.5).at(-1)
      setActive(current ?? '')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="topbar">
      <a href="#top" className="avatar" aria-label="Sai Sumedh Kaveti, back to top">sk</a>
      <BorderBeam size="sm" colorVariant="sunset" theme="dark" strength={0.8} className="status-beam"><p className="status"><span className="status-dot" aria-hidden="true"/>Open to 2027 SWE roles</p></BorderBeam>
    </header>

    <main id="main">
      <HeroSwitch/>
      <Story/>
      <div className="tear" aria-hidden="true"/>
      <Journey/>
      <div className="tear tear-flip" aria-hidden="true"/>
      <Work/>
      <Stack/>
      <HowIWork/>
      <Contact/>
    </main>

    <footer className="footer"><p>© {new Date().getFullYear()} Sai Sumedh Kaveti · Raleigh, NC</p><p>Hand-drawn in SVG, built with React.</p></footer>

    <nav className="dock" aria-label="Sections">
      {['Journey', 'Work', 'Contact'].map(item => <a key={item} href={`#${item.toLowerCase()}`} aria-current={active === item.toLowerCase() ? 'location' : undefined}>{item}</a>)}
      <MetalFx variant="button" preset="gold" theme="dark" className="dock-metal"><a className="dock-resume" href={resume} target="_blank" rel="noopener noreferrer">Resume ↗</a></MetalFx>
    </nav>
  </>
}
