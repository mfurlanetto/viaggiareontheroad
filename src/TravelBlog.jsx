import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./styles/blog.css";
import { fetchPublishedPosts, fetchPostDaysAndImages } from "./postsApi";
import { usePostBody } from "./usePostBody";
import { useTheme } from "./useTheme";
import { responsiveImage, IMG } from "./images";
import { pathFor, postKey, navigateTo, cameFromApp, linkProps } from "./router";
import { setPageMeta } from "./head";
import { postText, formatMonth, dayAnchor } from "./content";
import { CONTACT_EMAIL } from "./config";
import SiteHeader from "./components/SiteHeader";
import AboutPage from "./components/AboutPage";
import PrivacyPage from "./components/PrivacyPage";
import ArticleDays from "./components/ArticleDays";
import Lightbox from "./components/Lightbox";

const CAROUSEL_INTERVAL = 4500;
const PAGE_SIZE = 6;

// Con "riduci movimento" attivo il carosello non scorre da solo.
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function TravelBlog({ route }) {
  const { t } = useTranslation();
  const lang = route.lang;
  const { theme, toggle } = useTheme();

  // ── state ──
  const [posts,           setPosts]          = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [error,           setError]          = useState(null);
  const [activeContinent, setActiveContinent]= useState("all");
  // Categoria iniziale passata da un'altra pagina (es. "Storie" dalla mappa)
  const [activeCategory,  setActiveCategory] = useState(() => window.history.state?.category || "all");
  const [menuOpen,        setMenuOpen]       = useState(false);
  // La pagina corrente e' legata ai filtri con cui e' stata scelta: se i filtri
  // cambiano, la pagina torna a 1 senza bisogno di un effect.
  const [pageState,       setPageState]      = useState({ key: "all|all", page: 1 });

  // giorni e foto dell'articolo aperto (marcati con il post a cui appartengono)
  const [extra, setExtra] = useState({ postId: null, days: [], images: [] });
  // foto a schermo intero: elenco mostrato e indice corrente (null = chiuso)
  const [lightbox, setLightbox] = useState(null);
  const galleryOpen = !!lightbox;
  const setGalleryOpen = (open) => { if (!open) setLightbox(null); };

  // Pagina e articolo aperto derivano dall'URL (route), non da stato interno:
  // /articoli/<slug> = blog con l'articolo aperto; indietro/avanti funzionano.
  const page = route.name === "about" ? "about" : route.name === "privacy" ? "privacy" : "blog";
  const articleSlug = route.name === "article" ? route.slug : null;
  const selectedPost = articleSlug ? (posts.find(p => postKey(p) === articleSlug) || null) : null;
  const articleMissing = !!articleSlug && !loading && !error && !selectedPost;
  const pageNotFound = route.name === "notfound";
  const loaded = selectedPost && extra.postId === selectedPost.id;
  const postDays = loaded ? extra.days : [];
  const postImages = loaded ? extra.images : [];
  // articolo aperto con testo completo (caricato solo all'apertura)
  const [openPost, bodyStatus] = usePostBody(selectedPost);

  // carosello
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [paused,      setPaused]      = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [reducedMotion] = useState(prefersReducedMotion);
  const touchStartX = useRef(null);
  const gridRef     = useRef(null);
  const modalRef    = useRef(null);
  const lastFocus   = useRef(null);

  // ── dati ──
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      const { data, error } = await fetchPublishedPosts();
      if (error) setError(error.message);
      else setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  // giorni e foto quando si apre un articolo
  useEffect(() => {
    if (!selectedPost) return;
    let cancelled = false; // ignora risposte di un post gia' chiuso o sostituito
    fetchPostDaysAndImages(selectedPost.id).then(({ days, images }) => {
      if (!cancelled) setExtra({ postId: selectedPost.id, days, images });
    });
    return () => { cancelled = true; };
  }, [selectedPost]);

  // Vai al giorno N dentro la finestra dell'articolo e aggiorna #giorno-N nell'URL
  // (replaceState: non aggiunge passi alla cronologia).
  const jumpToDay = useCallback((n, { smooth = true } = {}) => {
    const el = document.getElementById(dayAnchor(n));
    if (!el) return;
    el.scrollIntoView({ behavior: smooth && !reducedMotion ? "smooth" : "auto", block: "start" });
    const url = window.location.pathname + "#" + dayAnchor(n);
    window.history.replaceState(window.history.state, "", url);
  }, [reducedMotion]);

  // Link diretto a un giorno (/articoli/<slug>#giorno-3): quando i giorni sono
  // caricati si scorre fino a quel giorno.
  const daysReady = loaded && postDays.length > 0;
  useEffect(() => {
    if (!daysReady) return;
    const m = window.location.hash.match(/^#giorno-(\d+)$/);
    if (m) requestAnimationFrame(() => jumpToDay(Number(m[1]), { smooth: false }));
  }, [daysReady, jumpToDay]);

  // blocca lo scroll della pagina con articolo o menu aperti
  useEffect(() => {
    document.body.style.overflow = (selectedPost || menuOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedPost, menuOpen]);

  // Focus: all'apertura dell'articolo va sulla finestra, alla chiusura torna
  // all'elemento da cui era partito (es. la card).
  const isOpen = !!openPost;
  useEffect(() => {
    if (!isOpen) return;
    lastFocus.current = document.activeElement;
    modalRef.current?.focus();
    return () => {
      const el = lastFocus.current;
      if (el && document.contains(el)) el.focus({ preventScroll: true });
    };
  }, [isOpen]);

  // Pagina corrente: vale solo se scelta con i filtri attuali, altrimenti 1
  const filterKey   = `${activeContinent}|${activeCategory}`;
  const currentPage = pageState.key === filterKey ? pageState.page : 1;

  // ── navigazione ──
  // "blog" con categoria (es. "Storie" = cultura): i filtri si impostano qui,
  // in un solo punto, cosi' non si sovrascrivono.
  const goBlog = useCallback((category = "all") => {
    navigateTo(pathFor.home(lang));
    setMenuOpen(false);
    setGalleryOpen(false);
    setActiveContinent("all");
    setActiveCategory(category);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [lang]);
  const goPage = (target) => {
    navigateTo(target === "about" ? pathFor.about(lang) : pathFor.privacy(lang));
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const openArticle = (post) => navigateTo(pathFor.article(lang, postKey(post)));
  // Chiudere un articolo aperto dall'interno del sito torna indietro nella
  // cronologia (conserva lo scroll); se si e' arrivati direttamente dal link,
  // si sostituisce l'URL con la home.
  const closeArticle = useCallback(() => {
    setGalleryOpen(false);
    if (cameFromApp()) window.history.back();
    else navigateTo(pathFor.home(lang), { replace: true });
  }, [lang]);

  // Esc chiude prima la galleria, poi l'articolo.
  useEffect(() => {
    if (!selectedPost) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (galleryOpen) setGalleryOpen(false); else closeArticle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPost, galleryOpen, closeArticle]);

  // Titolo, descrizione, canonical e lingua della pagina corrente.
  useEffect(() => {
    const base = { lang };
    if (selectedPost) {
      const tr = postText(selectedPost, lang);
      setPageMeta({ ...base, title: tr.title, description: tr.excerpt, path: pathFor.article(lang, postKey(selectedPost)) });
    } else if (page === "about") setPageMeta({ ...base, title: t("meta.aboutTitle"), description: t("meta.aboutDescription"), path: pathFor.about(lang) });
    else if (page === "privacy") setPageMeta({ ...base, title: t("meta.privacyTitle"), description: t("meta.privacyDescription"), path: pathFor.privacy(lang) });
    else if (pageNotFound || articleMissing) setPageMeta({ ...base, title: t("meta.notFoundTitle"), description: t("meta.siteDescription"), path: window.location.pathname });
    else if (!articleSlug) setPageMeta({ ...base, description: t("meta.siteDescription"), path: pathFor.home(lang) });
  }, [selectedPost, page, pageNotFound, articleMissing, articleSlug, lang, t]);

  // ── dati derivati ──
  const continentKeys = ["all", ...Array.from(new Set(posts.map(p => p.continent).filter(Boolean))).sort()];
  const categoryKeys  = ["all", ...Array.from(new Set(posts.map(p => p.category).filter(Boolean))).sort()];

  const carouselPosts = [
    ...posts.filter(p => p.featured),
    ...posts.filter(p => !p.featured),
  ].slice(0, 6);

  const filtered = posts.filter(p =>
    (activeContinent === "all" || p.continent === activeContinent) &&
    (activeCategory  === "all" || p.category  === activeCategory)
  );

  // ── paginazione ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (p) => {
    setPageState({ key: filterKey, page: p });
    if (gridRef.current) gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── carosello ──
  const goTo = useCallback((idx) => {
    setCarouselIdx((idx + carouselPosts.length) % carouselPosts.length);
  }, [carouselPosts.length]);
  const next = useCallback(() => goTo(carouselIdx + 1), [carouselIdx, goTo]);
  const prev = useCallback(() => goTo(carouselIdx - 1), [carouselIdx, goTo]);

  // L'avanzamento automatico e' guidato dall'animazione CSS della barra di
  // progresso (onAnimationEnd). Si ferma con mouse sopra, focus da tastiera
  // dentro il carosello, articolo aperto o "riduci movimento".
  const autoplay = !paused && !focusInside && !reducedMotion && !selectedPost && carouselPosts.length > 1;

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { if (diff > 0) next(); else prev(); }
    touchStartX.current = null;
  };

  // ── render ──
  return (
    <div className="page-root">
      <SiteHeader
        route={route}
        current={page === "about" ? "about" : page === "blog" ? "blog" : null}
        theme={theme}
        onToggleTheme={toggle}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onBlog={goBlog}
      />

      <main id="main" className="page-main" tabIndex={-1}>
        {page === "about" && <AboutPage onBack={() => goBlog()} posts={posts} />}
        {page === "privacy" && <PrivacyPage onBack={() => goBlog()} />}

        {page === "blog" && (
          loading ? (
            <div className="loading" role="status">
              <div className="spinner" aria-hidden="true" />
              <p className="loading-text">{t("loading")}</p>
            </div>
          ) : error ? (
            <div className="error-banner" role="alert">⚠️ {t("error")} {error}</div>
          ) : (
            <>
              <h1 className="sr-only">{t("home.heading")}</h1>

              {(articleMissing || pageNotFound) && (
                <div className="error-banner" role="alert">
                  {articleMissing ? t("notFound.article") : t("notFound.page")}{" "}
                  <a {...linkProps(pathFor.home(lang), () => goBlog())}>{t("notFound.back")}</a>
                </div>
              )}

              {/* CAROSELLO */}
              {carouselPosts.length > 0 && (
                <section className="carousel-wrap" aria-roledescription="carousel" aria-label={t("a11y.carousel")}>
                  <div
                    className="carousel"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setFocusInside(true)}
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocusInside(false); }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                  >
                    <div className="carousel-track" style={{ transform: `translateX(-${carouselIdx * 100}%)` }}>
                      {carouselPosts.map((post, i) => {
                        const tr = postText(post, lang);
                        const visible = i === carouselIdx;
                        return (
                          <div
                            key={post.id}
                            className="carousel-slide"
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} / ${carouselPosts.length}`}
                            aria-hidden={!visible}
                            inert={!visible}
                            onClick={() => openArticle(post)}
                          >
                            <img {...responsiveImage(post.image_url, ...IMG.hero, post.image_thumb_url)} alt=""
                              width="1200" height="520" decoding="async"
                              loading={i === 0 ? "eager" : "lazy"}
                              fetchPriority={i === 0 ? "high" : "auto"} />
                            <div className="hero-overlay">
                              <span className="hero-tag">{tr.destination} · {t(`categories.${post.category}`)}</span>
                              <h2 className="hero-title">
                                <a {...linkProps(pathFor.article(lang, postKey(post)), () => openArticle(post))}>{tr.title}</a>
                              </h2>
                              <p className="hero-subtitle">{tr.subtitle}</p>
                              <span className="hero-meta">{formatMonth(post.date, lang)} · {post.read_time} {t("hero.readTime")}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button className="carousel-arrow prev" aria-label={t("a11y.prevSlide")}
                      onClick={e => { e.stopPropagation(); prev(); }}><span aria-hidden="true">&#8592;</span></button>
                    <button className="carousel-arrow next" aria-label={t("a11y.nextSlide")}
                      onClick={e => { e.stopPropagation(); next(); }}><span aria-hidden="true">&#8594;</span></button>

                    <div className="carousel-dots">
                      {carouselPosts.map((_, i) => (
                        <button
                          key={i}
                          className={`carousel-dot${i === carouselIdx ? " active" : ""}`}
                          aria-label={t("a11y.goToSlide", { n: i + 1 })}
                          aria-current={i === carouselIdx ? "true" : undefined}
                          onClick={e => { e.stopPropagation(); goTo(i); }}
                        />
                      ))}
                    </div>

                    {/* key = slide corrente: a ogni cambio l'animazione riparte da zero */}
                    {autoplay && (
                      <div
                        key={carouselIdx}
                        className="carousel-progress"
                        aria-hidden="true"
                        style={{ animationDuration: `${CAROUSEL_INTERVAL}ms` }}
                        onAnimationEnd={next}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* TITOLO SEZIONE */}
              <div className="section-divider">
                <h2>{t("section.allTrips")}</h2>
                <div className="divider-line" />
              </div>

              {/* FILTRI */}
              <div className="filters" role="group" aria-label={t("a11y.filters")}>
                <span className="filter-label" id="filter-continent">{t("filter.continent")}</span>
                <div className="filter-group" role="group" aria-labelledby="filter-continent">
                  {continentKeys.map(c => (
                    <button
                      key={c}
                      className={`filter-btn${activeContinent === c ? " active" : ""}`}
                      aria-pressed={activeContinent === c}
                      onClick={() => setActiveContinent(c)}
                    >{t(`continents.${c}`)}</button>
                  ))}
                </div>
                <div className="filter-sep" aria-hidden="true" />
                <span className="filter-label" id="filter-category">{t("filter.category")}</span>
                <div className="filter-group" role="group" aria-labelledby="filter-category">
                  {categoryKeys.map(c => (
                    <button
                      key={c}
                      className={`filter-btn${activeCategory === c ? " active" : ""}`}
                      aria-pressed={activeCategory === c}
                      onClick={() => setActiveCategory(c)}
                    >{t(`categories.${c}`)}</button>
                  ))}
                </div>
              </div>

              {/* GRIGLIA */}
              <div className="grid" ref={gridRef} aria-live="polite">
                {filtered.length === 0 && <div className="empty">{t("empty")}</div>}
                {paginated.map(post => {
                  const tr = postText(post, lang);
                  return (
                    <article key={post.id} className="card" onClick={() => openArticle(post)}>
                      <div className="card-img-wrap">
                        <img {...responsiveImage(post.image_url, ...IMG.card, post.image_thumb_url)} alt=""
                          width="400" height="215" loading="lazy" decoding="async" />
                      </div>
                      <div className="card-cat">{tr.destination} · {t(`categories.${post.category}`)}</div>
                      <h3 className="card-title">
                        <a {...linkProps(pathFor.article(lang, postKey(post)), () => openArticle(post))}>{tr.title}</a>
                      </h3>
                      <p className="card-subtitle">{tr.subtitle}</p>
                      <p className="card-excerpt">{tr.excerpt}</p>
                      <div className="card-footer">
                        <div className="card-tags">
                          {(post.tags || []).map(tag => <span key={tag} className="tag">#{tag}</span>)}
                        </div>
                        <span>{post.read_time} {t("hero.readTime")}</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* PAGINAZIONE */}
              {totalPages > 1 && (() => {
                // Prima, ultima, corrente e vicine; il resto diventa "…"
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) pages.push(i);
                  else if (pages[pages.length - 1] !== "…") pages.push("…");
                }
                return (
                  <nav className="pagination" aria-label={t("a11y.pagination")}>
                    <button className="page-btn prev-next" onClick={() => goToPage(safePage - 1)}
                      disabled={safePage === 1} aria-label={t("a11y.prevPage")}>←</button>
                    {pages.map((p, i) =>
                      p === "…"
                        ? <span key={`dots-${i}`} className="page-dots" aria-hidden="true">…</span>
                        : <button
                            key={p}
                            className={`page-btn${p === safePage ? " active" : ""}`}
                            onClick={() => goToPage(p)}
                            aria-label={t("a11y.pageN", { n: p })}
                            aria-current={p === safePage ? "page" : undefined}
                          >{p}</button>
                    )}
                    <button className="page-btn prev-next" onClick={() => goToPage(safePage + 1)}
                      disabled={safePage === totalPages} aria-label={t("a11y.nextPage")}>→</button>
                  </nav>
                );
              })()}
            </>
          )
        )}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo"><em>viaggiare</em>·ontheroad</div>
            <p className="footer-tagline">{t("footer.tagline")}</p>
          </div>
          <nav className="footer-col" aria-labelledby="footer-explore">
            <h2 className="footer-heading" id="footer-explore">{t("footer.explore")}</h2>
            <ul>
              <li><a {...linkProps(pathFor.home(lang), () => goBlog())}>{t("footer.allTrips")}</a></li>
              <li><a {...linkProps(pathFor.map(lang))}>{t("footer.interactiveMap")}</a></li>
              <li><a {...linkProps(pathFor.home(lang), () => goBlog("culture"))}>{t("categories.culture")}</a></li>
              <li><a {...linkProps(pathFor.home(lang), () => goBlog("nature"))}>{t("categories.nature")}</a></li>
            </ul>
          </nav>
          <nav className="footer-col" aria-labelledby="footer-project">
            <h2 className="footer-heading" id="footer-project">{t("footer.project")}</h2>
            <ul>
              <li><a {...linkProps(pathFor.about(lang), () => goPage("about"))}>{t("nav.about")}</a></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`}>{t("footer.contacts")}</a></li>
              <li><a {...linkProps(pathFor.privacy(lang), () => goPage("privacy"))}>{t("footer.privacy")}</a></li>
            </ul>
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="brand">© {new Date().getFullYear()} viaggiare·ontheroad · {t("footer.somePhotos")} <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a></span>
          <a {...linkProps(pathFor.privacy(lang), () => goPage("privacy"))}>{t("footer.privacy")}</a>
        </div>
      </footer>

      {/* ── ARTICOLO ── */}
      {openPost && (() => {
        const post = openPost; // con il testo completo, se gia' caricato
        const tr = postText(post, lang);
        return (
          <div className="modal-overlay" onClick={closeArticle}>
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="article-title"
              tabIndex={-1}
              ref={modalRef}
              onClick={e => e.stopPropagation()}
            >
              <img className="modal-hero-img" {...responsiveImage(post.image_url, ...IMG.modal, post.image_thumb_url)} alt=""
                width="720" height="300" decoding="async" />
              <div className="modal-body">
                <div className="modal-cat">{tr.destination} · {t(`categories.${post.category}`)}</div>
                <h1 className="modal-title" id="article-title">{tr.title}</h1>
                <p className="modal-subtitle">{tr.subtitle}</p>
                <div className="modal-meta">
                  <span><span aria-hidden="true">📅 </span>{formatMonth(post.date, lang)}</span>
                  <span><span aria-hidden="true">🌍 </span>{t(`continents.${post.continent}`)}</span>
                  <span><span aria-hidden="true">⏱ </span>{post.read_time} {t("hero.readTime")}</span>
                </div>
                {bodyStatus === "loading" && <p className="modal-text modal-status" role="status">{t("modal.loadingText")}</p>}
                {bodyStatus === "error" && <p className="modal-text modal-status" role="alert">{t("modal.errorText")}</p>}
                {bodyStatus === "ready" && <p className="modal-text">{tr.body}</p>}

                <ArticleDays
                  days={postDays}
                  images={postImages}
                  lang={lang}
                  onOpenPhotos={(photos, index) => setLightbox({ photos, index })}
                  onJump={(n) => jumpToDay(n)}
                />

                <button className="modal-close" onClick={closeArticle}>{t("modal.back")}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          setIndex={(index) => setLightbox(l => ({ ...l, index }))}
          onClose={() => setLightbox(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
