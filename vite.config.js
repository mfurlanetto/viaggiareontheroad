import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { SITE_URL } from './src/config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // index.html usa %SITE_URL%: l'indirizzo del sito sta solo in src/config.js
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    },
  ],
})
