import { useEffect, useRef, useState } from 'react'

type Mark = 'blue' | 'gold' | 'rose' | 'lilac'
type Ink = 'circle' | 'underline'
// The story, with the phrases that get a marker highlight or a hand-drawn ink mark.
const story: [string, Mark?, Ink?][] = [
  ['I fell for'], ['data science', 'blue'], ['first:'], ['a century of weather data', 'gold'], ['at INCOIS, and the thrill of a forecast that holds up. Building those pipelines pulled me into'],
  ['the systems underneath', 'rose'], ['them. Now I'], ['love both', undefined, 'circle'], ['. I build backends that'], ['stay correct', 'lilac'],
  ['when things go wrong, and I still measure every millisecond. Next stop:'], ['a software engineering role', undefined, 'underline'], ['where data meets dependable systems.'],
]

const words = story.flatMap(([text], group) => text.split(' ').filter(Boolean).map(word => ({ word, group })))

const notes = [
  { title: 'M.S. CS at NC State.', detail: '3.72 GPA, class of 2027', tone: 'yellow', tilt: -3, speed: -18 },
  { title: 'Graduate TA, 162 students.', detail: 'Python and SQL, every week', tone: 'blue', tilt: 2.5, speed: 10 },
  { title: 'Open to SWE roles.', detail: 'From May 2027, open to relocation', tone: 'green', tilt: -1.5, speed: -8 },
]

// Hand-drawn strokes, sized to the phrase they mark (viewBox is stretched to fit).
function InkStroke({ kind }: { kind: Ink }) {
  return kind === 'circle'
    ? <svg className="ink ink-circle" viewBox="0 0 200 70" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M168 10 C 120 -2 30 2 10 26 C -6 48 50 66 112 64 C 178 62 206 40 188 20 C 176 8 140 4 118 6"/></svg>
    : <svg className="ink ink-underline" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 12 C 70 4 150 6 220 9 C 250 10 276 12 296 8"/></svg>
}

export default function Story() {
  const section = useRef<HTMLElement>(null)
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [lit, setLit] = useState(reduce ? words.length : 0)
  const [drift, setDrift] = useState(0)

  useEffect(() => {
    if (reduce) return
    let frame = 0
    const paint = () => {
      frame = 0
      const box = section.current?.getBoundingClientRect()
      if (!box) return
      const progress = (window.innerHeight * 0.75 - box.top) / (box.height * 0.8)
      setLit(Math.round(Math.min(1, Math.max(0, progress)) * words.length))
      setDrift(Math.min(1.2, Math.max(-0.2, progress)))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    paint()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [reduce])

  let index = 0
  return <section className="story" id="story" ref={section} aria-labelledby="story-title">
    <div className="wrap story-grid">
      <div>
        <h2 id="story-title" className="kicker">How I got here</h2>
        <p className="story-text">
          {story.map(([text, mark, ink], group) => {
            const first = index
            const spans = text.split(' ').filter(Boolean).map(word => { const i = index++; return <span key={i} className={i < lit ? 'word is-lit' : 'word'}>{word}</span> })
            const joined = spans.flatMap((span, k) => k === 0 ? [span] : [' ', span])
            const shown = first < lit
            const glue = group > 0 && !/^[.,:]/.test(text) ? ' ' : ''
            if (mark) return <span key={group}>{glue}<mark className={`marker marker-${mark}${shown ? ' is-lit' : ''}`}>{joined}</mark></span>
            if (ink) return <span key={group}>{glue}<span className={`inked${shown ? ' is-lit' : ''}`}>{joined}<InkStroke kind={ink}/></span></span>
            return <span key={group}>{glue}{joined}</span>
          })}
        </p>
      </div>

      <ul className="notes" aria-label="Quick facts">
        {notes.map((note, i) => <li key={note.title} className={`note note-${note.tone}${lit > 4 ? ' is-in' : ''}`}
          style={{ '--tilt': `${note.tilt}deg`, '--drift': `${(drift - 0.5) * note.speed}px`, '--delay': `${i * 120}ms` } as React.CSSProperties}>
          <span className="note-tape" aria-hidden="true"/>
          <strong>{note.title}</strong>
          <span>{note.detail}</span>
        </li>)}
      </ul>
    </div>
  </section>
}
