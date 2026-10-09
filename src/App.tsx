import { useEffect, useRef, useState } from 'react'
import { FaGithub, FaLinkedin, FaJava, FaCode, FaLayerGroup, FaDatabase, FaCloud, FaShieldAlt, FaFlask, FaGraduationCap, FaMapMarkerAlt, FaRegCalendarAlt, FaEnvelope } from 'react-icons/fa'
import { SiTypescript, SiJavascript, SiPython, SiReact, SiSpringboot, SiNodedotjs, SiPostgresql, SiRedis, SiDocker, SiKubernetes, SiGit, SiMysql, SiMongodb, SiSqlite, SiGithubactions } from 'react-icons/si'
import type { IconType } from 'react-icons'

const base = import.meta.env.BASE_URL
const resume = `${base}Sai-Sumedh-Kaveti-Resume.pdf`
const links = {
  email: 'mailto:saisumedhkaveti@gmail.com',
  phone: 'tel:+19843182047',
  linkedin: 'https://www.linkedin.com/in/saisumedhkaveti/',
  github: 'https://github.com/SaiSumedh18',
}
const navigation = ['Projects', 'About', 'Experience', 'Skills', 'Education', 'Contact']
const projects = [
  {
    name: 'FinSight', category: 'BACKEND & ASYNC PROCESSING',
    description: 'Personal finance, with a resilient backend.',
    detail: 'Track accounts, transactions, and budgets with PostgreSQL analytics. Redis accelerates the dashboard; BullMQ handles CSV imports with retries, idempotency, and recoverable dispatch.',
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'BullMQ'],
    image: 'finsight.png', alt: 'FinSight dashboard with cash flow, budgets, and recent transactions',
    metric: '18.88 → 3.12 ms', metricLabel: 'Local dashboard p95 · warm cache', repo: 'finsight',
    demo: 'https://sai-finsight-demo.onrender.com', demoNote: 'Free demo · the first visit may take about a minute to wake up.',
    architecture: ['React interface', 'Express API', 'PostgreSQL + Redis', 'BullMQ CSV worker'],
    engineering: 'The database acts as a durable outbox so accepted imports can be recovered after a queue failure. Invalid CSVs fail without partial data; idempotency prevents duplicate imports.',
    method: 'One paired local k6 comparison: 10,000 synthetic transactions, 10 concurrent users, 30 seconds per run. Cache-disabled baseline ran first; cached run followed 20 warmup requests. This is not a production SLA or cloud benchmark.',
  },
  {
    name: 'TaskFlow', category: 'JAVA & FULL-STACK DEVELOPMENT',
    description: 'Collaborative work, backed by careful authorization.',
    detail: 'A team Kanban platform for project membership, task assignments, priorities, and deadlines. The Java 21 / Spring Boot upgrade preserves the React interface and adds transactional services and JPA persistence.',
    stack: ['React', 'Java 21', 'Spring Boot', 'Spring Security', 'PostgreSQL', 'JUnit 5'],
    image: 'taskflow.png', alt: 'TaskFlow Kanban board with to-do, in-progress, and completed tasks',
    metric: 'Java 21 + Spring', metricLabel: 'JWT security · JPA · JUnit / MockMvc', repo: 'taskflow',
    demo: 'https://sai-taskflow-demo.onrender.com', demoNote: 'Live Java / Spring Boot demo · the backend may take about a minute to wake up.',
    architecture: ['React interface', 'Spring Security', 'Transactional services', 'JPA / PostgreSQL'],
    engineering: 'Row locks serialize membership and task changes. Removing a member clears their assignments atomically and revokes project access, even when their JWT remains valid.',
    method: 'The public demo runs the Java 21 / Spring Boot upgrade with a dedicated PostgreSQL database. Signup, project and task creation, membership authorization, and access revocation were verified after deployment.',
  },
  {
    name: 'InsightChat AI', category: 'GROUNDED AI & DATA ANALYTICS',
    description: 'A conversation with your data, grounded in evidence.',
    detail: 'Upload CSVs, explore statistics and charts, and ask questions in a streaming chat. Deterministic calculations and question-specific evidence keep arithmetic in application code and bound the model’s context.',
    stack: ['React', 'TypeScript', 'Express', 'PostgreSQL', 'OpenAI API', 'SSE'],
    image: 'insightchat.png', alt: 'InsightChat workspace with dataset charts, statistics, and a contextual chat',
    metric: '80–94% less context', metricLabel: 'Locally estimated evidence tokens', repo: 'insightchat-ai',
    sourceUnavailable: true,
    demo: 'https://sai-insightchat-demo.onrender.com', demoNote: 'Free analytics demo · CSV uploads and charts work. AI chat is disabled until an API budget is enabled.',
    architecture: ['CSV validation', 'All-row statistics', 'Bounded evidence', 'Streamed AI response'],
    engineering: 'Dataset ownership is checked before inference. Failed or aborted responses leave no partial chat turn; completed user and assistant messages are persisted together. The model cannot execute SQL or code.',
    method: 'Three local question fixtures on a synthetic 10,000-row dataset. Token estimates cover evidence JSON only, excluding instructions, history, API framing, and output. No live-model accuracy or cost reduction is claimed. The repository is currently unavailable to public visitors.',
  },
]
type Project = typeof projects[number]
type IconName = 'github' | 'linkedin' | 'mail' | 'phone' | 'download' | 'expand'
function Icon({ name }: { name: IconName }) {
  const brands: Partial<Record<IconName, IconType>> = { github: FaGithub, linkedin: FaLinkedin, mail: FaEnvelope }
  const BrandIcon = brands[name]
  if (BrandIcon) return <BrandIcon className={`app-icon app-icon-${name}`} aria-hidden="true" />
  const paths: Partial<Record<IconName, React.ReactNode>> = {
    phone: <path d="M21 16v3a2 2 0 0 1-2 2C9 21 3 15 3 5a2 2 0 0 1 2-2h3l2 5-2 2a16 16 0 0 0 6 6l2-2Z"/>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
    expand: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></>,
  }
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
const skillIcons: Record<string, { icon: IconType; color: string }> = {
  Java: {icon: FaJava, color: '#b34c15'}, TypeScript: {icon: SiTypescript, color: '#3178c6'},
  JavaScript: {icon: SiJavascript, color: '#957700'}, Python: {icon: SiPython, color: '#3776ab'},
  React: {icon: SiReact, color: '#087a9b'}, 'Spring Boot': {icon: SiSpringboot, color: '#477b18'},
  'Node.js': {icon: SiNodedotjs, color: '#3e7838'}, PostgreSQL: {icon: SiPostgresql, color: '#336791'},
  Redis: {icon: SiRedis, color: '#b3322a'}, Docker: {icon: SiDocker, color: '#087bc1'},
  Kubernetes: {icon: SiKubernetes, color: '#326ce5'}, Git: {icon: SiGit, color: '#ce482e'},
  MySQL: {icon: SiMysql, color: '#4479a1'}, MongoDB: {icon: SiMongodb, color: '#367d35'},
  SQLite: {icon: SiSqlite, color: '#24587c'}, 'GitHub Actions': {icon: SiGithubactions, color: '#2088ff'},
}
const categoryIcons: Record<string, IconType> = {
  Languages: FaCode, Applications: FaLayerGroup, 'Data & AI': FaDatabase,
  'Cloud & delivery': FaCloud, Engineering: FaShieldAlt, Testing: FaFlask,
}
function SkillGroup({ title, skills }: { title: string; skills: string[] }) {
  const CategoryIcon = categoryIcons[title]
  return <div className={`skill-group skill-${title.split(' ')[0].toLowerCase()}`}>
    <div className="skill-title"><span className="category-icon"><CategoryIcon aria-hidden="true"/></span><h3>{title}</h3></div>
    <ul className="skill-chips">{skills.map(skill => {
      const item = skillIcons[skill]
      const TechIcon = item?.icon
      return <li key={skill}>{TechIcon && <TechIcon style={{color:item.color}} aria-hidden="true"/>}<span>{skill}</span></li>
    })}</ul>
  </div>
}
function External({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} className={className} {...(href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>
}
function SectionTitle({ label, title, intro }: { label: string; title: string; intro?: string }) {
  return <div className="section-heading"><div><h2>{label === "SELECTED WORK" ? "Projects" : label === "TOOLKIT" ? "Skills" : label.charAt(0) + label.slice(1).toLowerCase()}</h2><p className="section-subtitle">{title}</p></div>{intro && <p>{intro}</p>}</div>
}
function ProjectCard({ project, index, onPreview }: { project: Project; index: number; onPreview: (project: Project) => void }) {
  return <article className={`project project-${index}`}>
    <div className="project-visual">
      <div className="project-visual-heading"><span>{project.name}</span><button onClick={() => onPreview(project)} aria-label={`Enlarge ${project.name} screenshot`}><Icon name="expand"/></button></div>
      <button className="screenshot-button" onClick={() => onPreview(project)} aria-label={`Preview ${project.name} application`}><img src={`${base}${project.image}`} alt={project.alt} loading="lazy"/></button>
      <div className="project-proof"><strong>{project.metric}</strong><span>{project.metricLabel}</span></div>
    </div>
    <div className="project-content">
      <p className="eyebrow">{project.category}</p><h3>{project.name}</h3><p className="project-description">{project.description}</p><p>{project.detail}</p>
      <ul className="tags" aria-label={`${project.name} technologies`}>{project.stack.map(tech => <li key={tech}>{tech}</li>)}</ul>
      <div className="actions"><External className="button small" href={project.sourceUnavailable ? links.github : `${links.github}/${project.repo}`}><Icon name="github"/>{project.sourceUnavailable ? 'GitHub profile' : 'View source'}</External>{project.demo && <External className="button small outline" href={project.demo}>Live Demo</External>}</div>
      {project.demo && <p className="link-note">{project.demoNote}</p>}
      {project.sourceUnavailable && <p className="link-note">Source repository isn’t currently public. Browse my other work on GitHub.</p>}
      <details className="engineering-details"><summary>Engineering details & measurement notes</summary><ol className="architecture">{project.architecture.map(step => <li key={step}>{step}</li>)}</ol><p>{project.engineering}</p><p className="method-note">{project.method}</p></details>
    </div>
  </article>
}
export default function App() {
  const [activeSection, setActiveSection] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const updateSection = () => {
      const header = document.querySelector('header')?.getBoundingClientRect().height ?? 90
      const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'))
      const current = sections.filter(section => section.getBoundingClientRect().top <= header + 70).at(-1)
      setActiveSection(current?.id ?? 'home')
    }
    updateSection()
    window.addEventListener('scroll', updateSection, { passive: true })
    window.addEventListener('resize', updateSection)
    return () => {
      window.removeEventListener('scroll', updateSection)
      window.removeEventListener('resize', updateSection)
    }
  }, [])
  const [preview, setPreview] = useState<Project | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (preview) dialog.current?.showModal()
    else dialog.current?.close()
  }, [preview])
  useEffect(() => {
    if (!preview) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [preview])
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="header"><div className="container header-inner">
      <a className="brand" href="#home" aria-label="Sai Sumedh Kaveti, home"><span className="brand-monogram">sk.</span><span>Sai Sumedh Kaveti</span></a>
      
      <nav id="navigation" className="nav" aria-label="Main navigation">{navigation.map(item => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setActiveSection(item.toLowerCase())} aria-current={activeSection === item.toLowerCase() ? 'location' : undefined}>{item}</a>)}</nav>
      <a className="header-resume" href={resume} target="_blank" rel="noopener noreferrer"><Icon name="download"/>Resume</a>
    </div></header>
    <main id="main">
      <section className="hero" id="home"><div className="container hero-grid">
        <div className="hero-copy"><p className="eyebrow hero-eyebrow">SOFTWARE ENGINEER <span>/</span> RALEIGH, NC</p>
          <h1>Sai Sumedh<br/><span>Kaveti.</span></h1>
          <p className="hero-description">Full-stack applications.<br/>Reliable backends. Grounded AI.</p>
          <p className="headline">M.S. Computer Science @ NC State <span>·</span> New Grad 2027</p>
          <div className="actions"><a className="button primary" href="#projects">Explore projects</a><a className="button outline" href={resume} target="_blank" rel="noopener noreferrer"><Icon name="download"/>View resume</a></div>
          <div className="hero-social"><External href={links.github}><Icon name="github"/>GitHub</External><External href={links.linkedin}><Icon name="linkedin"/>LinkedIn</External><External href={links.email}><Icon name="mail"/>Email</External></div>
        </div>
        <aside className="hero-feature" aria-label="Featured project: FinSight">
          <div className="feature-heading"><span>FEATURED BUILD</span></div>
          <div className="hero-app"><img src={`${base}finsight.png`} alt="FinSight financial dashboard with cash flow and budget analytics" fetchPriority="high"/></div>
          <div className="feature-caption"><div><h2>FinSight</h2><p>Finance dashboard & async backend</p></div><a href="#projects">Explore project</a></div>
          <div className="feature-metric"><div><strong>3.12<span> ms</span></strong><p>Local warm-cache dashboard p95</p></div><span className="feature-chip">Redis + BullMQ</span></div>
        </aside>
      </div><div className="container hero-foot"><span>BUILDING WITH</span><p>Java <span>·</span> TypeScript <span>·</span> React <span>·</span> PostgreSQL</p><span>DESIGNED, BUILT & TESTED</span></div></section>
      <div className="container">
        <section id="projects" className="section projects-section"><SectionTitle label="SELECTED WORK" title="Three builds. Different challenges." intro="A financial backend, a collaborative workspace, and an AI analytics tool. Here’s what I built and how it works."/><div className="project-list">{projects.map((project, index) => <ProjectCard key={project.name} project={project} index={index} onPreview={setPreview}/>)}</div></section>
        <section id="about" className="section about"><SectionTitle label="ABOUT" title="Software engineering, with a data science foundation."/><div className="about-copy"><p>I’m a computer science graduate student at NC State. My work spans Java services, React applications, asynchronous processing, and AI-assisted data analysis.</p><p>I like the parts of engineering that make a product dependable: clear authorization, recoverable jobs, useful tests, and measurements that explain where the time goes.</p><p>As a Graduate Teaching Assistant, I help students work through Python and SQL problems. Before graduate school, I built climate-data pipelines and predictive models at INCOIS.</p><div className="about-facts"><div><strong>Raleigh, NC</strong><span>Current location</span></div><div><strong>May 2027</strong><span>Expected graduation</span></div></div></div></section>
        <section id="experience" className="section"><SectionTitle label="EXPERIENCE" title="Teaching, building, and learning."/><div className="timeline">
          <article><div className="timeline-date"><FaRegCalendarAlt aria-hidden="true"/><span className="role-label">CURRENT ROLE</span>AUG 2026 — PRESENT<span>Raleigh, NC</span></div><div><h3>Graduate Teaching Assistant</h3><p className="organization">NC State University · Poole College of Management</p><div className="experience-stats"><div><strong>162</strong><span>students supported</span></div><div><strong>3</strong><span>course sections</span></div><div><strong>12–15 hrs</strong><span>weekly Python & SQL support</span></div></div><ul><li>Diagnose implementation errors and explain the Python and SQL concepts behind students’ solutions.</li><li>Review programming and analytics assignments, identify recurring errors, and provide consistent, structured technical feedback.</li></ul></div></article>
          <article><div className="timeline-date"><FaRegCalendarAlt aria-hidden="true"/>OCT 2024 — APR 2025<span>Telangana, India</span></div><div><h3>Machine Learning Intern</h3><p className="organization">Indian National Centre for Ocean Information Services (INCOIS)</p><ul><li>Built an end-to-end Python regression pipeline over 100+ years of meteorological data, improving forecast model accuracy by 18%.</li><li>Automated preprocessing and extracted reusable temperature-data components, reducing processing time by 30%.</li></ul></div></article>
          <article><div className="timeline-date"><FaRegCalendarAlt aria-hidden="true"/>MAY — JUN 2024<span>Telangana, India</span></div><div><h3>Data Science Intern</h3><p className="organization">Prodigy Infotech</p><ul><li>Created 50+ visualizations of World Bank population data and explored survival patterns in the Titanic dataset.</li><li>Developed a Decision Tree classifier for the UCI Bank Marketing dataset and a social media sentiment-analysis pipeline.</li></ul></div></article>
        </div></section>
        <section id="skills" className="section"><SectionTitle label="TOOLKIT" title="What I work with." intro="Languages, tools, and practices from my projects and resume."/><div className="skills-grid">{[
          ['Languages', 'Java', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'C++', 'HTML / CSS'],
          ['Applications', 'React', 'Spring Boot', 'Spring Security', 'Node.js', 'Express', 'FastAPI'],
          ['Data & AI', 'PostgreSQL', 'Redis', 'BullMQ', 'OpenAI API', 'Pandas', 'NumPy', 'scikit-learn', 'MySQL', 'MongoDB', 'SQLite'],
          ['Cloud & delivery', 'AWS', 'Docker', 'Kubernetes', 'GitHub Actions', 'CI/CD', 'Git'],
          ['Engineering', 'System design', 'REST APIs', 'Webhooks', 'Authentication', 'Authorization', 'Concurrency', 'Idempotency', 'Agile / Scrum'],
          ['Testing', 'JUnit 5', 'MockMvc', 'Vitest', 'Supertest', 'Playwright', 'k6'],
        ].map(([title, ...skills]) => <SkillGroup key={title} title={title} skills={skills}/>)}</div></section>
        <section id="education" className="section"><SectionTitle label="EDUCATION" title="Computer science, in depth."/><div className="education-grid">
          <article className="school school-nc"><div className="degree-art"><FaGraduationCap aria-hidden="true"/><span>MASTER’S DEGREE</span></div><div><p className="eyebrow">EXPECTED MAY 2027</p><h3>North Carolina State University</h3><p>M.S. Computer Science · Raleigh, NC</p><div className="academic-score"><strong>3.72<span> / 4.0</span></strong><span>GRADUATE GPA</span></div><details className="coursework"><summary>Relevant coursework</summary><p>Design & Analysis of Algorithms · Software Engineering · DevOps · Computer Networks · Computer & Network Security · Human-Computer Interaction · Game Engine Foundations · Automated Learning & Data Analysis · Neural Networks</p></details></div></article>
          <article className="school school-vnr"><div className="degree-art"><FaGraduationCap aria-hidden="true"/><span>BACHELOR’S DEGREE</span></div><div><p className="eyebrow">DEC 2021 — MAY 2025</p><h3>VNR Vignana Jyothi Institute of Engineering and Technology</h3><p>B.Tech Computer Science – Data Science · Telangana, India</p><div className="academic-score"><strong>8.93<span> / 10.0</span></strong><span>UNDERGRADUATE GPA</span></div></div></article>
        </div></section>
        <section id="resume" className="resume-section"><div className="resume-icon" aria-hidden="true"><Icon name="download"/></div><div><p className="eyebrow">RESUME</p><h2>A closer look at my background.</h2><p>Projects, experience, and education in one PDF.</p></div><a className="button primary" href={resume} download><Icon name="download"/>Download resume</a></section>
        <section id="contact" className="section contact"><div><p className="eyebrow">CONTACT</p><h2>Let’s talk<br/><span>about what’s next.</span></h2><p>For software engineering opportunities, project conversations, or a quick introduction.</p></div><div className="contact-links"><External href={links.email} className="contact-email"><Icon name="mail"/><span>Email me<strong>saisumedhkaveti@gmail.com</strong></span></External><div className="actions"><External href={links.linkedin} className="button outline"><Icon name="linkedin"/>LinkedIn</External><External href={links.github} className="button outline"><Icon name="github"/>GitHub</External><External href={links.phone} className="phone-link"><Icon name="phone"/>+1 (984) 318-2047</External></div></div></section>
      </div>
    </main>
    <footer><div className="container footer-signature"><a href="#home" className="signature"><span className="signature-brackets" aria-hidden="true">&lt; / &gt;</span><span>Sai Sumedh Kaveti<small>Software Engineer · NC State</small></span></a><div className="footer-social"><External href={links.github} className="social-logo"><Icon name="github"/><span>GitHub</span></External><External href={links.linkedin} className="social-logo"><Icon name="linkedin"/><span>LinkedIn</span></External><External href={links.email} className="social-logo"><Icon name="mail"/><span>Email</span></External></div></div><div className="container footer-inner"><p>© {new Date().getFullYear()} Sai Sumedh Kaveti</p><span className="footer-location"><FaMapMarkerAlt aria-hidden="true"/>Raleigh, NC</span><a href="#home">Back to top</a></div></footer>
    <dialog ref={dialog} className="preview-dialog" onCancel={() => setPreview(null)} onClose={() => setPreview(null)} aria-labelledby="preview-title"><div className="preview-bar"><h2 id="preview-title">{preview?.name} · Application preview</h2><button onClick={() => setPreview(null)} autoFocus>Close</button></div>{preview && <img src={`${base}${preview.image}`} alt={preview.alt}/>}</dialog>
  </>
}
