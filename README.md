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
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chiave pubblica (`sb_publishable_...`) |

Senza queste variabili l'app mostra un messaggio di configurazione mancante.
Su Vercel sono impostate per Production, Preview e Development; essendo variabili
`VITE_*`, vengono incluse nel bundle al momento della build: dopo averle cambiate
serve un nuovo deploy (non un "Redeploy" di un deploy esistente, che riusa le
variabili di allora).

## Contenuti

I post si gestiscono dalla dashboard Supabase (tabella `posts`):

- `published` e' `false` di default: un post nuovo resta bozza finche' non lo
  imposti a `true`.
- `lat` / `lng`: coordinate per la mappa. Senza coordinate il post compare nel
  blog ma non sulla mappa.
- Immagini nel bucket `post-images`: massimo 10 MB, solo JPEG, PNG, WebP, AVIF.

## Sicurezza

La chiave pubblica e' visibile nel bundle del sito: i dati sono protetti dalla
Row Level Security di Supabase. Stato verificato il 2026-11-06:

- lettura pubblica solo dei post pubblicati e delle loro immagini;
- scrittura su tabelle e bucket solo per l'utente amministratore;
- registrazioni pubbliche disattivate; chiavi JWT legacy disattivate;
- header di sicurezza (CSP e altri) in `vercel.json`.

Dettagli, migrazioni applicate e istruzioni di ripristino in
[`docs/supabase-rls.sql`](docs/supabase-rls.sql).

Il progetto Supabase free va in pausa dopo un periodo di inattivita': se il sito
non carica i post, controlla lo stato del progetto dalla dashboard.
