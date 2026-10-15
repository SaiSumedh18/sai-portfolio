import { useEffect, useRef, useState } from 'react'

// A dusk scene of the places so far: the INCOIS lighthouse, VNR, the road, and the
// NC State belltower. Layers drift at different speeds as you scroll.
const stars = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 137.5) % 1440,
  y: ((i * 89) % 360) + 12,
  r: i % 7 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : 0.8,
}))

const pins = [
  { x: 1200, y: 520, label: 'INCOIS', year: '2025', href: '#journey' },
  { x: 716, y: 600, label: 'VNR', year: '2025', href: '#journey' },
  { x: 1000, y: 392, label: 'NC State', year: 'Now', href: '#journey' },
]

function Pin({ x, y, label, year, href }: typeof pins[number]) {
  const width = 40 + label.length * 9.5 + year.length * 8.5
  return <a href={href} className="pin" aria-label={`${label}, ${year}`}>
    <g transform={`translate(${x} ${y})`}>
      <rect x={-width / 2} y={-46} width={width} height={32} rx={16} className="pin-chip"/>
      <text x={-width / 2 + 16} y={-25} className="pin-label">{label}<tspan className="pin-year" dx={8}>{year}</tspan></text>
      <line x1={0} y1={-14} x2={0} y2={-2} className="pin-stem"/>
      <circle r={6} className="pin-dot"/>
      <circle r={12} className="pin-pulse"/>
    </g>
  </a>
}

