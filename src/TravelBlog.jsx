import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./i18n";
import { supabase } from "./supabaseClient";
import { useTheme } from "./useTheme";

const LANGUAGES = [
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];

const googleFont = document.createElement("link");
googleFont.rel = "stylesheet";
googleFont.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Crimson+Pro:wght@300;400;600&display=swap";
if (!document.querySelector('link[href*="Playfair"]')) document.head.appendChild(googleFont);

const styles = `
  /* ── THEME TOKENS ── */
  :root, [data-theme="light"] {
    --bg:        #faf8f5;
    --bg2:       #f0ece4;
    --surface:   #ffffff;
    --border:    #e0d8c8;
    --text:      #1a1a18;
    --text2:     #555;
    --text3:     #888;
    --header-bg: #1a1a18;
    --header-border: #333;
    --gold:      #c9a84c;
    --gold-btn:  #e8c87a;
    --tag-bg:    #f0ece4;
    --modal-bg:  #faf8f5;
    --spinner-track: #e8e0d0;
    --filter-border: #d0c8b8;
    --divider:   #ddd;
    --card-hover-bg: #f0ece4;
    --side-hover-bg: #f0ece4;
  }
  [data-theme="dark"] {
    --bg:        #0e0e0c;
    --bg2:       #161614;
    --surface:   #1a1a18;
    --border:    #2a2a28;
    --text:      #f0ece4;
    --text2:     #aaa;
    --text3:     #666;
    --header-bg: #0a0a08;
    --header-border: #222;
    --gold:      #c9a84c;
    --gold-btn:  #e8c87a;
    --tag-bg:    #222;
    --modal-bg:  #141412;
    --spinner-track: #222;
    --filter-border: #333;
    --divider:   #2a2a28;
    --card-hover-bg: #1e1e1c;
    --side-hover-bg: #1e1e1c;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); transition: background 0.3s, color 0.3s; }

  .blog-root {
    font-family: 'Crimson Pro', Georgia, serif;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    transition: background 0.3s, color 0.3s;
  }

  /* ── HEADER ── */
  .header {
    background: var(--header-bg);
    color: #f0ece4;
    padding: 0 2rem;
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--header-border);
  }
  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    gap: 1rem;
  }
  .logo { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: var(--gold-btn); cursor: pointer; flex-shrink: 0; }
  .logo span { color: #f0ece4; font-style: italic; }
  .header-right { display: flex; align-items: center; gap: 1.25rem; }

  /* Nav desktop */
  .nav-links { display: flex; gap: 1.5rem; list-style: none; font-size: 0.82rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .nav-links a { color: #888; text-decoration: none; transition: color 0.2s; cursor: pointer; white-space: nowrap; }
  .nav-links a:hover { color: var(--gold-btn); }

  /* Theme toggle */
  .theme-btn {
    background: transparent;
    border: 1px solid var(--header-border);
    color: #888;
    width: 32px; height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .theme-btn:hover { border-color: var(--gold-btn); color: var(--gold-btn); }

  /* Lang switcher */
  .lang-switcher { display: flex; gap: 0.25rem; border-left: 1px solid var(--header-border); padding-left: 1rem; }
  .lang-btn {
    background: transparent; border: 1px solid transparent;
    color: #666; font-family: 'Crimson Pro', serif; font-size: 0.72rem;
    font-weight: 600; letter-spacing: 0.06em; padding: 0.18rem 0.4rem;
    border-radius: 2px; cursor: pointer; transition: all 0.2s;
  }
  .lang-btn:hover { color: var(--gold-btn); border-color: #444; }
  .lang-btn.active { background: var(--gold-btn); color: #1a1a18; border-color: var(--gold-btn); }

  /* Mobile menu toggle */
  .menu-btn {
    display: none;
    background: transparent; border: none;
    color: #888; font-size: 1.4rem; cursor: pointer;
    padding: 0.25rem;
  }

  /* Mobile drawer */
  .mobile-drawer {
    display: none;
    position: fixed; inset: 0; top: 64px;
    background: var(--header-bg);
    z-index: 99;
    flex-direction: column;
    padding: 2rem;
    gap: 1.5rem;
    animation: fadeIn 0.2s ease;
    border-top: 1px solid var(--header-border);
  }
  .mobile-drawer.open { display: flex; }
  .mobile-drawer .nav-links { flex-direction: column; gap: 1.25rem; }
  .mobile-drawer .nav-links a { font-size: 1.1rem; color: #aaa; }
  .mobile-drawer .lang-switcher { border-left: none; padding-left: 0; border-top: 1px solid var(--header-border); padding-top: 1.25rem; flex-wrap: wrap; }
  .mobile-drawer .theme-row { display: flex; align-items: center; gap: 0.75rem; color: #666; font-size: 0.85rem; }

  /* ── LOADING ── */
  .loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; flex-direction: column; gap: 1rem; }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--spinner-track); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--text3); font-style: italic; }
  .error-banner { max-width: 1200px; margin: 2rem auto; padding: 1rem 2rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404; font-size: 0.9rem; }

  /* ── HERO ── */
  .hero { max-width: 1200px; margin: 0 auto; padding: 2.5rem 1.5rem 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .hero-featured { position: relative; border-radius: 4px; overflow: hidden; cursor: pointer; height: 480px; }
  .hero-featured img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
  .hero-featured:hover img { transform: scale(1.03); }
  .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 1.75rem; }
  .hero-tag { display: inline-block; background: var(--gold-btn); color: #1a1a18; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.22rem 0.7rem; margin-bottom: 0.65rem; width: fit-content; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: 1.9rem; color: #fff; line-height: 1.2; margin-bottom: 0.35rem; }
  .hero-subtitle { font-size: 0.95rem; color: rgba(255,255,255,0.7); font-style: italic; margin-bottom: 0.65rem; }
  .hero-meta { font-size: 0.78rem; color: rgba(255,255,255,0.5); }

  .hero-side { display: flex; flex-direction: column; gap: 1rem; }
  .hero-side-card { display: flex; gap: 0.85rem; cursor: pointer; padding: 0.65rem; border-radius: 4px; transition: background 0.2s; border: 1px solid transparent; }
  .hero-side-card:hover { background: var(--card-hover-bg); border-color: var(--border); }
  .hero-side-img { width: 100px; height: 72px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
  .hero-side-body { display: flex; flex-direction: column; justify-content: center; }
  .hero-side-cat { font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 0.25rem; }
  .hero-side-title { font-family: 'Playfair Display', serif; font-size: 1rem; line-height: 1.3; color: var(--text); margin-bottom: 0.2rem; }
  .hero-side-meta { font-size: 0.72rem; color: var(--text3); }

  /* ── SECTION DIVIDER ── */
  .section-divider { max-width: 1200px; margin: 2rem auto 0; padding: 0 1.5rem; display: flex; align-items: center; gap: 1.25rem; }
  .section-divider h2 { font-family: 'Playfair Display', serif; font-size: 1.3rem; white-space: nowrap; color: var(--text); }
  .divider-line { flex: 1; height: 1px; background: var(--divider); }

  /* ── FILTERS ── */
  .filters { max-width: 1200px; margin: 0 auto; padding: 1rem 1.5rem; display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
  .filter-label { font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); margin-right: 0.2rem; }
  .filter-btn { padding: 0.3rem 0.85rem; border: 1px solid var(--filter-border); background: transparent; font-family: 'Crimson Pro', serif; font-size: 0.85rem; color: var(--text2); cursor: pointer; border-radius: 2px; transition: all 0.2s; }
  .filter-btn:hover { border-color: var(--text); color: var(--text); }
  .filter-btn.active { background: var(--text); color: var(--gold-btn); border-color: var(--text); }
  .filter-sep { width: 1px; height: 22px; background: var(--divider); margin: 0 0.35rem; }

  /* ── GRID ── */
  .grid { max-width: 1200px; margin: 0 auto; padding: 1.25rem 1.5rem 4rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
  .card { cursor: pointer; }
  .card-img-wrap { overflow: hidden; border-radius: 3px; height: 210px; margin-bottom: 0.85rem; }
  .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .card:hover .card-img-wrap img { transform: scale(1.05); }
  .card-cat { font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 0.35rem; }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; line-height: 1.3; margin-bottom: 0.2rem; color: var(--text); transition: color 0.2s; }
  .card:hover .card-title { color: var(--gold); }
  .card-subtitle { font-size: 0.88rem; color: var(--text3); font-style: italic; margin-bottom: 0.55rem; }
  .card-excerpt { font-size: 0.9rem; color: var(--text2); line-height: 1.6; margin-bottom: 0.7rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text3); border-top: 1px solid var(--border); padding-top: 0.65rem; }
  .card-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  .tag { background: var(--tag-bg); color: var(--text3); padding: 0.12rem 0.45rem; font-size: 0.68rem; border-radius: 2px; }

  /* ── MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  .modal { background: var(--modal-bg); max-width: 700px; width: 100%; max-height: 92vh; overflow-y: auto; border-radius: 4px; animation: slideUp 0.35s ease; }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  .modal-hero-img { width: 100%; height: 280px; object-fit: cover; }
  .modal-body { padding: 1.75rem 2rem 2.5rem; }
  .modal-cat { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 0.45rem; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 2rem; line-height: 1.2; margin-bottom: 0.35rem; color: var(--text); }
  .modal-subtitle { font-size: 1rem; color: var(--text3); font-style: italic; margin-bottom: 1.1rem; }
  .modal-meta { display: flex; gap: 1.25rem; font-size: 0.78rem; color: var(--text3); margin-bottom: 1.4rem; padding-bottom: 1.4rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .modal-text { font-size: 1rem; line-height: 1.9; color: var(--text2); white-space: pre-line; }
  .modal-close { display: block; margin: 1.75rem auto 0; padding: 0.7rem 2.25rem; background: var(--text); color: var(--gold-btn); border: none; font-family: 'Crimson Pro', serif; font-size: 0.88rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: opacity 0.2s; }
  .modal-close:hover { opacity: 0.8; }

  .empty { grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text3); font-style: italic; font-size: 1.05rem; }

  /* ── FOOTER ── */
  .footer { background: var(--header-bg); color: var(--text3); text-align: center; padding: 2rem; font-size: 0.8rem; letter-spacing: 0.05em; border-top: 1px solid var(--header-border); }
  .footer span { color: var(--gold-btn); }

  /* ── RESPONSIVE ── */

  /* Tablet (≤900px) */
  @media (max-width: 900px) {
    .header { padding: 0 1.25rem; }
    .nav-links { display: none; }
    .lang-switcher { display: none; }
    .theme-btn { display: none; }
    .menu-btn { display: flex; }

    .hero { grid-template-columns: 1fr; padding: 1.5rem 1.25rem 1.25rem; }
    .hero-featured { height: 340px; }
    .hero-side { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .grid { grid-template-columns: repeat(2, 1fr); padding: 1rem 1.25rem 3rem; gap: 1.25rem; }

    .filters { padding: 0.85rem 1.25rem; }
    .filter-sep { display: none; }
    .section-divider { padding: 0 1.25rem; }
  }

  /* Mobile (≤600px) */
  @media (max-width: 600px) {
    .logo { font-size: 1.2rem; }

    .hero { padding: 1.25rem 1rem 1rem; gap: 1rem; }
    .hero-featured { height: 280px; }
    .hero-title { font-size: 1.5rem; }
    .hero-side { grid-template-columns: 1fr; }
    .hero-side-card { padding: 0.5rem; }
    .hero-side-img { width: 85px; height: 62px; }

    .section-divider { padding: 0 1rem; margin-top: 1.5rem; }
    .section-divider h2 { font-size: 1.1rem; }

    .filters { padding: 0.75rem 1rem; gap: 0.35rem; }
    .filter-btn { padding: 0.28rem 0.65rem; font-size: 0.8rem; }
    .filter-label { display: none; }

    .grid { grid-template-columns: 1fr; padding: 0.75rem 1rem 3rem; gap: 1.5rem; }
    .card-img-wrap { height: 200px; }

    .modal-overlay { padding: 0; align-items: flex-end; }
    .modal { max-height: 95vh; border-radius: 8px 8px 0 0; }
    .modal-hero-img { height: 220px; }
    .modal-body { padding: 1.25rem 1.25rem 2rem; }
    .modal-title { font-size: 1.55rem; }
  }
`;

