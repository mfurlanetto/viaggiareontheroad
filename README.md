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

## Contenuti: pagina /admin

Articoli, giorni e foto si gestiscono da `https://viaggiareontheroad.vercel.app/admin`
(accesso con l'account amministratore di Supabase; le registrazioni sono chiuse).

- **Articolo**: titoli e testi in italiano e inglese, continente, categoria, mese,
  posizione sulla mappa (clic sulla mappa), copertina, "in evidenza", "pubblicato".
  Un articolo nuovo e' una bozza finche' non spunti "Pubblicato".
- **Giorni**: data, luogo, posizione (per il percorso sulla mappa), titolo e testo
  it/en; si riordinano con le frecce. Eliminando un giorno le sue foto passano
  nella galleria generale.
- **Foto**: si trascinano o si scelgono piu' file insieme. Il browser le riduce a
  1600 px (piu' una miniatura da 600 px), le converte in WebP e rimuove i
  metadati EXIF, compresa la posizione GPS. Per ogni foto: didascalia e testo
  alternativo it/en, ordine, copertina del giorno, eliminazione (anche del file).
  Le foto HEIC si caricano da Safari; dagli altri browser vanno prima esportate
  in JPEG.
- **Slug**: generato dal titolo italiano; non si cambia dopo la pubblicazione,
  per non rompere i link gia' condivisi.

Dopo un salvataggio su un articolo pubblicato il sito si ricostruisce da solo in
circa 2 minuti; le modifiche alle bozze non fanno partire deploy.

L'area admin non viene indicizzata (meta robots, header `X-Robots-Tag`,
`robots.txt`) ed e' un pacchetto JavaScript separato che i visitatori non
scaricano. La sessione di accesso dell'amministratore e' salvata nel
localStorage del suo browser.

## Pagine, lingue e aggiornamento automatico

Il sito e' in italiano (senza prefisso) e inglese (`/en`). Ogni articolo ha un
URL per lingua (`/articoli/<slug>`, `/en/articoli/<slug>`) con lo stesso slug;
ci sono anche `chi-siamo`, `privacy` e `mappa` per ogni lingua. I vecchi
indirizzi `/fr`, `/es`, `/de` reindirizzano (308) alla pagina italiana; le
colonne `*_fr`, `*_es`, `*_de` restano nel database ma non vengono usate.
Ogni giorno di un viaggio ha un link diretto: `/articoli/<slug>#giorno-3`. Un articolo ha la versione in una lingua
solo se in quella lingua ha almeno titolo e testo (o estratto).

- Testi dell'interfaccia: `src/locales/<lingua>.js` (stesse chiavi in tutti i file).
- Indirizzo del sito, nome, email e lingue: `src/config.js` (unico punto da
  cambiare per un dominio personalizzato).

Dopo `vite build`, `scripts/prerender.mjs` legge i post pubblicati da Supabase
e genera un file HTML per pagina e lingua con titolo, descrizione, link
`hreflang` alle altre lingue, anteprima social (Open Graph), dati strutturati
e testo dell'articolo, piu' `sitemap.xml` (con le alternative per lingua) e
`robots.txt`. Se Supabase non risponde la build fallisce e resta online il
deploy precedente.

Quando un post pubblicato cambia (o ne viene pubblicato uno nuovo), un trigger
in Supabase segna il sito come da ricostruire; un job `pg_cron` ogni minuto, se
l'ultima modifica ha piu' di 45 secondi, chiama il Deploy Hook di Vercel. Il sito
si aggiorna in circa due minuti. L'URL del Deploy Hook e' salvato nel Vault di
Supabase (segreto `vercel_deploy_hook`), non nel repository. Stato e ultimo
invio: `select * from private.site_rebuild;` nel SQL editor.

Configurazione (una sola volta):

1. Vercel > progetto > Settings > Git > Deploy Hooks: nome `supabase`, branch
   `master`, crea e copia l'URL.
2. Supabase > SQL Editor:
   `select vault.create_secret('<URL del deploy hook>', 'vercel_deploy_hook');`

## Sicurezza

La chiave pubblica e' visibile nel bundle del sito: i dati sono protetti dalla
Row Level Security di Supabase. Stato verificato il 2026-11-06:

- lettura pubblica solo dei post pubblicati e delle loro immagini;
- scrittura su tabelle e bucket solo per l'utente amministratore;
- registrazioni pubbliche disattivate; chiavi JWT legacy disattivate;
- header di sicurezza (CSP e altri) in `vercel.json`.

## Accessibilita'

Obiettivo WCAG 2.1 AA, verificato con axe-core su home, articolo, Chi siamo,
Privacy e Mappa in tema chiaro e scuro (0 violazioni al 2026-11-06):
link e bottoni veri (navigabili da tastiera), "Vai al contenuto", menu mobile
`inert` quando chiuso, finestra dell'articolo con focus gestito ed Esc,
carosello che si ferma al focus e con "riduci movimento", contrasti AA,
attributo `lang` della pagina aggiornato con la lingua.

Dettagli, migrazioni applicate e istruzioni di ripristino in
[`docs/supabase-rls.sql`](docs/supabase-rls.sql).

Il progetto Supabase free va in pausa dopo un periodo di inattivita': se il sito
non carica i post, controlla lo stato del progetto dalla dashboard.
