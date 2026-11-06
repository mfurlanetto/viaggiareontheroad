// Pre-render delle pagine dopo `vite build`, in tutte le lingue.
//
// Per ogni lingua (italiano senza prefisso, inglese con /en) genera:
// - articoli/<slug>.html per ogni post pubblicato con testo in quella lingua,
//   con title, description, canonical, hreflang, Open Graph/Twitter, JSON-LD
//   BlogPosting e il testo dell'articolo gia' nell'HTML;
// - la home (index.html / en.html ...), con l'elenco dei link agli articoli;
// - chi-siamo, privacy, mappa con meta tradotti.
// Poi sitemap.xml (con le alternative per lingua) e robots.txt.
// Su Vercel `cleanUrls` serve questi file senza estensione.
//
// Se Supabase non risponde la build fallisce di proposito: Vercel lascia online
// il deploy precedente invece di pubblicare un sito senza articoli.
// In locale, senza variabili d'ambiente, il pre-render viene saltato.
import fs from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "vite";
import { SITE_URL, SITE_NAME, LANGS, DEFAULT_LANG, LANG_INFO } from "../src/config.js";
import it from "../src/locales/it.js";
import en from "../src/locales/en.js";

const T = { it, en };
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DIST = path.resolve("dist");

const env = loadEnv("production", process.cwd(), "VITE_");
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ── percorsi (stesse regole di src/router.js) ──
const prefix = (lang) => (lang === DEFAULT_LANG ? "" : `/${lang}`);
const route = {
  home: (l) => prefix(l) || "/",
  article: (l, slug) => `${prefix(l)}/articoli/${encodeURIComponent(slug)}`,
  about: (l) => `${prefix(l)}/chi-siamo`,
  privacy: (l) => `${prefix(l)}/privacy`,
  map: (l) => `${prefix(l)}/mappa`,
};
// file servito per ogni percorso (cleanUrls: /en -> en.html, /en/mappa -> en/mappa.html)
const fileFor = (urlPath) => (urlPath === "/" ? "index.html" : `${urlPath.slice(1)}.html`);

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

// alternates: { it: "/articoli/x", en: "/en/articoli/x", ... } (solo le lingue esistenti)
function metaBlock({ lang, title, description, urlPath, type = "website", image, imageAlt, alternates }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  const url = SITE_URL + urlPath;
  const img = image || { url: DEFAULT_IMAGE, width: 1200, height: 630 };
  const alt = Object.entries(alternates || {});
  return [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    ...alt.map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${esc(SITE_URL + p)}" />`),
    alternates?.[DEFAULT_LANG] ? `<link rel="alternate" hreflang="x-default" href="${esc(SITE_URL + alternates[DEFAULT_LANG])}" />` : "",
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:locale" content="${LANG_INFO[lang].ogLocale}" />`,
    ...alt.filter(([l]) => l !== lang).map(([l]) => `<meta property="og:locale:alternate" content="${LANG_INFO[l].ogLocale}" />`),
    `<meta property="og:image" content="${esc(img.url)}" />`,
    img.width ? `<meta property="og:image:width" content="${img.width}" />` : "",
    img.height ? `<meta property="og:image:height" content="${img.height}" />` : "",
    `<meta property="og:image:alt" content="${esc(imageAlt || fullTitle)}" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img.url)}" />`,
  ].filter(Boolean).join("\n    ");
}

function render(template, { lang, meta, body = "", extraHead = "" }) {
  const start = "<!-- page-meta:start -->";
  const end = "<!-- page-meta:end -->";
  const i = template.indexOf(start);
  const j = template.indexOf(end);
  if (i < 0 || j < 0) throw new Error("index.html: marcatori page-meta mancanti");
  let html = template.slice(0, i + start.length) + "\n    " + meta + "\n    " + template.slice(j);
  html = html.replace(/<html lang="[a-z]+">/, `<html lang="${lang}">`);
  if (extraHead) html = html.replace("</head>", `  ${extraHead}\n  </head>`);
  if (!html.includes("<!-- prerender -->")) throw new Error("index.html: marcatore prerender mancante");
  return html.replace("<!-- prerender -->", body);
}

const paragraphs = (text) => String(text ?? "")
  .split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean)
  .map(p => `<p>${esc(p)}</p>`).join("\n");

function formatMonth(d, lang) {
  const m = /^(\d{4})-(\d{2})/.exec(d || "");
  if (!m) return "";
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1))
    .toLocaleDateString(LANG_INFO[lang].dateLocale, { month: "long", year: "numeric", timeZone: "UTC" });
}

// Un articolo esiste in una lingua se ha almeno titolo e testo in quella lingua.
const hasLang = (post, l) => !!(post[`title_${l}`] && (post[`body_${l}`] || post[`excerpt_${l}`]));
const field = (post, name, l) => post[`${name}_${l}`] || "";

