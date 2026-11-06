import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Font serviti dal nostro dominio (self-hosting), non da fonts.googleapis.com
import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-400-italic.css'
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/lato/latin-300.css'
import '@fontsource/lato/latin-400.css'
import '@fontsource/lato/latin-700.css'
import './index.css'
import './styles/base.css'
import App from './App.jsx'
import './i18n'
import { supabaseConfigError } from './supabaseClient'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {supabaseConfigError
      ? <p role="alert" style={{ padding: '2rem', fontFamily: 'sans-serif' }}>{supabaseConfigError}</p>
      : <App />}
  </StrictMode>,
)
