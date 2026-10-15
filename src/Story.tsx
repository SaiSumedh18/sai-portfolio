import { useEffect, useRef, useState } from 'react'

type Mark = 'blue' | 'gold' | 'rose' | 'lilac'
// The story, with the phrases that get a marker highlight.
const story: [string, Mark?][] = [
  ['I started in'], ['data science', 'blue'], [', digging through'], ['a century of weather data', 'gold'], ['at INCOIS. Then I got way more curious about'],
  ['the systems underneath', 'rose'], ['the models. So I moved to Raleigh, and now I build backends that'], ['stay correct', 'lilac'],
  ['when things go wrong, and I measure'], ['every millisecond', 'gold'], ['.'],
]

const words = story.flatMap(([text, mark], group) =>
  text.split(' ').filter(Boolean).map(word => ({ word, mark, group })))

export default function Story() {
  const section = useRef<HTMLElement>(null)
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [lit, setLit] = useState(reduce ? words.length : 0)

  useEffect(() => {
    if (reduce) return
    let frame = 0
    const paint = () => {
      frame = 0
      const box = section.current?.getBoundingClientRect()
      if (!box) return
      const progress = (window.innerHeight * 0.75 - box.top) / (box.height * 0.8)
      setLit(Math.round(Math.min(1, Math.max(0, progress)) * words.length))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    paint()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [reduce])

  return <section className="story" id="story" ref={section} aria-labelledby="story-title">
    <div className="wrap">
      <h2 id="story-title" className="kicker">How I got here</h2>
      <p className="story-text">
        {story.map(([, mark], group) => {
          const groupWords = words.map((w, i) => ({ ...w, i })).filter(w => w.group === group)
          const shown = groupWords.length > 0 && groupWords[0].i < lit
          const spans = groupWords.map(({ word, i }) => <span key={i} className={i < lit ? 'word is-lit' : 'word'}>{word}</span>)
          const joined = spans.flatMap((span, k) => k === 0 ? [span] : [' ', span])
          const glue = group > 0 && !story[group][0].startsWith(',') && !story[group][0].startsWith('.') ? ' ' : ''
          return <span key={group}>{glue}{mark ? <mark className={`marker marker-${mark}${shown ? ' is-lit' : ''}`}>{joined}</mark> : joined}</span>
        })}
      </p>
      <div className="story-notes">
        <p><strong>NC State grad student, btw.</strong> 3.72 GPA, graduating May 2027.</p>
        <p><strong>Teaching too.</strong> 162 students, Python and SQL, every week.</p>
      </div>
    </div>
  </section>
}
