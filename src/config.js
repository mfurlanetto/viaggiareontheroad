// Configurazione unica del sito. Usata dall'app, da vite.config.js (index.html)
// e da scripts/prerender.mjs: per cambiare dominio basta modificare SITE_URL.
export const SITE_URL = "https://viaggiareontheroad.vercel.app";
export const SITE_NAME = "Viaggiare On The Road";
export const CONTACT_EMAIL = "viaggiareontheroad23@gmail.com";

// L'italiano e' la lingua principale e non ha prefisso negli URL;
// le altre usano /en, /fr, /es, /de.
export const DEFAULT_LANG = "it";
export const LANGS = ["it", "en", "fr", "es", "de"];
export const LANG_INFO = {
  it: { label: "IT", flag: "🇮🇹", name: "Italiano", ogLocale: "it_IT", dateLocale: "it-IT" },
  en: { label: "EN", flag: "🇬🇧", name: "English",  ogLocale: "en_GB", dateLocale: "en-GB" },
  fr: { label: "FR", flag: "🇫🇷", name: "Français", ogLocale: "fr_FR", dateLocale: "fr-FR" },
  es: { label: "ES", flag: "🇪🇸", name: "Español",  ogLocale: "es_ES", dateLocale: "es-ES" },
  de: { label: "DE", flag: "🇩🇪", name: "Deutsch",  ogLocale: "de_DE", dateLocale: "de-DE" },
};
