import { FaGithub, FaLinkedinIn, FaFilePdf } from 'react-icons/fa'

// The real app logos, drawn as small glossy app tiles for the contact cards.
function Gmail() {
  return <svg viewBox="52 42 88 66" aria-hidden="true">
    <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"/>
    <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"/>
    <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"/>
    <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92"/>
    <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"/>
  </svg>
}

export type App = 'gmail' | 'linkedin' | 'github' | 'pdf'

const icons: Record<App, () => React.ReactElement> = {
  gmail: () => <Gmail/>,
  linkedin: () => <FaLinkedinIn aria-hidden="true"/>,
  github: () => <FaGithub aria-hidden="true"/>,
  pdf: () => <FaFilePdf aria-hidden="true"/>,
}

export default function AppIcon({ app }: { app: App }) {
  const Icon = icons[app]
  return <span className={`app-icon app-${app}`}><Icon/></span>
}
