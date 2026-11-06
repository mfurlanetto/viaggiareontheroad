import { lazy, Suspense, useState } from 'react'
import TravelBlog from './TravelBlog'

// La mappa porta con se' Leaflet e react-leaflet: viene scaricata solo
// quando serve, non nel bundle iniziale del blog.
const TravelMap = lazy(() => import('./TravelMap'))

function App() {
  const [page, setPage] = useState('blog')
  return page === 'map'
    ? (
      <Suspense fallback={<p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Caricamento mappa…</p>}>
        <TravelMap onBack={() => setPage('blog')} />
      </Suspense>
    )
    : <TravelBlog onMap={() => setPage('map')} />
}

export default App
