import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
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