const CONTINENT_KEYS = ["all", "asia", "europe", "america", "africa", "oceania"];
const CATEGORY_KEYS = ["all", "culture", "adventure", "nature", "food", "sea"];
const LANG_KEYS = ["it", "en", "fr", "es", "de"];

export default function TravelBlog({ onMap }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { theme, toggle } = useTheme();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeContinent, setActiveContinent] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { fetchPosts(); }, []);
  useEffect(() => { if (menuOpen) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen]);

  async function fetchPosts() {
    setLoading(true); setError(null);
    const { data, error } = await supabase.from("posts").select("*").eq("published", true).order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setPosts(data || []);
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

  const featured = posts.filter(p => p.featured);
  const sideCards = posts.filter(p => !p.featured).slice(0, 3);
  const filtered = posts.filter(p => {
    return (activeContinent === "all" || p.continent === activeContinent) &&
           (activeCategory === "all" || p.category === activeCategory);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    return new Date(year, (month || 1) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  };

  const NavItems = ({ onClick }) => (
    <ul className="nav-links">
      <li><a onClick={() => { setActiveContinent("all"); setActiveCategory("all"); onClick?.(); }}>{t("nav.destinations")}</a></li>
      <li><a onClick={() => { setActiveCategory("culture"); onClick?.(); }}>{t("nav.stories")}</a></li>
      <li><a onClick={() => { setActiveCategory("adventure"); onClick?.(); }}>{t("nav.guides")}</a></li>
      <li><a onClick={() => { onMap?.(); onClick?.(); }}>🗺 Mappa</a></li>
      <li><a href="#">{t("nav.about")}</a></li>
    </ul>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="blog-root">

        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <div className="logo" onClick={() => { setActiveContinent("all"); setActiveCategory("all"); setMenuOpen(false); }}>
              <span>via</span>ggi&middot;lontani
            </div>
            <div className="header-right">
              <NavItems />
              <button className="theme-btn" onClick={toggle} title="Cambia tema">
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <div className="lang-switcher">
                {LANGUAGES.map(l => (
                  <button key={l.code} className={`lang-btn${lang === l.code ? " active" : ""}`} onClick={() => i18n.changeLanguage(l.code)}>
                    {l.flag}
                  </button>
                ))}
              </div>
              <button className="menu-btn" onClick={() => setMenuOpen(o => !o)}>
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        <div className={`mobile-drawer${menuOpen ? " open" : ""}`}>
          <NavItems onClick={() => setMenuOpen(false)} />
          <div className="lang-switcher">
            {LANGUAGES.map(l => (
              <button key={l.code} className={`lang-btn${lang === l.code ? " active" : ""}`} onClick={() => { i18n.changeLanguage(l.code); setMenuOpen(false); }}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
          <div className="theme-row">
            <button className="theme-btn" onClick={() => { toggle(); setMenuOpen(false); }}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <span>{theme === "dark" ? "Tema chiaro" : "Tema scuro"}</span>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="loading"><div className="spinner" /><p className="loading-text">Caricamento articoli…</p></div>
        ) : error ? (
          <div className="error-banner">⚠️ Errore: {error}</div>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="hero">
                {(() => {
                  const tr = getT(featured[0]);
                  return (
                    <div className="hero-featured" onClick={() => setSelectedPost(featured[0])}>
                      <img src={featured[0].image_url} alt={tr.title} />
                      <div className="hero-overlay">
                        <span className="hero-tag">{tr.destination} · {t(`categories.${featured[0].category}`)}</span>
                        <h1 className="hero-title">{tr.title}</h1>
                        <p className="hero-subtitle">{tr.subtitle}</p>
                        <span className="hero-meta">{formatDate(featured[0].date)} · {featured[0].read_time} {t("hero.readTime")}</span>
                      </div>
                    </div>
                  );
                })()}
                <div className="hero-side">
                  {sideCards.map(p => {
                    const tr = getT(p);
                    return (
                      <div key={p.id} className="hero-side-card" onClick={() => setSelectedPost(p)}>
                        <img className="hero-side-img" src={p.image_url} alt={tr.title} />
                        <div className="hero-side-body">
                          <span className="hero-side-cat">{tr.destination} · {t(`categories.${p.category}`)}</span>
                          <h3 className="hero-side-title">{tr.title}</h3>
                          <span className="hero-side-meta">{formatDate(p.date)} · {p.read_time} {t("hero.readTime")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="section-divider">
              <h2>{t("section.allTrips")}</h2>
              <div className="divider-line" />
            </div>

            <div className="filters">
              <span className="filter-label">{t("filter.continent")}</span>
              {CONTINENT_KEYS.map(c => (
                <button key={c} className={`filter-btn${activeContinent === c ? " active" : ""}`} onClick={() => setActiveContinent(c)}>{t(`continents.${c}`)}</button>
              ))}
              <div className="filter-sep" />
              <span className="filter-label">{t("filter.category")}</span>
              {CATEGORY_KEYS.map(c => (
                <button key={c} className={`filter-btn${activeCategory === c ? " active" : ""}`} onClick={() => setActiveCategory(c)}>{t(`categories.${c}`)}</button>
              ))}
            </div>

            <div className="grid">
              {filtered.length === 0 && <div className="empty">{t("empty")}</div>}
              {filtered.map(post => {
                const tr = getT(post);
                return (
                  <article key={post.id} className="card" onClick={() => setSelectedPost(post)}>
                    <div className="card-img-wrap"><img src={post.image_url} alt={tr.title} /></div>
                    <div className="card-cat">{tr.destination} · {t(`categories.${post.category}`)}</div>
                    <h2 className="card-title">{tr.title}</h2>
                    <p className="card-subtitle">{tr.subtitle}</p>
                    <p className="card-excerpt">{tr.excerpt}</p>
                    <div className="card-footer">
                      <div className="card-tags">{(post.tags || []).map(tag => <span key={tag} className="tag">#{tag}</span>)}</div>
                      <span>{post.read_time} {t("hero.readTime")}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <footer className="footer">
          <p>© 2024 <span>viaggi·lontani</span> — {t("footer")}</p>
        </footer>

        {selectedPost && (() => {
          const tr = getT(selectedPost);
          return (
            <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <img className="modal-hero-img" src={selectedPost.image_url} alt={tr.title} />
                <div className="modal-body">
                  <div className="modal-cat">{tr.destination} · {t(`categories.${selectedPost.category}`)}</div>
                  <h2 className="modal-title">{tr.title}</h2>
                  <p className="modal-subtitle">{tr.subtitle}</p>
                  <div className="modal-meta">
                    <span>📅 {formatDate(selectedPost.date)}</span>
                    <span>🌍 {t(`continents.${selectedPost.continent}`)}</span>
                    <span>⏱ {selectedPost.read_time} {t("modal.read")}</span>
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
