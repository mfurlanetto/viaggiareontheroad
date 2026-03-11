import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./i18n";
import { supabase } from "./supabaseClient";

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
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #faf8f5; }
  .blog-root { font-family: 'Crimson Pro', Georgia, serif; background: #faf8f5; min-height: 100vh; color: #1a1a18; }

  /* HEADER */
  .header { background: #1a1a18; color: #faf8f5; padding: 0 2rem; position: sticky; top: 0; z-index: 100; }
  .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .logo { font-family: 'Playfair Display', serif; font-size: 1.5rem; letter-spacing: 0.02em; color: #e8c87a; cursor: pointer; }
  .logo span { color: #faf8f5; font-style: italic; }
  .header-right { display: flex; align-items: center; gap: 1.5rem; }
  .nav-links { display: flex; gap: 2rem; list-style: none; font-size: 0.85rem; letter-spacing: 0.08em; text-transform: uppercase; }
  .nav-links a { color: #aaa; text-decoration: none; transition: color 0.2s; cursor: pointer; }
  .nav-links a:hover { color: #e8c87a; }
  .lang-switcher { display: flex; gap: 0.3rem; align-items: center; border-left: 1px solid #333; padding-left: 1.25rem; }
  .lang-btn { background: transparent; border: 1px solid transparent; color: #666; font-family: 'Crimson Pro', serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; padding: 0.2rem 0.45rem; border-radius: 2px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.25rem; }
  .lang-btn:hover { color: #e8c87a; border-color: #444; }
  .lang-btn.active { background: #e8c87a; color: #1a1a18; border-color: #e8c87a; }

  /* LOADING */
  .loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; flex-direction: column; gap: 1rem; }
  .spinner { width: 40px; height: 40px; border: 3px solid #e8e0d0; border-top-color: #c9a84c; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: #888; font-style: italic; }
  .error-banner { max-width: 1200px; margin: 2rem auto; padding: 1rem 2rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404; font-size: 0.9rem; }

  /* HERO */
  .hero { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  .hero-featured { position: relative; border-radius: 4px; overflow: hidden; cursor: pointer; height: 500px; }
  .hero-featured img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
  .hero-featured:hover img { transform: scale(1.03); }
  .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 2rem; }
  .hero-tag { display: inline-block; background: #e8c87a; color: #1a1a18; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.25rem 0.75rem; margin-bottom: 0.75rem; width: fit-content; }
  .hero-title { font-family: 'Playfair Display', serif; font-size: 2rem; color: #fff; line-height: 1.2; margin-bottom: 0.4rem; }
  .hero-subtitle { font-size: 1rem; color: rgba(255,255,255,0.7); font-style: italic; margin-bottom: 0.75rem; }
  .hero-meta { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
  .hero-side { display: flex; flex-direction: column; gap: 1.25rem; }
  .hero-side-card { display: flex; gap: 1rem; cursor: pointer; padding: 0.75rem; border-radius: 4px; transition: background 0.2s; border: 1px solid transparent; }
  .hero-side-card:hover { background: #f0ece4; border-color: #e0d8c8; }
  .hero-side-img { width: 110px; height: 80px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
  .hero-side-body { display: flex; flex-direction: column; justify-content: center; }
  .hero-side-cat { font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: #c9a84c; font-weight: 600; margin-bottom: 0.3rem; }
  .hero-side-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; line-height: 1.3; color: #1a1a18; margin-bottom: 0.25rem; }
  .hero-side-meta { font-size: 0.75rem; color: #888; }

  .section-divider { max-width: 1200px; margin: 2.5rem auto 0; padding: 0 2rem; display: flex; align-items: center; gap: 1.5rem; }
  .section-divider h2 { font-family: 'Playfair Display', serif; font-size: 1.4rem; white-space: nowrap; }
  .divider-line { flex: 1; height: 1px; background: #ddd; }

  /* FILTERS */
  .filters { max-width: 1200px; margin: 0 auto; padding: 1.25rem 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
  .filter-label { font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #888; margin-right: 0.25rem; }
  .filter-btn { padding: 0.35rem 1rem; border: 1px solid #d0c8b8; background: transparent; font-family: 'Crimson Pro', serif; font-size: 0.88rem; color: #555; cursor: pointer; border-radius: 2px; transition: all 0.2s; }
  .filter-btn:hover { border-color: #1a1a18; color: #1a1a18; }
  .filter-btn.active { background: #1a1a18; color: #e8c87a; border-color: #1a1a18; }
  .filter-sep { width: 1px; height: 24px; background: #ddd; margin: 0 0.5rem; }

  /* GRID */
  .grid { max-width: 1200px; margin: 0 auto; padding: 1.5rem 2rem 4rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
  .card { cursor: pointer; }
  .card-img-wrap { overflow: hidden; border-radius: 3px; height: 220px; margin-bottom: 1rem; }
  .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .card:hover .card-img-wrap img { transform: scale(1.05); }
  .card-cat { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: #c9a84c; font-weight: 600; margin-bottom: 0.4rem; }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1.25rem; line-height: 1.3; margin-bottom: 0.25rem; color: #1a1a18; transition: color 0.2s; }
  .card:hover .card-title { color: #c9a84c; }
  .card-subtitle { font-size: 0.9rem; color: #888; font-style: italic; margin-bottom: 0.6rem; }
  .card-excerpt { font-size: 0.92rem; color: #555; line-height: 1.6; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #aaa; border-top: 1px solid #e8e0d0; padding-top: 0.75rem; }
  .card-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .tag { background: #f0ece4; color: #777; padding: 0.15rem 0.5rem; font-size: 0.7rem; border-radius: 2px; }

  /* ARTICLE MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(10,10,8,0.85); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 2rem; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  .modal { background: #faf8f5; max-width: 720px; width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 4px; animation: slideUp 0.35s ease; }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  .modal-hero-img { width: 100%; height: 320px; object-fit: cover; }
  .modal-body { padding: 2.5rem; }
  .modal-cat { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #c9a84c; font-weight: 600; margin-bottom: 0.5rem; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 2.2rem; line-height: 1.2; margin-bottom: 0.4rem; }
  .modal-subtitle { font-size: 1.1rem; color: #777; font-style: italic; margin-bottom: 1.25rem; }
  .modal-meta { display: flex; gap: 1.5rem; font-size: 0.8rem; color: #aaa; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e8e0d0; flex-wrap: wrap; }
  .modal-text { font-size: 1.05rem; line-height: 1.9; color: #333; white-space: pre-line; }
  .modal-close { display: block; margin: 2rem auto 0; padding: 0.75rem 2.5rem; background: #1a1a18; color: #e8c87a; border: none; font-family: 'Crimson Pro', serif; font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: background 0.2s; }
  .modal-close:hover { background: #333; }

  .empty { grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: #aaa; font-style: italic; font-size: 1.1rem; }
  .footer { background: #1a1a18; color: #666; text-align: center; padding: 2rem; font-size: 0.8rem; letter-spacing: 0.05em; }
  .footer span { color: #e8c87a; }
`;

const CONTINENT_KEYS = ["all", "asia", "europe", "america", "africa", "oceania"];
const CATEGORY_KEYS = ["all", "culture", "adventure", "nature", "food", "sea"];
const LANG_KEYS = ["it", "en", "fr", "es", "de"];

export default function TravelBlog({ onMap }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeContinent, setActiveContinent] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
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
    const byC = activeContinent === "all" || p.continent === activeContinent;
    const byCat = activeCategory === "all" || p.category === activeCategory;
    return byC && byCat;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    return new Date(year, (month || 1) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="blog-root">

        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <div className="logo" onClick={() => { setActiveContinent("all"); setActiveCategory("all"); }}>
              <span>via</span>ggi&middot;lontani
            </div>
            <div className="header-right">
              <nav>
                <ul className="nav-links">
                  <li><a onClick={() => { setActiveContinent("all"); setActiveCategory("all"); }}>{t("nav.destinations")}</a></li>
                  <li><a onClick={() => setActiveCategory("culture")}>{t("nav.stories")}</a></li>
                  <li><a onClick={() => setActiveCategory("adventure")}>{t("nav.guides")}</a></li>
                  <li><a onClick={() => onMap && onMap()}>🗺 Mappa</a></li>
                  <li><a href="#">{t("nav.about")}</a></li>
                </ul>
              </nav>
              <div className="lang-switcher">
                {LANGUAGES.map(l => (
                  <button key={l.code} className={`lang-btn${lang === l.code ? " active" : ""}`} onClick={() => i18n.changeLanguage(l.code)}>
                    <span>{l.flag}</span>{l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p className="loading-text">Caricamento articoli…</p>
          </div>
        ) : error ? (
          <div className="error-banner">⚠️ Errore: {error}</div>
        ) : (
          <>
            {/* HERO */}
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
                        <span className="hero-meta">{formatDate(featured[0].date)} &nbsp;·&nbsp; {featured[0].read_time} {t("hero.readTime")}</span>
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

            {/* SECTION TITLE */}
            <div className="section-divider">
              <h2>{t("section.allTrips")}</h2>
              <div className="divider-line" />
            </div>

            {/* FILTERS */}
            <div className="filters">
              <span className="filter-label">{t("filter.continent")}</span>
              {CONTINENT_KEYS.map(c => (
                <button key={c} className={`filter-btn${activeContinent === c ? " active" : ""}`} onClick={() => setActiveContinent(c)}>
                  {t(`continents.${c}`)}
                </button>
              ))}
              <div className="filter-sep" />
              <span className="filter-label">{t("filter.category")}</span>
              {CATEGORY_KEYS.map(c => (
                <button key={c} className={`filter-btn${activeCategory === c ? " active" : ""}`} onClick={() => setActiveCategory(c)}>
                  {t(`categories.${c}`)}
                </button>
              ))}
            </div>

            {/* GRID */}
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

        {/* FOOTER */}
        <footer className="footer">
          <p>© 2024 <span>viaggi·lontani</span> — {t("footer")}</p>
        </footer>

        {/* ARTICLE MODAL */}
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
