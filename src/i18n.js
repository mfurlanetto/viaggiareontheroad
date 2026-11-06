import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LANGS, DEFAULT_LANG } from './config'
import { parseRoute } from './router'
import it from './locales/it'
import en from './locales/en'
import fr from './locales/fr'
import es from './locales/es'
import de from './locales/de'

const resources = Object.fromEntries(
  Object.entries({ it, en, fr, es, de }).map(([l, translation]) => [l, { translation }])
)

// La lingua viene dall'URL (/en/..., /fr/...; senza prefisso = italiano):
// si parte gia' con quella giusta, senza un primo render nella lingua sbagliata.
const initial = typeof window !== 'undefined' ? parseRoute(window.location.pathname).lang : DEFAULT_LANG

i18n.use(initReactI18next).init({
  resources,
  lng: initial,
  fallbackLng: 'it',
  supportedLngs: LANGS,
  returnObjects: true,
  interpolation: { escapeValue: false },
})

export default i18n