function articlePage(template, post, lang) {
  const t = T[lang];
  const title = field(post, "title", lang);
  const description = clip(field(post, "excerpt", lang) || field(post, "subtitle", lang) || field(post, "body", lang) || t.meta.siteDescription, 160);
  const urlPath = route.article(lang, post.slug);
  const image = socialImage(post.image_url);
  const alternates = Object.fromEntries(LANGS.filter(l => hasLang(post, l)).map(l => [l, route.article(l, post.slug)]));
  const destination = field(post, "destination", lang);
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    inLanguage: lang,
    image: image.url,
    url: SITE_URL + urlPath,
    mainEntityOfPage: SITE_URL + urlPath,
    datePublished: post.created_at,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(destination ? { contentLocation: { "@type": "Place", name: destination } } : {}),
  };
  // JSON-LD: blocco di dati, non eseguito dal browser (compatibile con la CSP).
  const ldJson = JSON.stringify(ld).replace(/</g, "\\u003c");
  const metaLine = [destination, formatMonth(post.date, lang), post.read_time ? `${post.read_time} ${t.hero.readTime}` : ""].filter(Boolean).join(" · ");
  const body = `
    <article class="prerender">
      <p><a href="${route.home(lang)}">← ${esc(t.footer.allTrips)}</a></p>
      ${post.image_url ? `<img src="${esc(post.image_url)}" alt="" width="720" height="300" />` : ""}
      <p>${esc(metaLine)}</p>
      <h1>${esc(title)}</h1>
      ${field(post, "subtitle", lang) ? `<p><em>${esc(field(post, "subtitle", lang))}</em></p>` : ""}
      ${paragraphs(field(post, "body", lang) || field(post, "excerpt", lang))}
    </article>`;
  return render(template, {
    lang,
    meta: metaBlock({ lang, title, description, urlPath, type: "article", image, imageAlt: title, alternates }),
    body,
    extraHead: `<script type="application/ld+json">${ldJson}</script>`,
  });
}

function homeBody(posts, lang) {
  // Elenco di link agli articoli: utile a chi indicizza senza eseguire JavaScript.
  const t = T[lang];
  const items = posts.filter(p => hasLang(p, lang)).map(p => {
    const ex = field(p, "excerpt", lang);
    return `<li><a href="${route.article(lang, p.slug)}">${esc(field(p, "title", lang))}</a>${ex ? ` — ${esc(clip(ex, 140))}` : ""}</li>`;
  }).join("\n        ");
  return `
    <main class="prerender">
      <h1>${esc(t.home.heading)}</h1>
      <p>${esc(t.meta.siteDescription)}</p>
      <ul>
        ${items}
      </ul>
      <p><a href="${route.map(lang)}">${esc(t.meta.mapTitle)}</a> · <a href="${route.about(lang)}">${esc(t.meta.aboutTitle)}</a> · <a href="${route.privacy(lang)}">${esc(t.meta.privacyTitle)}</a></p>
    </main>`;
}

async function fetchPosts() {
  const perLang = ["title", "subtitle", "excerpt", "body", "destination"].flatMap(f => LANGS.map(l => `${f}_${l}`));
  const cols = ["id", "slug", "created_at", "date", "read_time", "image_url", ...perLang].join(",");
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

async function write(urlPath, html) {
  const file = path.join(DIST, fileFor(urlPath));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
}

async function main() {
  const template = await fs.readFile(path.join(DIST, "index.html"), "utf8");
  await fs.writeFile(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[prerender] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY mancanti: salto il pre-render.");
    return;
  }
  const posts = (await fetchPosts()).filter(p => p.slug);
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = []; // { loc, lastmod, alternates }
  const allLangs = (fn) => Object.fromEntries(LANGS.map(l => [l, fn(l)]));
  let articleCount = 0;

  for (const lang of LANGS) {
    const t = T[lang];

    for (const post of posts.filter(p => hasLang(p, lang))) {
      const urlPath = route.article(lang, post.slug);
      await write(urlPath, articlePage(template, post, lang));
      sitemap.push({
        loc: urlPath,
        lastmod: (post.created_at || "").slice(0, 10) || today,
        alternates: Object.fromEntries(LANGS.filter(l => hasLang(post, l)).map(l => [l, route.article(l, post.slug)])),
      });
      articleCount++;
    }

    const pages = [
      { key: "home", title: "", description: t.meta.siteDescription, body: homeBody(posts, lang) },
      { key: "about", title: t.meta.aboutTitle, description: t.meta.aboutDescription },
      { key: "privacy", title: t.meta.privacyTitle, description: t.meta.privacyDescription },
      { key: "map", title: t.meta.mapTitle, description: t.meta.mapDescription },
    ];
    for (const p of pages) {
      const urlPath = route[p.key](lang);
      const alternates = allLangs(l => route[p.key](l));
      await write(urlPath, render(template, {
        lang,
        meta: metaBlock({ lang, title: p.title, description: p.description, urlPath, alternates }),
        body: p.body || "",
      }));
      sitemap.push({ loc: urlPath, lastmod: today, alternates });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap.map(u => `  <url>
    <loc>${esc(SITE_URL + u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
${Object.entries(u.alternates).map(([l, p]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(SITE_URL + p)}" />`).join("\n")}
  </url>`).join("\n")}
</urlset>
`;
  await fs.writeFile(path.join(DIST, "sitemap.xml"), xml);
  console.log(`[prerender] ${posts.length} articoli × lingue = ${articleCount} pagine articolo, ${LANGS.length * 4} pagine fisse, sitemap con ${sitemap.length} URL.`);
}

main().catch((e) => {
  console.error(`[prerender] ERRORE: ${e.message}`);
  process.exit(1);
});
