import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "./i18n";
import { supabase } from "./supabaseClient";
import { useTheme } from "./useTheme";

// ─────────────────────────────────────────────
// CONSTANTS — module scope, never recreated
// ─────────────────────────────────────────────
const DESTINATION_COORDS = {
  "Giappone": [35.6762, 139.6503], "Japan": [35.6762, 139.6503],
  "Japón": [35.6762, 139.6503], "Japon": [35.6762, 139.6503],
  "Argentina": [-41.1335, -71.3103], "Argentinien": [-41.1335, -71.3103],
  "Marocco": [31.7917, -7.0926], "Morocco": [31.7917, -7.0926],
  "Maroc": [31.7917, -7.0926], "Marruecos": [31.7917, -7.0926], "Marokko": [31.7917, -7.0926],
  "Islanda": [64.9631, -19.0208], "Iceland": [64.9631, -19.0208],
  "Islande": [64.9631, -19.0208], "Island": [64.9631, -19.0208],
  "Vietnam": [14.0583, 108.2772],
  "Grecia": [36.3932, 25.4615], "Greece": [36.3932, 25.4615],
  "Grèce": [36.3932, 25.4615], "Griechenland": [36.3932, 25.4615],
};

const CATEGORY_COLORS = {
  culture: "#c9a84c", adventure: "#e07b4a",
  nature: "#5a9e6f", food: "#c0564b", sea: "#4a7eb5",
};

const LANGUAGES = [
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];
const LANG_KEYS = ["it", "en", "fr", "es", "de"];

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Inject assets once at module load
const _font = document.createElement("link");
_font.rel  = "stylesheet";
_font.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap";
if (!document.querySelector('link[href*="Playfair"]')) document.head.appendChild(_font);

const _leaflet = document.createElement("link");
_leaflet.rel  = "stylesheet";
_leaflet.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
if (!document.querySelector('link[href*="leaflet"]')) document.head.appendChild(_leaflet);

