import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "./styles/map.css";
import { fetchPublishedPosts } from "./postsApi";
import { useTheme } from "./useTheme";
import { responsiveImage, IMG } from "./images";
import { pathFor, postKey, navigateTo, linkProps } from "./router";
import { setPageMeta } from "./head";
import { postText, formatMonth } from "./content";
import SiteHeader from "./components/SiteHeader";

const CATEGORY_COLORS = {
  culture: "#c9a84c", adventure: "#e07b4a",
  nature: "#5a9e6f", food: "#c0564b", sea: "#4a7eb5",
};

// Icone di Leaflet servite dal nostro dominio, non da una CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

function createPinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38" aria-hidden="true">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" opacity="0.92"/>
    <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 38], iconAnchor: [14, 38], popupAnchor: [0, -40] });
}

// Con "riduci movimento" la mappa si sposta senza animazione.
function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) map.setView(coords, 5);
    else map.flyTo(coords, 5, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

// Coordinate salvate nel DB (colonne lat/lng). Un post senza coordinate
// non compare sulla mappa, ma resta nel blog.
const getCoords = (post) =>
  Number.isFinite(post.lat) && Number.isFinite(post.lng) ? [post.lat, post.lng] : null;

export default function TravelMap({ route }) {
  const { t } = useTranslation();
  const lang = route.lang;
  const { theme, toggle } = useTheme();

  const [posts,          setPosts]         = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [flyTarget,      setFlyTarget]     = useState(null);
  const [activeCategory, setActiveCategory]= useState(null);
  const [menuOpen,       setMenuOpen]      = useState(false);
  const [error,          setError]         = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await fetchPublishedPosts();
      if (error) setError(error.message);
      else setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    setPageMeta({ lang, title: t("meta.mapTitle"), description: t("meta.mapDescription"), path: pathFor.map(lang) });
  }, [lang, t]);

  // Il blog si apre con un eventuale filtro di categoria (letto da TravelBlog).
  const goBlog = (category = "all") => {
    setMenuOpen(false);
    navigateTo(pathFor.home(lang), { state: { category } });
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  // L'articolo si apre alla sua pagina; "indietro" torna alla mappa.
  const openArticle = (post) => navigateTo(pathFor.article(lang, postKey(post)));

  const postsWithCoords  = posts.filter(p => getCoords(p));
  const filtered         = activeCategory ? postsWithCoords.filter(p => p.category === activeCategory) : postsWithCoords;
  const uniqueCountries  = new Set(posts.map(p => p.destination_en || p.destination_it)).size;
  const uniqueContinents = new Set(posts.map(p => p.continent)).size;

  return (
    <div className="page-root">
      <SiteHeader
        route={route}
        current="map"
        theme={theme}
        onToggleTheme={toggle}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onBlog={goBlog}
        wide
      />

      <main id="main" className="page-main" tabIndex={-1}>
        {loading ? (
          <div className="loading" role="status">
            <div className="spinner" aria-hidden="true" />
            <p className="loading-text">{t("map.loading")}</p>
          </div>
        ) : (
          <>
            <div className="page-hero">
              <div>
                <div className="page-eyebrow">{t("map.eyebrow")}</div>
                <h1 className="page-title">{t("map.titleLine1")}<br />{t("map.titleA")} <em>{t("map.titleEm")}</em></h1>
                <p className="page-subtitle">{t("map.subtitle")}</p>
              </div>
              <ul className="counter-row">
                {[
                  [postsWithCoords.length, t("map.counters.trips")],
                  [uniqueCountries, t("map.counters.countries")],
                  [uniqueContinents, t("map.counters.continents")],
                ].map(([n, label]) => (
                  <li className="counter" key={label}>
                    <span className="counter-num">{n}</span>
                    <span className="counter-label">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="error-banner" role="alert">⚠️ {t("map.error", { msg: error })}</div>
            )}

            <div className="legend" role="group" aria-labelledby="legend-label">
              <span className="legend-label" id="legend-label">{t("map.filterLabel")}</span>
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <button
                  key={cat}
                  className={`legend-item${activeCategory && activeCategory !== cat ? " dimmed" : ""}`}
                  aria-pressed={activeCategory === cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                >
                  <span className="legend-dot" style={{ background: color }} aria-hidden="true" />
                  <span className="legend-text">{t(`categories.${cat}`)}</span>
                </button>
              ))}
              {activeCategory && (
                <button className="legend-clear" onClick={() => setActiveCategory(null)}>{t("map.clear")}</button>
              )}
            </div>

            <div className="map-layout">
              <div className="map-main">
                <MapContainer
                  center={[20, 10]} zoom={2} minZoom={2} maxZoom={10}
                  scrollWheelZoom
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapFlyTo coords={flyTarget} />
                  {filtered.map(post => {
                    const coords = getCoords(post);
                    const tr     = postText(post, lang);
                    const color  = CATEGORY_COLORS[post.category] || "#c9a84c";
                    return (
                      <Marker
                        key={post.id}
                        position={coords}
                        icon={createPinIcon(color)}
                        title={tr.title}
                        alt={tr.title}
                        eventHandlers={{ click: () => setFlyTarget(coords) }}
                      >
                        <Popup maxWidth={240} minWidth={210}>
                          <div className="map-popup">
                            <div className="map-popup-cat">
                              <span className="legend-dot" style={{ background: color }} aria-hidden="true" />
                              {tr.destination} · {t(`categories.${post.category}`)}
                            </div>
                            {post.image_url && (
                              <img className="map-popup-img" {...responsiveImage(post.image_url, ...IMG.popup)} alt="" width="210" height="100" decoding="async" />
                            )}
                            <div className="map-popup-title">{tr.title}</div>
                            <div className="map-popup-dest">{tr.subtitle}</div>
                            <p className="map-popup-excerpt">{tr.excerpt}</p>
                            <a className="map-popup-btn" {...linkProps(pathFor.article(lang, postKey(post)), () => openArticle(post))}>
                              {t("map.readStory")}
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              <section className="side-panel" aria-labelledby="side-panel-title">
                <h2 className="side-panel-title" id="side-panel-title">
                  {activeCategory
                    ? `${t(`categories.${activeCategory}`)} (${filtered.length})`
                    : t("map.allTrips", { count: postsWithCoords.length })}
                </h2>
                <ul className="side-list">
                  {filtered.map(post => {
                    const tr    = postText(post, lang);
                    const color = CATEGORY_COLORS[post.category] || "#c9a84c";
                    return (
                      <li key={post.id}>
                        <button
                          className="side-card"
                          aria-label={t("map.showOnMap", { title: tr.title })}
                          onClick={() => setFlyTarget(getCoords(post))}
                        >
                          {post.image_url && (
                            <img className="side-card-img" {...responsiveImage(post.image_url, ...IMG.thumb)} alt="" width="62" height="46" loading="lazy" decoding="async" />
                          )}
                          <span className="side-card-body">
                            <span className="side-card-cat">{t(`categories.${post.category}`)}</span>
                            <span className="side-card-title">{tr.title}</span>
                            <span className="side-card-dest">{tr.destination} · {formatMonth(post.date, lang)}</span>
                          </span>
                          <span className="side-card-dot" style={{ background: color }} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
