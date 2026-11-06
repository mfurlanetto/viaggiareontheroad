import { useSyncExternalStore } from "react";
import { LANGS, DEFAULT_LANG } from "./config";

// Router minimale basato sulla History API, senza dipendenze esterne.
// URL: [/<lingua>]/, /articoli/<slug>, /chi-siamo, /privacy, /mappa.
// L'italiano non ha prefisso; l'inglese usa /en.
// Le stesse route sono pre-renderizzate alla build (scripts/prerender.mjs).

const prefix = (lang) => (lang === DEFAULT_LANG ? "" : `/${lang}`);

export const pathFor = {
  home: (lang) => prefix(lang) || "/",
  article: (lang, slug) => `${prefix(lang)}/articoli/${encodeURIComponent(slug)}`,
  about: (lang) => `${prefix(lang)}/chi-siamo`,
  privacy: (lang) => `${prefix(lang)}/privacy`,
  map: (lang) => `${prefix(lang)}/mappa`,
};

// Identificativo dell'articolo nell'URL: lo slug (sempre presente nel DB),
// con l'id come ripiego per dati senza slug.
export const postKey = (post) => post.slug || String(post.id);

export function parseRoute(pathname) {
  let p = pathname.replace(/\/+$/, "") || "/";
  let lang = DEFAULT_LANG;
  const m0 = p.match(/^\/([a-z]{2})(?=\/|$)/);
  if (m0 && LANGS.includes(m0[1]) && m0[1] !== DEFAULT_LANG) {
    lang = m0[1];
    p = p.slice(3) || "/";
  }
  if (p === "/") return { lang, name: "home" };
  if (p === "/chi-siamo") return { lang, name: "about" };
  if (p === "/privacy") return { lang, name: "privacy" };
  if (p === "/mappa") return { lang, name: "map" };
  const m = p.match(/^\/articoli\/([^/]+)$/);
  if (m) return { lang, name: "article", slug: decodeURIComponent(m[1]) };
  return { lang, name: "notfound" };
}

// URL della stessa pagina in un'altra lingua (per il selettore lingua).
export function routeIn(route, lang) {
  switch (route.name) {
    case "article": return pathFor.article(lang, route.slug);
    case "about": return pathFor.about(lang);
    case "privacy": return pathFor.privacy(lang);
    case "map": return pathFor.map(lang);
    default: return pathFor.home(lang);
  }
}

const EVENT = "app:navigate";
const subscribe = (cb) => {
  window.addEventListener("popstate", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVENT, cb);
  };
};
const getPath = () => window.location.pathname;

export function usePath() {
  return useSyncExternalStore(subscribe, getPath);
}

// state.inApp = true: la pagina precedente e' dell'app, quindi "indietro" e'
// sicuro (es. chiudere un articolo con history.back() conserva lo scroll).
export function navigateTo(path, { replace = false, state = {} } = {}) {
  const full = { ...state, inApp: true };
  if (replace || path === window.location.pathname) window.history.replaceState(full, "", path);
  else window.history.pushState(full, "", path);
  window.dispatchEvent(new Event(EVENT));
}

export const cameFromApp = () => !!window.history.state?.inApp;

// <a> vero (accessibile da tastiera, apribile in una nuova scheda) che naviga
// senza ricaricare la pagina per i clic normali.
export function linkProps(path, onNavigate) {
  return {
    href: path,
    onClick: (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation(); // es. link dentro una card che e' a sua volta cliccabile
      if (onNavigate) onNavigate(); else navigateTo(path);
    },
  };
}
