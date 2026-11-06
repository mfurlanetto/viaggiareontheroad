// Pre-render delle pagine dopo `vite build`.
//
// Per ogni post pubblicato crea dist/articoli/<slug>.html con titolo, descrizione,
// canonical, Open Graph/Twitter (anteprime su WhatsApp, Facebook, Telegram...),
// dati strutturati BlogPosting e il testo dell'articolo gia' nell'HTML.
// Crea anche chi-siamo.html, privacy.html, mappa.html e rigenera sitemap.xml.
// Su Vercel `cleanUrls` serve questi file senza estensione (/articoli/<slug>).
//
// Se Supabase non risponde la build fallisce di proposito: Vercel lascia online
// il deploy precedente invece di pubblicare un sito senza articoli.
// In locale, senza variabili d'ambiente, il pre-render viene saltato.
import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "vite";

const SITE_URL = "https://viaggiareontheroad.vercel.app";
const SITE_NAME = "Viaggiare On The Road";
const SITE_DESCRIPTION = "Racconti di viaggio lenti, onesti e scritti con cura.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DIST = path.resolve("dist");

const env = loadEnv("production", process.cwd(), "VITE_");
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const clip = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
};

// Immagine per le anteprime social: le foto Unsplash vengono ritagliate a 1200x630.
function socialImage(url) {
  if (!url) return { url: DEFAULT_IMAGE, width: 1200, height: 630 };
  try {
    const u = new URL(url);
    if (u.host !== "images.unsplash.com") return { url, width: null, height: null };
    for (const [k, v] of Object.entries({ w: "1200", h: "630", fit: "crop", q: "80", fm: "jpg" })) u.searchParams.set(k, v);
    return { url: u.toString(), width: 1200, height: 630 };
  } catch {
    return { url: DEFAULT_IMAGE, width: 1200, height: 630 };
  }
}

function metaBlock({ title, description, urlPath, type = "website", image, imageAlt }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const url = SITE_URL + urlPath;
  const img = image || { url: DEFAULT_IMAGE, width: 1200, height: 630 };
  return [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img.url)}" />`,
    img.width ? `<meta property="og:image:width" content="${img.width}" />` : "",
    img.height ? `<meta property="og:image:height" content="${img.height}" />` : "",
    `<meta property="og:image:alt" content="${esc(imageAlt || fullTitle)}" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img.url)}" />`,
  ].filter(Boolean).join("\n    ");
}

function render(template, { meta, body = "", extraHead = "" }) {
  const start = "<!-- page-meta:start -->";
  const end = "<!-- page-meta:end -->";
  const i = template.indexOf(start);
  const j = template.indexOf(end);
  if (i < 0 || j < 0) throw new Error("index.html: marcatori page-meta mancanti");
  let html = template.slice(0, i + start.length) + "\n    " + meta + "\n    " + template.slice(j);
  if (extraHead) html = html.replace("</head>", `  ${extraHead}\n  </head>`);
  if (!html.includes("<!-- prerender -->")) throw new Error("index.html: marcatore prerender mancante");
  return html.replace("<!-- prerender -->", body);
}

const paragraphs = (text) => String(text ?? "")
  .split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean)
  .map(p => `<p>${esc(p)}</p>`).join("\n");

function formatMonth(d) {
  const m = /^(\d{4})-(\d{2})/.exec(d || "");
  if (!m) return "";
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1))
    .toLocaleDateString("it-IT", { month: "long", year: "numeric", timeZone: "UTC" });
}

function articlePage(template, post) {
  const title = post.title_it || post.title_en || "Articolo";
  const description = clip(post.excerpt_it || post.subtitle_it || post.body_it || SITE_DESCRIPTION, 160);
  const urlPath = `/articoli/${encodeURIComponent(post.slug)}`;
  const image = socialImage(post.image_url);
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    inLanguage: "it",
    image: image.url,
    url: SITE_URL + urlPath,
    mainEntityOfPage: SITE_URL + urlPath,
    datePublished: post.created_at,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(post.destination_it ? { contentLocation: { "@type": "Place", name: post.destination_it } } : {}),
  };
  // JSON-LD: blocco di dati, non eseguito dal browser (compatibile con la CSP).
  const ldJson = JSON.stringify(ld).replace(/</g, "\\u003c");
  const when = formatMonth(post.date);
  const body = `
    <article class="prerender">
      <p><a href="/">← Tutti i viaggi</a></p>
      ${post.image_url ? `<img src="${esc(post.image_url)}" alt="${esc(title)}" width="720" height="300" />` : ""}
      <p>${esc([post.destination_it, when, post.read_time ? `${post.read_time} min di lettura` : ""].filter(Boolean).join(" · "))}</p>
      <h1>${esc(title)}</h1>
      ${post.subtitle_it ? `<p><em>${esc(post.subtitle_it)}</em></p>` : ""}
      ${paragraphs(post.body_it || post.excerpt_it)}
    </article>`;
  return render(template, {
    meta: metaBlock({ title, description, urlPath, type: "article", image, imageAlt: title }),
    body,
    extraHead: `<script type="application/ld+json">${ldJson}</script>`,
  });
}

