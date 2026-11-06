// Aggiorna titolo, descrizione e canonical quando cambia la route lato client.
// Le pagine pre-renderizzate hanno gia' i valori giusti nell'HTML: qui si
// mantengono coerenti durante la navigazione interna (e per chi indicizza
// eseguendo JavaScript).
export const SITE_URL = "https://viaggiareontheroad.vercel.app";
export const SITE_NAME = "Viaggiare On The Road";
export const SITE_DESCRIPTION = "Racconti di viaggio lenti, onesti e scritti con cura.";

function setAttr(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (el && value != null) el.setAttribute(attr, value);
}

export function setPageMeta({ title, description, path }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  document.title = fullTitle;
  const desc = description || SITE_DESCRIPTION;
  const url = SITE_URL + (path || "/");
  setAttr('meta[name="description"]', "content", desc);
  setAttr('link[rel="canonical"]', "href", url);
  setAttr('meta[property="og:title"]', "content", fullTitle);
  setAttr('meta[property="og:description"]', "content", desc);
  setAttr('meta[property="og:url"]', "content", url);
}