export default function Hero() {
  const scene = useRef<SVGSVGElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  // On phones, re-centre the scene on the belltower instead of the middle of the valley.
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)')
    const update = () => setNarrow(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const paint = () => {
      frame = 0
      const y = Math.min(window.scrollY, window.innerHeight)
      scene.current?.querySelectorAll<SVGGElement>('[data-depth]').forEach(layer => {
        layer.style.transform = `translateY(${y * Number(layer.dataset.depth)}px)`
      })
      if (copy.current) {
        copy.current.style.transform = `translateY(${y * -0.25}px)`
        copy.current.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.6)))
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint) }
    window.addEventListener('scroll', schedule, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule) }
  }, [])

  return <section className="hero" id="top" aria-labelledby="hero-title">
    <svg ref={scene} className="scene" viewBox={`${narrow ? 140 : 0} 0 1440 900`} preserveAspectRatio="xMidYMax slice" role="img" aria-label="Illustrated dusk valley with a lighthouse, a college, a winding road and the NC State belltower">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141c33"/>
          <stop offset=".42" stopColor="#2c3a66"/>
          <stop offset=".64" stopColor="#7e5d86"/>
          <stop offset=".8" stopColor="#d98f72"/>
          <stop offset="1" stopColor="#f4c58c"/>
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c98a7c"/>
          <stop offset="1" stopColor="#4a4a75"/>
        </linearGradient>
        <linearGradient id="beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#ffe8a8" stopOpacity=".55"/>
          <stop offset="1" stopColor="#ffe8a8" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stopColor="#fff3dc" stopOpacity=".35"/>
          <stop offset="1" stopColor="#fff3dc" stopOpacity="0"/>
        </radialGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)"/>
      <g data-depth="0.5">
        {stars.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#fff6e6" opacity={0.35 + (i % 5) * 0.12} className={i % 4 === 0 ? 'twinkle' : undefined}/>)}
        <circle cx="1180" cy="170" r="110" fill="url(#moonGlow)"/>
        <circle cx="1180" cy="170" r="38" fill="#fbefd9"/>
        <circle cx="1166" cy="160" r="7" fill="#efdcbc"/>
        <circle cx="1192" cy="184" r="5" fill="#efdcbc"/>
      </g>

      <g data-depth="0.35">
        {/* Raleigh skyline on the horizon */}
        <g transform="translate(-240 0)">
        <g fill="#4b4670">
          <rect x="1000" y="548" width="34" height="80"/><rect x="1040" y="520" width="28" height="110"/>
          <rect x="1072" y="560" width="40" height="70"/><rect x="1116" y="500" width="30" height="130"/><polygon points="1116,500 1131,478 1146,500"/>
          <rect x="1150" y="570" width="44" height="60"/><rect x="1198" y="540" width="26" height="90"/>
        </g>
        <g fill="#ffd27a" opacity=".7">
          {[[1046, 534], [1056, 552], [1122, 516], [1134, 540], [1122, 566], [1204, 556], [1084, 576], [1010, 566]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="5" height="7"/>)}
        </g>
        </g>
        <path d="M0 640 C 200 560 380 604 560 612 S 900 566 1100 592 S 1350 604 1440 572 V900 H0Z" fill="#3a3c66"/>
      </g>

      <g data-depth="0.22">
        {/* The sea and the INCOIS lighthouse */}
        <path d="M1440 646 H880 C 920 676 980 700 1080 712 H1440Z" fill="url(#sea)"/>
        <g stroke="#f3c7a3" strokeWidth="2" strokeLinecap="round" opacity=".45">
          <line x1="1300" y1="668" x2="1370" y2="668"/><line x1="1150" y1="684" x2="1200" y2="684"/><line x1="980" y1="662" x2="1060" y2="662"/><line x1="1290" y1="700" x2="1350" y2="700"/>
        </g>
        <g transform="translate(900 0)">
        <polygon points="300,540 80,500 80,580" fill="url(#beam)" className="beam"/>
        <polygon points="286,650 314,650 307,548 293,548" fill="#f2ebe0"/>
        <polygon points="289,622 311,622 309.5,600 290.5,600" fill="#c8524a"/>
        <polygon points="292,582 308,582 307,566 293,566" fill="#c8524a"/>
        <rect x="290" y="534" width="20" height="14" fill="#ffd36e"/>
        <polygon points="286,534 314,534 300,516" fill="#2a2f52"/>
        <rect x="270" y="646" width="60" height="10" rx="3" fill="#2a2f52"/>
        </g>
      </g>

      <g data-depth="0.12">
        <path d="M0 744 C 180 664 400 690 560 700 C 720 710 820 640 1000 650 C 1180 660 1300 700 1440 680 V900 H0Z" fill="#2b2e53"/>
        {/* VNR campus */}
        <g transform="translate(150 0)">
          <rect x="500" y="628" width="132" height="72" fill="#4f4166"/>
          <polygon points="494,630 566,596 638,630" fill="#3a2f52"/>
          <rect x="550" y="652" width="32" height="48" fill="#3a2f52"/>
          {[512, 528, 594, 610].map(x => [642, 670].map(y => <rect key={`${x}-${y}`} x={x} y={y} width="10" height="14" rx="2" fill="#ffd27a" opacity=".85"/>))}
        </g>
        {/* NC State Memorial Belltower */}
        <g transform="translate(100 0)">
          <polygon points="876,654 924,654 917,486 883,486" fill="#7a4045"/>
          <polygon points="876,654 888,654 886,486 883,486" fill="#5e3036"/>
          <rect x="881" y="452" width="38" height="36" fill="#8a4a4e"/>
          <path d="M893 486 V466 a7 7 0 0 1 14 0 V486Z" fill="#ffd27a"/>
          <polygon points="881,452 900,404 919,452" fill="#6b3a40"/>
          <polygon points="877,456 881,436 885,456" fill="#6b3a40"/><polygon points="915,456 919,436 923,456" fill="#6b3a40"/>
          {[520, 560, 600].map(y => <rect key={y} x="896" y={y} width="8" height="18" rx="4" fill="#ffd27a" opacity=".75"/>)}
          <rect x="866" y="650" width="68" height="10" rx="2" fill="#4d2a30"/>
        </g>
      </g>

      <g data-depth="0.04">
        {/* The road from here to there */}
        <g transform="translate(100 0)">
        <path d="M600 900 C 700 820 840 812 800 760 C 768 716 880 700 900 660" fill="none" stroke="#d9c3a2" strokeWidth="30" strokeLinecap="round"/>
        <path d="M600 900 C 700 820 840 812 800 760 C 768 716 880 700 900 660" fill="none" stroke="#f7ecd8" strokeWidth="2.5" strokeDasharray="12 14" strokeLinecap="round"/>
        </g>
        <path d="M0 822 C 200 772 380 800 520 832 C 600 852 650 870 690 900 H0Z" fill="#171b33"/>
        <path d="M1440 800 C 1240 762 1050 822 920 860 C 880 874 860 890 850 900 H1440Z" fill="#171b33"/>
        <g fill="#1f2645">
          {[[90, 800], [150, 790], [420, 812], [1120, 800], [1210, 790], [1330, 786]].map(([x, y]) => <g key={x}><circle cx={x} cy={y - 34} r="26"/><circle cx={x + 18} cy={y - 22} r="20"/><rect x={x - 2} y={y - 12} width="5" height="16" fill="#141830"/></g>)}
        </g>
      </g>

      <g data-depth="0.12">{pins.map(pin => <Pin key={pin.label} {...pin}/>)}</g>
      <a href="#story" className="pin pin-me" aria-label="That's me: read the story">
        <g transform="translate(892 770)">
          <rect x="-58" y="-60" width="116" height="36" rx="18" className="pin-chip"/>
          <circle cx="-38" cy="-42" r="12" fill="#ffd84d"/>
          <text x="-38" y="-37.5" textAnchor="middle" className="pin-mono">sk</text>
          <text x="-20" y="-37" className="pin-label">That’s me</text>
          <line x1="0" y1="-24" x2="0" y2="-6" className="pin-stem"/>
          <circle r="7" className="pin-dot"/>
          <circle r="14" className="pin-pulse"/>
        </g>
      </a>
    </svg>

    <div className="hero-copy wrap" ref={copy}>
      <p className="hero-hey"><span className="wave" aria-hidden="true">👋</span> hey, I’m Sai</p>
      <h1 id="hero-title">Building apps that don’t <span className="scribble">fall over.</span></h1>
      <p className="hero-sub">Software engineer. Data science grad who got hooked on what’s underneath.</p>
    </div>
  </section>
}