function homeBody(posts) {
  // Elenco di link agli articoli: utile a chi indicizza senza eseguire JavaScript.
  if (!posts.length) return "";
  const items = posts.map(p =>
    `<li><a href="/articoli/${encodeURIComponent(p.slug)}">${esc(p.title_it || p.title_en)}</a>${p.excerpt_it ? ` — ${esc(clip(p.excerpt_it, 140))}` : ""}</li>`
  ).join("\n        ");
  return `
    <main class="prerender">
      <h1>viaggiare·ontheroad</h1>
      <p>${esc(SITE_DESCRIPTION)}</p>
      <ul>
        ${items}
      </ul>
      <p><a href="/mappa">Mappa dei viaggi</a> · <a href="/chi-siamo">Chi siamo</a> · <a href="/privacy">Privacy</a></p>
    </main>`;
}

async function fetchPosts() {
  const cols = ["id", "slug", "created_at", "date", "read_time", "image_url", "destination_it",
    "title_it", "title_en", "subtitle_it", "excerpt_it", "body_it"].join(",");
  const url = `${SUPABASE_URL}/rest/v1/posts?select=${cols}&published=eq.true&order=created_at.desc`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return await res.json();
    } catch (e) {
      lastError = e;
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  throw new Error(`Supabase non raggiungibile per il pre-render: ${lastError?.message}`);
}

async function main() {
  const template = await fs.readFile(path.join(DIST, "index.html"), "utf8");
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[prerender] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY mancanti: salto il pre-render.");
    return;
  }
  const posts = (await fetchPosts()).filter(p => p.slug);
  const today = new Date().toISOString().slice(0, 10);
  const urls = [{ loc: "/", lastmod: today }];

  await fs.mkdir(path.join(DIST, "articoli"), { recursive: true });
  for (const post of posts) {
    await fs.writeFile(path.join(DIST, "articoli", `${post.slug}.html`), articlePage(template, post));
    urls.push({ loc: `/articoli/${encodeURIComponent(post.slug)}`, lastmod: (post.created_at || "").slice(0, 10) || today });
  }

  const pages = [
    { file: "chi-siamo.html", urlPath: "/chi-siamo", title: "Chi siamo",
      description: "Il progetto viaggiare·ontheroad: viaggi lenti, scrittura onesta, rispetto per i luoghi." },
    { file: "privacy.html", urlPath: "/privacy", title: "Privacy Policy",
      description: "Come viaggiare·ontheroad tratta i dati: nessun cookie di tracciamento, fornitori coinvolti, diritti GDPR." },
    { file: "mappa.html", urlPath: "/mappa", title: "Mappa dei viaggi",
      description: "Tutti i viaggi del blog su una mappa: clicca un segnaposto per leggere il racconto." },
  ];
  for (const p of pages) {
    await fs.writeFile(path.join(DIST, p.file), render(template, { meta: metaBlock(p) }));
    urls.push({ loc: p.urlPath, lastmod: today });
  }

  // Home: stessi meta del template, piu' l'elenco degli articoli per i crawler.
  await fs.writeFile(path.join(DIST, "index.html"), render(template, {
    meta: metaBlock({ title: "", description: SITE_DESCRIPTION, urlPath: "/" }),
    body: homeBody(posts),
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(SITE_URL + u.loc)}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`;
  await fs.writeFile(path.join(DIST, "sitemap.xml"), sitemap);
  console.log(`[prerender] ${posts.length} articoli, ${pages.length} pagine, sitemap con ${urls.length} URL.`);
}

main().catch((e) => {
  console.error(`[prerender] ERRORE: ${e.message}`);
  process.exit(1);
});
