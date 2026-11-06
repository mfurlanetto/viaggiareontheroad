import { useState, useEffect } from "react";

// localStorage puo' lanciare eccezioni (modalita' privata, storage bloccato):
// in quel caso il tema funziona comunque, solo senza essere ricordato.
const readSaved = () => {
  try { return localStorage.getItem("theme"); } catch { return null; }
};
const save = (value) => {
  try { localStorage.setItem("theme", value); } catch { /* non persistito */ }
};
const systemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function useTheme() {
  // explicit = true solo se l'utente ha scelto il tema con il pulsante.
  // Finche' non lo fa, il tema segue le impostazioni del sistema operativo.
  const [state, setState] = useState(() => {
    const saved = readSaved();
    return saved === "dark" || saved === "light"
      ? { theme: saved, explicit: true }
      : { theme: systemTheme(), explicit: false };
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", state.theme);
    if (state.explicit) save(state.theme);
  }, [state]);

  useEffect(() => {
    if (state.explicit) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setState({ theme: e.matches ? "dark" : "light", explicit: false });
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.explicit]);

  const toggle = () =>
    setState(s => ({ theme: s.theme === "dark" ? "light" : "dark", explicit: true }));

  return { theme: state.theme, toggle };
}
