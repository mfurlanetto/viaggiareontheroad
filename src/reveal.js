import { useEffect } from "react";
import { prefersReducedMotion } from "./motion";

// Comparsa allo scorrimento: gli elementi con classe "reveal" entrano con una
// breve dissolvenza quando arrivano nella finestra. Un solo IntersectionObserver
// condiviso; ogni elemento viene osservato una volta sola.
// Senza IntersectionObserver o con "riduci movimento" gli elementi sono subito visibili.
let observer = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("is-visible");
      observer.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  return observer;
}

export function revealAll(root = document) {
  const items = root.querySelectorAll(".reveal:not(.is-visible)");
  if (!items.length) return;
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const io = getObserver();
  items.forEach(el => io.observe(el));
}

// Ricontrolla i nuovi elementi "reveal" quando cambiano le dipendenze
// (pagina, filtri, articolo aperto...).
export function useReveal(deps) {
  useEffect(() => {
    const id = requestAnimationFrame(() => revealAll());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
