import { SITE_URL, SITE_NAME, LANG_INFO } from "./config";

// Aggiorna titolo, descrizione, canonical e lingua quando cambia la route lato
// client. Le pagine pre-renderizzate hanno gia' i valori giusti nell'HTML: qui
// si mantengono coerenti durante la navigazione interna.
function setAttr(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el && value != null) el.setAttribute(attr, value);
}

export function setPageMeta({ title, description, path, lang }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  document.title = fullTitle;
  const url = SITE_URL + (path || "/");
  if (lang) {
    document.documentElement.lang = lang;
    setAttr('meta[property="og:locale"]', "content", LANG_INFO[lang]?.ogLocale);
  }
  setAttr('meta[name="description"]', "content", description);
  setAttr('link[rel="canonical"]', "href", url);
  setAttr('meta[property="og:title"]', "content", fullTitle);
  setAttr('meta[property="og:description"]', "content", description);
  setAttr('meta[property="og:url"]', "content", url);
}
