import { useSyncExternalStore } from "react";

// Router minimale basato sulla History API: URL veri (/articoli/<slug>, /mappa, ...)
// senza dipendenze esterne. Le stesse route sono pre-renderizzate alla build
// (scripts/prerender.mjs), quindi ogni URL esiste anche come file HTML.
export const paths = {
  home: "/",
  article: (slug) => `/articoli/${encodeURIComponent(slug)}`,
  about: "/chi-siamo",
  privacy: "/privacy",
  map: "/mappa",
};

// Identificativo dell'articolo nell'URL: lo slug (sempre presente nel DB),
// con l'id come ripiego per dati senza slug.
export const postKey = (post) => post.slug || String(post.id);

export function parseRoute(pathname) {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return { name: "home" };
  if (p === paths.about) return { name: "about" };
  if (p === paths.privacy) return { name: "privacy" };
  if (p === paths.map) return { name: "map" };
  const m = p.match(/^\/articoli\/([^/]+)$/);
  if (m) return { name: "article", slug: decodeURIComponent(m[1]) };
  return { name: "notfound" };
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
