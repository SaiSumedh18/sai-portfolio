// Sai Sumedh Kaveti's monogram: a bold "SK" optically centred in a yellow disc.
export default function Mark({ size = 48, title }: { size?: number; title?: string }) {
  return <svg className="mark" width={size} height={size} viewBox="0 0 48 48" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    <circle cx="24" cy="24" r="24" fill="#ffd84d"/>
    <circle cx="24" cy="24" r="21.25" fill="none" stroke="#1c1b1a" strokeOpacity="0.14" strokeWidth="1"/>
    <text x="24.4" y="24.6" textAnchor="middle" dominantBaseline="central" fill="#1c1b1a"
      fontFamily="'Bricolage Grotesque Variable', 'Arial Black', system-ui, sans-serif" fontWeight="800" fontSize="19.5" letterSpacing="-0.6">SK</text>
  </svg>
}