// ─────────────────────────────────────────────
// CSS — identical token names + same font as TravelBlog
// ─────────────────────────────────────────────
const STYLES = `
  /* Same tokens as TravelBlog so the two pages look identical */
  :root, [data-theme="light"] {
    --bg:            #faf8f5;
    --bg2:           #f0ece4;
    --surface:       #ffffff;
    --border:        #e0d8c8;
    --text:          #1a1a18;
    --text2:         #4a4a48;
    --text3:         #7a7a78;
    --header-bg:     #1a1a18;
    --header-border: #2e2e2c;
    --gold:          #b8962e;
    --gold-btn:      #d4a843;
    --gold-light:    #f0d078;
    --tag-bg:        #f0ece4;
    --tag-text:      #6a6a68;
    --modal-bg:      #faf8f5;
    --spinner-track: #e8e0d0;
    --divider:       #ddd8d0;
    --footer-bg:     #1a1a18;
    --side-bg:       #ffffff;
    --popup-bg:      #1a1a18;
    --tile-filter:   saturate(0.8) brightness(1);
  }
  [data-theme="dark"] {
    --bg:            #0f0f0d;
    --bg2:           #171715;
    --surface:       #1c1c1a;
    --border:        #2c2c2a;
    --text:          #e8dfd0;
    --text2:         #b0a898;
    --text3:         #686860;
    --header-bg:     #0a0a08;
    --header-border: #222220;
    --gold:          #c9a84c;
    --gold-btn:      #d4b05a;
    --gold-light:    #e8c87a;
    --tag-bg:        #222220;
    --tag-text:      #888880;
    --modal-bg:      #131311;
    --spinner-track: #252523;
    --divider:       #2a2a28;
    --footer-bg:     #0a0a08;
    --side-bg:       #1c1c1a;
    --popup-bg:      #1a1a18;
    --tile-filter:   saturate(0.15) brightness(0.55) sepia(0.3);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); }

  /* Same font stack as TravelBlog */
  .map-root {
    font-family: 'Lato', -apple-system, sans-serif;
    font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
    line-height: 1.65;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    transition: background 0.3s, color 0.3s;
  }

  /* ── HEADER — identical to TravelBlog ── */
  .header {
    background: var(--header-bg);
    padding: 0 2rem;
    position: sticky; top: 0; z-index: 200;
    border-bottom: 1px solid var(--header-border);
  }
  .header-inner {
    max-width: 1400px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    height: 64px; gap: 1rem;
  }
  .logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.45rem; color: var(--gold-light);
    cursor: pointer; flex-shrink: 0; user-select: none;
  }
  .logo em { color: #e8dfd0; font-style: italic; }
  .header-right { display: flex; align-items: center; gap: 1.25rem; }

  .nav-list {
    display: flex; gap: 1.5rem; list-style: none;
    font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .nav-list li a {
    color: #888; text-decoration: none;
    cursor: pointer; white-space: nowrap;
    transition: color 0.2s; display: inline-block; padding: 0.25rem 0;
  }
  .nav-list li a:hover  { color: var(--gold-light); }
  .nav-list li a.active { color: var(--gold-light); }

  .theme-btn {
    background: transparent; border: 1px solid var(--header-border);
    color: #888; width: 34px; height: 34px; border-radius: 50%;
    cursor: pointer; font-size: 1rem;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0;
  }
  .theme-btn:hover { border-color: var(--gold-light); color: var(--gold-light); }

  .lang-switcher {
    display: flex; gap: 0.25rem;
    border-left: 1px solid var(--header-border); padding-left: 1rem;
  }
  .lang-btn {
    background: transparent; border: 1px solid transparent;
    color: #666; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
    padding: 0.2rem 0.45rem; border-radius: 2px; cursor: pointer; transition: all 0.2s;
  }
  .lang-btn:hover  { color: var(--gold-light); border-color: #444; }
  .lang-btn.active { background: var(--gold-btn); color: #1a1a18; border-color: var(--gold-btn); }

  .menu-btn {
    display: none; background: transparent; border: none;
    color: #888; font-size: 1.5rem; cursor: pointer;
    padding: 0.25rem; line-height: 1; min-width: 36px; min-height: 36px;
    align-items: center; justify-content: center;
  }

  /* ── MOBILE DRAWER — same opacity/pointer-events pattern as TravelBlog ── */
  .mobile-drawer {
    position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
    background: var(--header-bg);
    z-index: 199;
    display: flex; flex-direction: column;
    padding: 2rem; gap: 1.75rem;
    border-top: 1px solid var(--header-border);
    overflow-y: auto;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .mobile-drawer.open { opacity: 1; pointer-events: auto; transform: translateY(0); }
  .mobile-drawer .nav-list {
    flex-direction: column; gap: 0; display: flex !important;
  }
  .mobile-drawer .nav-list li a {
    font-size: 1.1rem; color: #bbb;
    padding: 0.75rem 0; display: block;
    border-bottom: 1px solid var(--header-border);
  }
  .mobile-drawer .nav-list li:last-child a { border-bottom: none; }
  .mobile-drawer .nav-list li a:hover,
  .mobile-drawer .nav-list li a.active { color: var(--gold-light); }
  .mobile-drawer .lang-switcher {
    border-left: none; padding-left: 0;
    border-top: 1px solid var(--header-border);
    padding-top: 1.25rem; flex-wrap: wrap; gap: 0.4rem;
  }
  .mobile-drawer .theme-row {
    display: flex; align-items: center; gap: 0.75rem;
    color: #666; font-size: 0.9rem; cursor: pointer; padding: 0.5rem 0;
  }

  /* ── PAGE HERO ── */
  .page-hero {
    max-width: 1400px; margin: 0 auto;
    padding: 2.5rem 2rem 1.5rem;
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 2rem; flex-wrap: wrap;
  }
  .page-eyebrow {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 0.5rem;
  }
  .page-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 1.5rem + 2vw, 2.75rem);
    line-height: 1.1; color: var(--text);
  }
  .page-title em { color: var(--gold-btn); font-style: italic; }
  .page-subtitle {
    font-size: 1rem; color: var(--text3);
    margin-top: 0.6rem; max-width: 440px; line-height: 1.6;
  }
  .counter-row { display: flex; gap: 2rem; flex-shrink: 0; }
  .counter { text-align: right; }
  .counter-num {
    font-family: 'Playfair Display', serif;
    font-size: 2.25rem; color: var(--gold-btn); line-height: 1;
  }
  .counter-label {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--text3); margin-top: 0.2rem;
  }

  /* ── LEGEND ── */
  .legend {
    max-width: 1400px; margin: 0 auto;
    padding: 0 2rem 1.25rem;
    display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: center;
  }
  .legend-label {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text3); margin-right: 0.4rem;
  }
  .legend-item {
    display: flex; align-items: center; gap: 0.4rem;
    cursor: pointer; transition: opacity 0.2s;
  }
  .legend-item.dimmed { opacity: 0.3; }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .legend-text { font-size: 0.85rem; color: var(--text3); }
  .legend-item:hover .legend-text { color: var(--text); }
  .legend-clear {
    font-size: 0.82rem; color: var(--gold-btn);
    cursor: pointer; margin-left: 0.5rem;
  }

  /* ── MAP LAYOUT ── */
  .map-layout {
    display: grid; grid-template-columns: 1fr 320px;
    gap: 1.25rem; max-width: 1400px; margin: 0 auto;
    padding: 0 2rem 4rem;
  }
  .map-main {
    border-radius: 6px; overflow: hidden;
    border: 1px solid var(--border); height: 560px;
  }
  .map-main .leaflet-container { height: 100%; background: var(--bg) !important; }
  .leaflet-tile { filter: var(--tile-filter) !important; transition: filter 0.3s; }

  /* ── LEAFLET POPUP ── */
  .leaflet-popup-content-wrapper {
    background: var(--popup-bg) !important;
    border: 1px solid #2a2a28 !important; border-radius: 4px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; padding: 0 !important;
  }
  .leaflet-popup-content { margin: 0 !important; min-width: 210px !important; }
  .leaflet-popup-tip { background: var(--popup-bg) !important; }
  .leaflet-popup-close-button { color: #555 !important; top: 8px !important; right: 10px !important; font-size: 16px !important; }
  .leaflet-popup-close-button:hover { color: var(--gold-btn) !important; }
  .map-popup { padding: 0.9rem 1.1rem; }
  .map-popup-cat {
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; margin-bottom: 0.35rem;
  }
  .map-popup-img {
    width: 100%; height: 100px; object-fit: cover;
    border-radius: 2px; margin-bottom: 0.65rem; display: block;
  }
  .map-popup-title {
    font-family: 'Playfair Display', serif;
    font-size: 1rem; color: #f0ece4; line-height: 1.3; margin-bottom: 0.15rem;
  }
  .map-popup-dest { font-size: 0.8rem; color: #777; font-style: italic; margin-bottom: 0.6rem; }
  .map-popup-excerpt {
    font-size: 0.82rem; color: #aaa; line-height: 1.5; margin-bottom: 0.65rem;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .map-popup-btn {
    display: block; width: 100%; padding: 0.45rem;
    background: var(--gold-btn); color: #0f0f0d;
    border: none; font-family: 'Lato', sans-serif;
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; cursor: pointer; border-radius: 2px;
    text-align: center; transition: opacity 0.2s;
  }
  .map-popup-btn:hover { opacity: 0.85; }

  /* ── SIDE PANEL ── */
  .side-panel {
    background: var(--side-bg); border-radius: 6px;
    border: 1px solid var(--border); padding: 1.25rem;
    overflow-y: auto; height: 560px;
  }
  .side-panel-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.95rem; color: var(--text);
    margin-bottom: 0.85rem; padding-bottom: 0.65rem;
    border-bottom: 1px solid var(--divider);
  }
  .side-card {
    display: flex; gap: 0.65rem;
    padding: 0.75rem 0; border-bottom: 1px solid var(--divider);
    cursor: pointer; transition: padding-left 0.2s;
  }
  .side-card:hover { padding-left: 0.4rem; }
  .side-card:last-child { border-bottom: none; }
  .side-card-img { width: 62px; height: 46px; object-fit: cover; border-radius: 3px; flex-shrink: 0; }
  .side-card-body { flex: 1; min-width: 0; }
  .side-card-cat {
    font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; margin-bottom: 0.15rem;
  }
  .side-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.85rem; color: var(--text); line-height: 1.3;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .side-card-dest { font-size: 0.75rem; color: var(--text3); font-style: italic; margin-top: 0.1rem; }
  .side-card-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.88);
    z-index: 300; display: flex; align-items: center; justify-content: center;
    padding: 1rem; animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  .modal {
    background: var(--modal-bg); max-width: 720px; width: 100%;
    max-height: 92vh; overflow-y: auto; border-radius: 6px;
    animation: slideUp 0.35s ease;
  }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  .modal-hero-img { width: 100%; height: 300px; object-fit: cover; }
  .modal-body { padding: 2rem 2.25rem 2.75rem; }
  .modal-cat {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; margin-bottom: 0.5rem;
  }
  .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem);
    line-height: 1.18; margin-bottom: 0.4rem; color: var(--text);
  }
  .modal-subtitle { font-size: 1.05rem; color: var(--text3); font-style: italic; margin-bottom: 1.25rem; line-height: 1.5; }
  .modal-meta {
    display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--text3);
    margin-bottom: 1.5rem; padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border); flex-wrap: wrap;
  }
  .modal-text { font-size: 1rem; line-height: 1.9; color: var(--text2); white-space: pre-line; }
  .modal-close {
    display: block; margin: 2rem auto 0;
    padding: 0.8rem 2.5rem; background: var(--text); color: var(--gold-light);
    border: none; font-family: 'Lato', sans-serif;
    font-size: 0.85rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; border-radius: 3px; transition: opacity 0.2s;
  }
  .modal-close:hover { opacity: 0.8; }

  /* ── LOADING ── */
  .loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh; flex-direction: column; gap: 1rem;
  }
  .spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--spinner-track); border-top-color: var(--gold);
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; color: var(--text3); font-style: italic;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .header { padding: 0 1.25rem; }
    .nav-list { display: none; }
    .lang-switcher { display: none; }
    .theme-btn { display: none; }
    .menu-btn { display: flex; }

    .page-hero { padding: 1.5rem 1.25rem 1rem; flex-direction: column; align-items: flex-start; gap: 1rem; }
    .counter-row { width: 100%; justify-content: flex-start; gap: 1.5rem; }
    .counter { text-align: left; }
    .counter-num { font-size: 1.75rem; }
    .legend { padding: 0 1.25rem 1rem; }

    .map-layout { grid-template-columns: 1fr; padding: 0 1.25rem 3rem; gap: 1rem; }
    .map-main { height: 420px; }
    .side-panel { height: auto; max-height: 320px; }
  }

  @media (max-width: 600px) {
    .page-hero { padding: 1.25rem 1rem 0.75rem; }
    .page-subtitle { font-size: 0.95rem; }
    .legend { padding: 0 1rem 0.75rem; gap: 0.85rem; }

    .map-layout { padding: 0 1rem 3rem; }
    .map-main { height: 340px; }

    .modal-overlay { padding: 0; align-items: flex-end; }
    .modal { max-height: 95vh; border-radius: 10px 10px 0 0; }
    .modal-hero-img { height: 220px; }
    .modal-body { padding: 1.25rem 1.25rem 2rem; }
  }
`;

