import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "./i18n";
import { supabase } from "./supabaseClient";

// Fix default marker icons for Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Coordinates for each destination
const DESTINATION_COORDS = {
  "Giappone": [35.6762, 139.6503],
  "Japan": [35.6762, 139.6503],
  "Japón": [35.6762, 139.6503],
  "Japon": [35.6762, 139.6503],
  "Argentina": [-41.1335, -71.3103],
  "Argentinien": [-41.1335, -71.3103],
  "Marocco": [31.7917, -7.0926],
  "Morocco": [31.7917, -7.0926],
  "Maroc": [31.7917, -7.0926],
  "Marruecos": [31.7917, -7.0926],
  "Marokko": [31.7917, -7.0926],
  "Islanda": [64.9631, -19.0208],
  "Iceland": [64.9631, -19.0208],
  "Islande": [64.9631, -19.0208],
  "Island": [64.9631, -19.0208],
  "Vietnam": [14.0583, 108.2772],
  "Grecia": [36.3932, 25.4615],
  "Greece": [36.3932, 25.4615],
  "Grèce": [36.3932, 25.4615],
  "Griechenland": [36.3932, 25.4615],
};

const CATEGORY_COLORS = {
  culture:   "#c9a84c",
  adventure: "#e07b4a",
  nature:    "#5a9e6f",
  food:      "#c0564b",
  sea:       "#4a7eb5",
};

const LANGUAGES = [
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];

const LANG_KEYS = ["it", "en", "fr", "es", "de"];

const googleFont = document.createElement("link");
googleFont.rel = "stylesheet";
googleFont.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Crimson+Pro:wght@300;400;600&display=swap";
if (!document.querySelector('link[href*="Playfair"]')) document.head.appendChild(googleFont);

