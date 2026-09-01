import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import PrivacyPolicy from '../src/pages/legal/PrivacyPolicy'
import TermsOfUse from '../src/pages/legal/TermsOfUse'

const pages = {
  '/privacy': PrivacyPolicy,
  '/terms': TermsOfUse,
} as const

export function renderLegalPage(path: keyof typeof pages): string {
  const Page = pages[path]
  return renderToStaticMarkup(
    <StaticRouter location={path}>
      <Page />
    </StaticRouter>,
  )
}