// ─────────────────────────────────────────────
// PURE HELPERS — module scope
// ─────────────────────────────────────────────
function createPinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" opacity="0.92"/>
    <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 38], iconAnchor: [14, 38], popupAnchor: [0, -40] });
}

// Inner component — stable because it lives at module scope
function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 5, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function TravelMap({ onBack }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { theme, toggle } = useTheme();

  const [posts,          setPosts]         = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [selectedPost,   setSelectedPost]  = useState(null);
  const [flyTarget,      setFlyTarget]     = useState(null);
  const [activeCategory, setActiveCategory]= useState(null);
  const [menuOpen,       setMenuOpen]      = useState(false);

  // fetch
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts").select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  // lock body scroll when modal or drawer open
  useEffect(() => {
    document.body.style.overflow = (selectedPost || menuOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedPost, menuOpen]);

  // close drawer on back navigation
  const goBack = useCallback(() => {
    setMenuOpen(false);
    onBack?.();
  }, [onBack]);

  // helpers
  const getT = (post) => {
    const l = LANG_KEYS.includes(lang) ? lang : "en";
    return {
      title:       post[`title_${l}`]       || post.title_en       || post.title_it       || "—",
      subtitle:    post[`subtitle_${l}`]    || post.subtitle_en    || "",
      destination: post[`destination_${l}`] || post.destination_en || "",
      excerpt:     post[`excerpt_${l}`]     || post.excerpt_en     || "",
      body:        post[`body_${l}`]        || post.body_en        || "",
    };
  };

  const getCoords = (post) =>
    DESTINATION_COORDS[post.destination_it || post.destination_en || ""] || null;

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m] = d.split("-");
    return new Date(y, (m || 1) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  };

  const categoryLabels = {
    culture:   t("categories.culture"),
    adventure: t("categories.adventure"),
    nature:    t("categories.nature"),
    food:      t("categories.food"),
    sea:       t("categories.sea"),
  };

  // derived
  const postsWithCoords  = posts.filter(p => getCoords(p));
  const filtered         = activeCategory
    ? postsWithCoords.filter(p => p.category === activeCategory)
    : postsWithCoords;
  const uniqueCountries  = new Set(posts.map(p => p.destination_en || p.destination_it)).size;
  const uniqueContinents = new Set(posts.map(p => p.continent)).size;

  // ── loading state ──
  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="map-root">
        <div className="loading">
          <div className="spinner" />
          <p className="loading-text">Caricamento mappa…</p>
        </div>
      </div>
    </>
  );

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="map-root">

        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-inner">

            <div className="logo" onClick={goBack}>
              <em>via</em>ggi·lontani
            </div>

            <div className="header-right">
              {/* Desktop nav — inlined, no sub-component */}
              <ul className="nav-list">
                <li><a onClick={goBack}>{t("nav.destinations")}</a></li>
                <li><a className="active">🗺 {t("nav.map") || "Mappa"}</a></li>
              </ul>

              <button className="theme-btn" onClick={toggle} aria-label="Cambia tema">
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              <div className="lang-switcher">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    className={`lang-btn${lang === l.code ? " active" : ""}`}
                    onClick={() => i18n.changeLanguage(l.code)}
                  >{l.flag}</button>
                ))}
              </div>

              <button
                className="menu-btn"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Menu"
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </header>

        {/* ── MOBILE DRAWER — opacity/pointer-events, never unmounts ── */}
        <nav className={`mobile-drawer${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
          {/* Inlined nav links — direct goBack() call, no sub-component */}
          <ul className="nav-list">
            <li><a onClick={goBack}>{t("nav.destinations")}</a></li>
            <li><a className="active">🗺 {t("nav.map") || "Mappa"}</a></li>
          </ul>

          <div className="lang-switcher">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`lang-btn${lang === l.code ? " active" : ""}`}
                onClick={() => { i18n.changeLanguage(l.code); setMenuOpen(false); }}
              >{l.flag} {l.label}</button>
            ))}
          </div>

          <div
            className="theme-row"
            onClick={() => { toggle(); setMenuOpen(false); }}
          >
            <button className="theme-btn" onClick={e => e.stopPropagation()}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <span>{theme === "dark" ? "Tema chiaro" : "Tema scuro"}</span>
          </div>
        </nav>

        {/* ── PAGE HERO ── */}
        <div className="page-hero">
          <div>
            <div className="page-eyebrow">Il mondo visitato</div>
            <h1 className="page-title">Ogni pin,<br />una <em>storia</em></h1>
            <p className="page-subtitle">Clicca su un segnaposto per leggere il racconto. Filtra per categoria.</p>
          </div>
          <div className="counter-row">
            <div className="counter">
              <div className="counter-num">{postsWithCoords.length}</div>
              <div className="counter-label">Viaggi</div>
            </div>
            <div className="counter">
              <div className="counter-num">{uniqueCountries}</div>
              <div className="counter-label">Paesi</div>
            </div>
            <div className="counter">
              <div className="counter-num">{uniqueContinents}</div>
              <div className="counter-label">Continenti</div>
            </div>
          </div>
        </div>

        {/* ── LEGEND ── */}
        <div className="legend">
          <span className="legend-label">Filtra:</span>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div
              key={cat}
              className={`legend-item${activeCategory && activeCategory !== cat ? " dimmed" : ""}`}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              <div className="legend-dot" style={{ background: color }} />
              <span className="legend-text">{categoryLabels[cat]}</span>
            </div>
          ))}
          {activeCategory && (
            <span className="legend-clear" onClick={() => setActiveCategory(null)}>✕ Tutti</span>
          )}
        </div>

        {/* ── MAP + SIDE PANEL ── */}
        <div className="map-layout">
          <div className="map-main">
            <MapContainer
              center={[20, 10]} zoom={2} minZoom={2} maxZoom={10}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <MapFlyTo coords={flyTarget} />
              {filtered.map(post => {
                const coords = getCoords(post);
                if (!coords) return null;
                const tr    = getT(post);
                const color = CATEGORY_COLORS[post.category] || "#c9a84c";
                return (
                  <Marker
                    key={post.id}
                    position={coords}
                    icon={createPinIcon(color)}
                    eventHandlers={{ click: () => setFlyTarget(coords) }}
                  >
                    <Popup maxWidth={240} minWidth={210}>
                      <div className="map-popup">
                        <div className="map-popup-cat" style={{ color }}>
                          {tr.destination} · {categoryLabels[post.category]}
                        </div>
                        {post.image_url && (
                          <img className="map-popup-img" src={post.image_url} alt={tr.title} />
                        )}
                        <div className="map-popup-title">{tr.title}</div>
                        <div className="map-popup-dest">{tr.subtitle}</div>
                        <p className="map-popup-excerpt">{tr.excerpt}</p>
                        <button
                          className="map-popup-btn"
                          onClick={() => setSelectedPost(post)}
                        >Leggi il racconto →</button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          <div className="side-panel">
            <div className="side-panel-title">
              {activeCategory
                ? `${categoryLabels[activeCategory]} (${filtered.length})`
                : `Tutti i viaggi (${postsWithCoords.length})`}
            </div>
            {filtered.map(post => {
              const tr    = getT(post);
              const color = CATEGORY_COLORS[post.category] || "#c9a84c";
              return (
                <div
                  key={post.id}
                  className="side-card"
                  onClick={() => setFlyTarget(getCoords(post))}
                >
                  {post.image_url && (
                    <img className="side-card-img" src={post.image_url} alt={tr.title} />
                  )}
                  <div className="side-card-body">
                    <div className="side-card-cat" style={{ color }}>
                      {categoryLabels[post.category]}
                    </div>
                    <div className="side-card-title">{tr.title}</div>
                    <div className="side-card-dest">
                      {tr.destination} · {formatDate(post.date)}
                    </div>
                  </div>
                  <div className="side-card-dot" style={{ background: color }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ARTICLE MODAL ── */}
        {selectedPost && (() => {
          const tr    = getT(selectedPost);
          const color = CATEGORY_COLORS[selectedPost.category] || "#c9a84c";
          return (
            <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                {selectedPost.image_url && (
                  <img className="modal-hero-img" src={selectedPost.image_url} alt={tr.title} />
                )}
                <div className="modal-body">
                  <div className="modal-cat" style={{ color }}>
                    {tr.destination} · {categoryLabels[selectedPost.category]}
                  </div>
                  <h2 className="modal-title">{tr.title}</h2>
                  <p className="modal-subtitle">{tr.subtitle}</p>
                  <div className="modal-meta">
                    <span>📅 {formatDate(selectedPost.date)}</span>
                    <span>🌍 {t(`continents.${selectedPost.continent}`)}</span>
                    <span>⏱ {selectedPost.read_time} {t("modal.read")}</span>
                  </div>
                  <p className="modal-text">{tr.body}</p>
                  <button className="modal-close" onClick={() => setSelectedPost(null)}>
                    {t("modal.back")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </>
  );
}
