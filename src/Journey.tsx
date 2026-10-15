import { useState } from 'react'

const stops = [
  { when: '2021', place: 'VNR VJIET', title: 'Picked computer science, with a data science twist.', note: 'B.Tech in Computer Science (Data Science), Telangana.', color: '#7aa6d9' },
  { when: 'May 2024', place: 'Prodigy Infotech', title: 'First internship, first real datasets.', note: 'Visualized World Bank data, built a Decision Tree classifier and a sentiment-analysis pipeline.', color: '#9a8fd6' },
  { when: 'Oct 2024', place: 'INCOIS', title: 'A century of weather, one pipeline.', note: 'Built a Python regression pipeline over 100+ years of global meteorological data for climate forecasting.', color: '#5fb3a6' },
  { when: 'May 2025', place: 'Graduated', title: 'B.Tech done. 8.93 / 10.', note: 'Wrapped up undergrad and started looking at the systems behind the models.', color: '#e5c15a' },
  { when: '2025', place: 'NC State', title: 'Moved to Raleigh for a master’s.', note: 'M.S. Computer Science, 3.72 GPA. Built FinSight, TaskFlow, InsightChat and FORM / 65 along the way.', color: '#c8524a' },
  { when: 'Aug 2026', place: 'Teaching Assistant', title: '162 students. Lots of SQL joins.', note: 'Graduate TA for BUS 351 and BUS 458, 12–15 hours a week of Python and SQL help.', color: '#e0956b' },
  { when: 'May 2027', place: 'Next stop', title: 'New grad, ready to ship.', note: 'Looking for software engineering roles. Open to relocation. This is where you come in.', color: '#ffd84d' },
]

// Pin positions along the winding path, in the map's 1000×300 coordinate space.
const spots = [[60, 220], [200, 120], [330, 200], [480, 90], [620, 180], [770, 100], [930, 160]]
const road = 'M60 220 C 120 160 150 120 200 120 S 290 220 330 200 S 420 80 480 90 S 570 200 620 180 S 720 90 770 100 S 880 180 930 160'

export default function Journey() {
  const [active, setActive] = useState(0)
  const stop = stops[active]
  const go = (step: number) => setActive(current => Math.min(stops.length - 1, Math.max(0, current + step)))

  return <section className="journey" id="journey" aria-labelledby="journey-title">
    <div className="wrap">
      <header className="section-intro">
        <p className="kicker">The journey</p>
        <h2 id="journey-title">Data science by degree, backend by obsession.</h2>
        <p>Seven stops from Telangana to Raleigh. Tap a pin, or step through them.</p>
      </header>

      <div className="map">
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="map-road" aria-hidden="true">
          <path d={road} className="road-base"/>
          <path d={road} className="road-dash"/>
        </svg>
        <ol className="map-pins">
          {stops.map((item, i) => <li key={item.place} style={{ left: `${spots[i][0] / 10}%`, top: `${spots[i][1] / 3}%`, '--pin': item.color } as React.CSSProperties}>
            <button type="button" aria-pressed={active === i} onClick={() => setActive(i)} aria-label={`${item.when}, ${item.place}`}>
              <span className="map-pin-head"><span>{i + 1}</span></span>
              <span className="map-pin-label">{item.place}</span>
            </button>
          </li>)}
        </ol>
      </div>

      <article className="stop-card" style={{ '--pin': stop.color } as React.CSSProperties} aria-live="polite">
        <div>
          <p className="stop-when">{stop.when} · {stop.place}</p>
          <h3>{stop.title}</h3>
          <p>{stop.note}</p>
        </div>
        <div className="stop-nav">
          <button type="button" className="round" onClick={() => go(-1)} disabled={active === 0} aria-label="Previous stop">←</button>
          <span>{active + 1} / {stops.length}</span>
          <button type="button" className="round" onClick={() => go(1)} disabled={active === stops.length - 1} aria-label="Next stop">→</button>
        </div>
      </article>
    </div>
  </section>
}