const leafletCSS = document.createElement("link");
leafletCSS.rel = "stylesheet";
leafletCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
if (!document.querySelector('link[href*="leaflet"]')) document.head.appendChild(leafletCSS);

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0e0e0c; }

  .map-root {
    font-family: 'Crimson Pro', Georgia, serif;
    background: #0e0e0c;
    min-height: 100vh;
    color: #f0ece4;
  }

  /* HEADER */
  .header { background: #0e0e0c; border-bottom: 1px solid #222; padding: 0 2rem; position: sticky; top: 0; z-index: 1000; }
  .header-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .logo { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: #e8c87a; cursor: pointer; text-decoration: none; }
  .logo span { color: #f0ece4; font-style: italic; }
  .header-right { display: flex; align-items: center; gap: 1.5rem; }
  .nav-links { display: flex; gap: 1.5rem; list-style: none; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; }
  .nav-links a { color: #666; text-decoration: none; transition: color 0.2s; cursor: pointer; }
  .nav-links a:hover, .nav-links a.active { color: #e8c87a; }
  .lang-switcher { display: flex; gap: 0.3rem; border-left: 1px solid #222; padding-left: 1.25rem; }
  .lang-btn { background: transparent; border: 1px solid transparent; color: #555; font-family: 'Crimson Pro', serif; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em; padding: 0.2rem 0.4rem; border-radius: 2px; cursor: pointer; transition: all 0.2s; }
  .lang-btn:hover { color: #e8c87a; border-color: #333; }
  .lang-btn.active { background: #e8c87a; color: #0e0e0c; border-color: #e8c87a; }

  /* PAGE HEADER */
  .page-hero {
    max-width: 1400px;
    margin: 0 auto;
    padding: 3rem 2rem 2rem;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 2rem;
  }
  .page-hero-text {}
  .page-eyebrow { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c9a84c; margin-bottom: 0.5rem; }
  .page-title { font-family: 'Playfair Display', serif; font-size: 3rem; line-height: 1.1; color: #f0ece4; }
  .page-title em { color: #e8c87a; font-style: italic; }
  .page-subtitle { font-size: 1.05rem; color: #666; margin-top: 0.75rem; max-width: 480px; line-height: 1.6; }
  .counter-row { display: flex; gap: 2.5rem; }
  .counter { text-align: right; }
  .counter-num { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #e8c87a; line-height: 1; }
  .counter-label { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin-top: 0.25rem; }

  /* LEGEND */
  .legend {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem 1.5rem;
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .legend-label { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #444; margin-right: 0.5rem; }
  .legend-item { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; transition: opacity 0.2s; }
  .legend-item.dimmed { opacity: 0.3; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .legend-text { font-size: 0.8rem; color: #888; letter-spacing: 0.05em; }
  .legend-item:hover .legend-text { color: #f0ece4; }

  /* MAP WRAPPER */
  .map-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
  }
  .map-container-outer {
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #1e1e1c;
    height: 580px;
    position: relative;
  }
  .leaflet-container { height: 100%; width: 100%; background: #0e0e0c !important; }

  /* Custom Leaflet tile filter */
  .leaflet-tile { filter: saturate(0.15) brightness(0.55) sepia(0.3); }

  /* CUSTOM MARKER POPUP */
  .leaflet-popup-content-wrapper {
    background: #1a1a18 !important;
    border: 1px solid #2a2a28 !important;
    border-radius: 4px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
    padding: 0 !important;
  }
  .leaflet-popup-content { margin: 0 !important; width: auto !important; min-width: 220px; }
  .leaflet-popup-tip { background: #1a1a18 !important; }
  .leaflet-popup-close-button { color: #555 !important; font-size: 18px !important; top: 8px !important; right: 10px !important; }
  .leaflet-popup-close-button:hover { color: #e8c87a !important; }

  .map-popup { padding: 1rem 1.25rem; }
  .map-popup-cat { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; margin-bottom: 0.4rem; }
  .map-popup-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: #f0ece4; line-height: 1.3; margin-bottom: 0.2rem; }
  .map-popup-dest { font-size: 0.82rem; color: #888; font-style: italic; margin-bottom: 0.75rem; }
  .map-popup-img { width: 100%; height: 110px; object-fit: cover; border-radius: 2px; margin-bottom: 0.75rem; display: block; }
  .map-popup-excerpt { font-size: 0.85rem; color: #aaa; line-height: 1.55; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .map-popup-btn { display: block; width: 100%; padding: 0.5rem; background: #e8c87a; color: #0e0e0c; border: none; font-family: 'Crimson Pro', serif; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: background 0.2s; text-align: center; }
  .map-popup-btn:hover { background: #f0d68a; }

  /* SIDE PANEL */
  .map-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; max-width: 1400px; margin: 0 auto; padding: 1.5rem 2rem 4rem; }
  .map-main { border-radius: 6px; overflow: hidden; border: 1px solid #1e1e1c; height: 580px; }
  .map-main .leaflet-container { height: 100%; }

  .side-panel { display: flex; flex-direction: column; gap: 0; }
  .side-panel-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: #f0ece4; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #1e1e1c; }
  .side-card {
    display: flex;
    gap: 0.75rem;
    padding: 0.85rem 0;
    border-bottom: 1px solid #161614;
    cursor: pointer;
    transition: all 0.2s;
  }
  .side-card:hover { padding-left: 0.5rem; }
  .side-card:last-child { border-bottom: none; }
  .side-card-img { width: 70px; height: 52px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
  .side-card-body { flex: 1; min-width: 0; }
  .side-card-cat { font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; margin-bottom: 0.2rem; }
  .side-card-title { font-family: 'Playfair Display', serif; font-size: 0.9rem; color: #f0ece4; line-height: 1.3; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .side-card-dest { font-size: 0.75rem; color: #555; font-style: italic; }
  .side-card-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 6px; }

  /* ARTICLE MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  .modal { background: #141412; max-width: 680px; width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 4px; border: 1px solid #222; animation: slideUp 0.35s ease; }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  .modal-hero-img { width: 100%; height: 300px; object-fit: cover; }
  .modal-body { padding: 2rem 2.5rem 2.5rem; }
  .modal-cat { font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 2rem; line-height: 1.2; margin-bottom: 0.35rem; color: #f0ece4; }
  .modal-subtitle { font-size: 1rem; color: #666; font-style: italic; margin-bottom: 1.25rem; }
  .modal-meta { display: flex; gap: 1.5rem; font-size: 0.78rem; color: #555; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #1e1e1c; flex-wrap: wrap; }
  .modal-text { font-size: 1rem; line-height: 1.9; color: #aaa; white-space: pre-line; }
  .modal-close { display: block; margin: 2rem auto 0; padding: 0.7rem 2.5rem; background: transparent; color: #e8c87a; border: 1px solid #e8c87a; font-family: 'Crimson Pro', serif; font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: all 0.2s; }
  .modal-close:hover { background: #e8c87a; color: #0e0e0c; }

  /* LOADING */
  .loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; flex-direction: column; gap: 1rem; }
  .spinner { width: 36px; height: 36px; border: 2px solid #222; border-top-color: #c9a84c; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Playfair Display', serif; font-size: 1rem; color: #444; font-style: italic; }
`;

// Custom colored pin marker
function createPinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" opacity="0.92"/>
    <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -40],
  });
}

// Fly to marker when selected
function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 5, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

export default function TravelMap() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }

  function getT(post) {
    const l = LANG_KEYS.includes(lang) ? lang : "en";
    return {
      title: post[`title_${l}`] || post.title_en || post.title_it || "—",
      subtitle: post[`subtitle_${l}`] || post.subtitle_en || "",
      destination: post[`destination_${l}`] || post.destination_en || "",
      excerpt: post[`excerpt_${l}`] || post.excerpt_en || "",
      body: post[`body_${l}`] || post.body_en || "",
    };
  }

  function getCoords(post) {
    const dest = post.destination_it || post.destination_en || "";
    return DESTINATION_COORDS[dest] || null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    return new Date(year, (month || 1) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  };

  const postsWithCoords = posts.filter(p => getCoords(p));
  const filtered = activeCategory
    ? postsWithCoords.filter(p => p.category === activeCategory)
    : postsWithCoords;

  const uniqueCountries = new Set(posts.map(p => p.destination_en || p.destination_it)).size;
  const uniqueContinents = new Set(posts.map(p => p.continent)).size;

  function handleMarkerClick(post) {
    const coords = getCoords(post);
    setFlyTarget(coords);
  }

  function handleSideCardClick(post) {
    const coords = getCoords(post);
    setFlyTarget(coords);
  }

  const categoryLabels = {
    culture: t("categories.culture"),
    adventure: t("categories.adventure"),
    nature: t("categories.nature"),
    food: t("categories.food"),
    sea: t("categories.sea"),
  };

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="map-root">
        <div className="loading"><div className="spinner" /><p className="loading-text">Caricamento mappa…</p></div>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="map-root">

        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <a className="logo" href="/"><span>via</span>ggi&middot;lontani</a>
            <div className="header-right">
              <nav><ul className="nav-links">
                <li><a href="/">{t("nav.destinations")}</a></li>
                <li><a href="#" className="active">🗺 Mappa</a></li>
              </ul></nav>
              <div className="lang-switcher">
                {LANGUAGES.map(l => (
                  <button key={l.code} className={`lang-btn${lang === l.code ? " active" : ""}`} onClick={() => i18n.changeLanguage(l.code)}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE HERO */}
        <div className="page-hero">
          <div className="page-hero-text">
            <div className="page-eyebrow">Il mondo visitato</div>
            <h1 className="page-title">Ogni pin,<br />una <em>storia</em></h1>
            <p className="page-subtitle">Clicca su un segnaposto per leggere il racconto di quel viaggio. Filtra per categoria e naviga il mondo.</p>
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

        {/* LEGEND / FILTER */}
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
            <div className="legend-item" onClick={() => setActiveCategory(null)} style={{ marginLeft: "0.5rem" }}>
              <span className="legend-text" style={{ color: "#e8c87a", cursor: "pointer" }}>✕ Tutti</span>
            </div>
          )}
        </div>

        {/* MAP + SIDE PANEL */}
        <div className="map-layout">
          <div className="map-main">
            <MapContainer
              center={[20, 10]}
              zoom={2}
              minZoom={2}
              maxZoom={10}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapFlyTo coords={flyTarget} />
              {filtered.map(post => {
                const coords = getCoords(post);
                if (!coords) return null;
                const tr = getT(post);
                const color = CATEGORY_COLORS[post.category] || "#c9a84c";
                const icon = createPinIcon(color);
                return (
                  <Marker
                    key={post.id}
                    position={coords}
                    icon={icon}
                    eventHandlers={{ click: () => handleMarkerClick(post) }}
                  >
                    <Popup maxWidth={260} minWidth={220}>
                      <div className="map-popup">
                        <div className="map-popup-cat" style={{ color }}>{tr.destination} · {categoryLabels[post.category]}</div>
                        {post.image_url && <img className="map-popup-img" src={post.image_url} alt={tr.title} />}
                        <div className="map-popup-title">{tr.title}</div>
                        <div className="map-popup-dest">{tr.subtitle}</div>
                        <p className="map-popup-excerpt">{tr.excerpt}</p>
                        <button className="map-popup-btn" onClick={() => setSelectedPost(post)}>
                          Leggi il racconto →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* SIDE LIST */}
          <div className="side-panel">
            <div className="side-panel-title">
              {activeCategory ? `${categoryLabels[activeCategory]} (${filtered.length})` : `Tutti i viaggi (${postsWithCoords.length})`}
            </div>
            {filtered.map(post => {
              const tr = getT(post);
              const color = CATEGORY_COLORS[post.category] || "#c9a84c";
              return (
                <div key={post.id} className="side-card" onClick={() => handleSideCardClick(post)}>
                  {post.image_url && <img className="side-card-img" src={post.image_url} alt={tr.title} />}
                  <div className="side-card-body">
                    <div className="side-card-cat" style={{ color }}>{categoryLabels[post.category]}</div>
                    <div className="side-card-title">{tr.title}</div>
                    <div className="side-card-dest">{tr.destination} · {formatDate(post.date)}</div>
                  </div>
                  <div className="side-card-dot" style={{ background: color }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ARTICLE MODAL */}
        {selectedPost && (() => {
          const tr = getT(selectedPost);
          const color = CATEGORY_COLORS[selectedPost.category] || "#c9a84c";
          return (
            <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                {selectedPost.image_url && <img className="modal-hero-img" src={selectedPost.image_url} alt={tr.title} />}
                <div className="modal-body">
                  <div className="modal-cat" style={{ color }}>{tr.destination} · {categoryLabels[selectedPost.category]}</div>
                  <h2 className="modal-title">{tr.title}</h2>
                  <p className="modal-subtitle">{tr.subtitle}</p>
                  <div className="modal-meta">
                    <span>📅 {formatDate(selectedPost.date)}</span>
                    <span>🌍 {t(`continents.${selectedPost.continent}`)}</span>
                    <span>⏱ {selectedPost.read_time} {t("hero.readTime")}</span>
                  </div>
                  <p className="modal-text">{tr.body}</p>
                  <button className="modal-close" onClick={() => setSelectedPost(null)}>{t("modal.back")}</button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </>
  );
}
