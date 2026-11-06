import { LANGS, LANG_INFO } from "./config";

// Testi di un post nella lingua richiesta, con ripiego su inglese e italiano.
export function postText(post, lang) {
  const l = LANGS.includes(lang) ? lang : "en";
  const pick = (field) => post[`${field}_${l}`] || post[`${field}_en`] || post[`${field}_it`] || "";
  return {
    title: pick("title") || "—",
    subtitle: pick("subtitle"),
    destination: pick("destination"),
    excerpt: pick("excerpt"),
    body: pick("body"),
  };
}

// "2024-03" -> "marzo 2024" / "March 2024" ...
export function formatMonth(d, lang) {
  const m = /^(\d{4})-(\d{2})/.exec(d || "");
  if (!m) return "";
  const locale = LANG_INFO[lang]?.dateLocale || "it-IT";
  return new Date(Date.UTC(+m[1], +m[2] - 1, 1))
    .toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
}

// Ancora di un giorno nell'URL dell'articolo: /articoli/<slug>#giorno-3
export const dayAnchor = (n) => `giorno-${n}`;
