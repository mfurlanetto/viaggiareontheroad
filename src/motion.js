import { flushSync } from "react-dom";

// Animazioni: sempre disattivate con "riduci movimento" (impostazione di sistema).
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const supportsViewTransitions = () =>
  typeof document !== "undefined" && typeof document.startViewTransition === "function";

// Esegue un aggiornamento dello stato dentro una View Transition del browser
// (dissolvenza/morph tra il prima e il dopo). Dove l'API non esiste o con
// "riduci movimento" l'aggiornamento avviene subito, senza animazione.
// prepare() gira prima della cattura dello stato iniziale, cleanup() alla fine.
export function withViewTransition(update, { prepare, cleanup, kind } = {}) {
  if (!supportsViewTransitions() || prefersReducedMotion()) {
    update();
    cleanup?.();
    return;
  }
  prepare?.();
  const root = document.documentElement;
  if (kind) root.dataset.vt = kind;
  const vt = document.startViewTransition(() => flushSync(update));
  vt.finished.finally(() => {
    delete root.dataset.vt;
    cleanup?.();
  });
}
