import { useState } from 'react'
import TravelBlog from './TravelBlog'
import TravelMap from './TravelMap'

function App() {
  const [page, setPage] = useState('blog')
  return page === 'map'
    ? <TravelMap onBack={() => setPage('blog')} />
    : <TravelBlog onMap={() => setPage('map')} />
}

export default App