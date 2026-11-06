import { lazy, Suspense } from 'react'
import TravelBlog from './TravelBlog'
import { usePath, parseRoute } from './router'

// La mappa porta con se' Leaflet e react-leaflet: viene scaricata solo
// quando serve, non nel bundle iniziale del blog.
const TravelMap = lazy(() => import('./TravelMap'))

function App() {
  const route = parseRoute(usePath())
  return route.name === 'map'
    ? (
      <Suspense fallback={<p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Caricamento mappa…</p>}>
        <TravelMap />
      </Suspense>
    )
    : <TravelBlog route={route} />
}

export default App
