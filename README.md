# viaggiare·ontheroad

Blog di viaggio: React 19 + Vite 7, contenuti su Supabase, mappa con Leaflet, 5 lingue (it, en, fr, es, de).

## Avvio

```bash
npm install
cp .env.example .env   # poi compila i valori
npm run dev
```

Script: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.

## Variabili d'ambiente

| Variabile | Descrizione |
|---|---|
| `VITE_SUPABASE_URL` | URL del progetto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chiave pubblica (publishable key) |
| `VITE_SUPABASE_ANON_KEY` | Vecchia chiave anon, accettata come alternativa |

Senza queste variabili l'app mostra un messaggio di configurazione mancante.

## Sicurezza dei dati

La chiave pubblica e' visibile nel bundle del sito: i dati sono protetti solo dalla
Row Level Security di Supabase. Le policy proposte per `posts` e `post_images` sono in
[`docs/supabase-rls.sql`](docs/supabase-rls.sql) (da rivedere prima dell'esecuzione).
Il progetto Supabase free va in pausa dopo un periodo di inattivita': se il sito
non carica i post, controlla lo stato del progetto dalla dashboard.
