import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TravelBlog from './TravelBlog'
import { usePath, parseRoute } from './router'

// La mappa porta con se' Leaflet e react-leaflet: viene scaricata solo
// quando serve, non nel bundle iniziale del blog.
const TravelMap = lazy(() => import('./TravelMap'))

function App() {
  const route = parseRoute(usePath())
  const { i18n } = useTranslation()

  // La lingua segue l'URL (anche con indietro/avanti del browser).
  useEffect(() => {
    if (i18n.language !== route.lang) i18n.changeLanguage(route.lang)
    document.documentElement.lang = route.lang
  }, [route.lang, i18n])

  return route.name === 'map'
    ? (
      <Suspense fallback={<div className="loading" role="status"><div className="spinner" aria-hidden="true" /></div>}>
        <TravelMap route={route} />
      </Suspense>
    )
    : <TravelBlog route={route} />
}

export default App
