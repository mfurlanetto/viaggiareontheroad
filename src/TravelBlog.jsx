import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./i18n";
import { supabase } from "./supabaseClient";
import { useTheme } from "./useTheme";

// ─────────────────────────────────────────────
// CONSTANTS (module scope — never recreated)
// ─────────────────────────────────────────────
const LANGUAGES = [
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];
const LANG_KEYS      = ["it", "en", "fr", "es", "de"];
const CAROUSEL_INTERVAL = 4500;

// Inject fonts once at module load
const _font = document.createElement("link");
_font.rel  = "stylesheet";
_font.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap";
if (!document.querySelector('link[href*="Playfair"]')) document.head.appendChild(_font);

// ─────────────────────────────────────────────
// STATIC PAGE COMPONENTS (outside TravelBlog)
// These never re-mount because their identity is stable.
// ─────────────────────────────────────────────

function AboutPage({ onBack, posts }) {
  const countries   = new Set(posts.map(p => p.destination_it || p.destination_en)).size;
  const continents  = new Set(posts.map(p => p.continent)).size;
  const kmLabel     = posts.length > 0 ? `${Math.round(posts.length * 8.4)}k` : "—";

  return (
    <div className="about-wrap">
      <button className="back-btn" onClick={onBack}>← Torna al blog</button>

      <div className="about-eyebrow">Il progetto</div>
      <h1 className="about-title">
        Un blog nato dalla<br /><em>nostalgia del movimento</em>
      </h1>
      <p className="about-intro">
        Ogni viaggio lascia qualcosa che non si porta a casa con i bagagli.
        Questi racconti sono il tentativo di custodire quelle cose — la luce
        di un tramonto a Kyoto, il rumore del mercato di Marrakech, il silenzio
        di un fiordo islandese alle tre di notte.
      </p>

      <img
        className="about-photo"
        src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=80"
        alt="Viaggiatore con zaino guarda un panorama montano"
      />

      <div className="about-stats">
        {[
          { num: posts.length, label: "Racconti" },
          { num: countries,    label: "Paesi" },
          { num: continents,   label: "Continenti" },
          { num: kmLabel,      label: "Km stimati" },
        ].map(s => (
          <div key={s.label}>
            <div className="about-stat-num">{s.num}</div>
            <div className="about-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="about-body">
        <p>Sono un viaggiatore lento. Preferisco restare tre settimane in un posto
        e capirci qualcosa, anziché fotografare dieci città in dieci giorni. Questo
        blog è il diario di quella lentezza — scritto per chi vuole viaggiare con
        intenzione, non con fretta.</p>
        <p>Ogni articolo è scritto dopo il viaggio, non durante. Lascio sedimentare
        le impressioni, aspetto che la stanchezza passi e rimanga solo quello che
        conta davvero. Non troverai "i 10 posti da non perdere" — troverai storie
        vere, con i dettagli brutti e quelli belli.</p>
      </div>

      <div className="about-values">
        {[
          { icon: "🐢", title: "Viaggi lenti",     text: "Un luogo alla volta, con tutto il tempo per capirlo davvero." },
          { icon: "✍️", title: "Scrittura onesta",  text: "Niente filtri o sponsor nascosti. Solo quello che ho vissuto." },
          { icon: "🌍", title: "Rispetto locale",   text: "Ogni posto ha una cultura. L'obiettivo è osservarla, non consumarla." },
          { icon: "📷", title: "Foto proprie",      text: "Tutte le immagini sono scattate sul posto. Nessuna stock photo." },
        ].map(v => (
          <div key={v.title} className="about-value-card">
            <div className="about-value-icon">{v.icon}</div>
            <div className="about-value-title">{v.title}</div>
            <p className="about-value-text">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="about-body">
        <p>Hai domande su un viaggio? Vuoi collaborare? Scrivimi — rispondo a tutti.</p>
      </div>
      <a className="about-contact-btn" href="mailto:ciao@viaggilontani.it">Scrivimi ✉️</a>
    </div>
  );
}

function PrivacyPage({ onBack }) {
  return (
    <div className="privacy-wrap">
      <button className="back-btn" onClick={onBack}>← Torna al blog</button>
      <h1>Privacy Policy</h1>
      <p className="updated">Ultimo aggiornamento: marzo 2025</p>

      <h2>1. Titolare del trattamento</h2>
      <p>Il blog <strong>viaggiare·ontheroad</strong> è gestito a titolo personale.
        Contatto: <a href="mailto:ciao@viaggilontani.it">ciao@viaggilontani.it</a></p>

      <h2>2. Dati raccolti</h2>
      <p>Questo sito non raccoglie dati personali tramite form o registrazione.
        I contenuti sono ospitati su <strong>Supabase</strong> (USA), che raccoglie
        dati tecnici di accesso (IP, timestamp) per sicurezza e monitoraggio.</p>

      <h2>3. Cookie</h2>
      <p>Il sito usa esclusivamente <strong>localStorage</strong> per salvare
        la preferenza di lingua e tema. Nessun dato viene inviato a server esterni.
        Non vengono usati cookie di tracciamento, pubblicitari o di terze parti.</p>

      <h2>4. Hosting</h2>
      <p>Il sito è ospitato su <strong>Vercel</strong> (USA), che raccoglie log
        tecnici anonimi per garantire il funzionamento del servizio.</p>

      <h2>5. Diritti (GDPR)</h2>
      <p>Ai sensi del Reg. UE 2016/679 hai diritto di accesso, rettifica,
        cancellazione e opposizione. Scrivi a <a href="mailto:ciao@viaggilontani.it">ciao@viaggilontani.it</a>.</p>

      <h2>6. Modifiche</h2>
      <p>Questa policy può essere aggiornata. Le modifiche saranno visibili
        su questa pagina con la data in cima.</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// CSS (module scope — injected once)
// ─────────────────────────────────────────────
const STYLES = `
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
    --filter-border: #cdc5b5;
    --divider:       #ddd8d0;
    --card-hover-bg: #f4f0e8;
    --footer-bg:     #1a1a18;
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
    --filter-border: #353533;
    --divider:       #2a2a28;
    --card-hover-bg: #1e1e1c;
    --footer-bg:     #0a0a08;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); }

  .blog-root {
    font-family: 'Lato', -apple-system, sans-serif;
    font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
    line-height: 1.65;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    transition: background 0.3s, color 0.3s;
  }

  /* ── HEADER ── */
  .header {
    background: var(--header-bg);
    padding: 0 2rem;
    position: sticky; top: 0; z-index: 200;
    border-bottom: 1px solid var(--header-border);
  }
  .header-inner {
    max-width: 1200px; margin: 0 auto;
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

  /* nav links — desktop only */
  .nav-list {
    display: flex; gap: 1.5rem; list-style: none;
    font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .nav-list li a {
    color: #888; text-decoration: none;
    cursor: pointer; white-space: nowrap;
    transition: color 0.2s; padding: 0.25rem 0;
    /* large tap target without changing layout */
    display: inline-block;
  }
  .nav-list li a:hover { color: var(--gold-light); }

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
  .lang-btn:hover { color: var(--gold-light); border-color: #444; }
  .lang-btn.active { background: var(--gold-btn); color: #1a1a18; border-color: var(--gold-btn); }

  .menu-btn {
    display: none; background: transparent; border: none;
    color: #888; font-size: 1.5rem; cursor: pointer;
    padding: 0.25rem; line-height: 1; min-width: 36px; min-height: 36px;
    align-items: center; justify-content: center;
  }

  /* ── MOBILE DRAWER ── */
  /* Always in the DOM; shown/hidden via opacity + pointer-events.
     This avoids any React unmount/remount that could steal focus. */
  .mobile-drawer {
    position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
    background: var(--header-bg);
    z-index: 199;                    /* below header (200) */
    display: flex; flex-direction: column;
    padding: 2rem; gap: 1.75rem;
    border-top: 1px solid var(--header-border);
    overflow-y: auto;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .mobile-drawer.open {
    opacity: 1; pointer-events: auto; transform: translateY(0);
  }
  /* drawer nav — same list but bigger and vertical */
  .mobile-drawer .nav-list {
    flex-direction: column; gap: 0; display: flex !important;
  }
  .mobile-drawer .nav-list li a {
    font-size: 1.1rem; color: #bbb;
    padding: 0.75rem 0;
    display: block;
    border-bottom: 1px solid var(--header-border);
  }
  .mobile-drawer .nav-list li:last-child a { border-bottom: none; }
  .mobile-drawer .nav-list li a:hover { color: var(--gold-light); }
  .mobile-drawer .lang-switcher {
    border-left: none; padding-left: 0;
    border-top: 1px solid var(--header-border);
    padding-top: 1.25rem; flex-wrap: wrap; gap: 0.4rem;
  }
  .mobile-drawer .theme-row {
    display: flex; align-items: center; gap: 0.75rem;
    color: #666; font-size: 0.9rem; cursor: pointer;
    padding: 0.5rem 0;
  }

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
  .loading-text { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--text3); font-style: italic; }
  .error-banner { max-width: 1200px; margin: 2rem auto; padding: 1rem 2rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404; }

  /* ── CAROUSEL ── */
  .carousel-wrap {
    max-width: 1200px; margin: 0 auto;
    padding: 2.5rem 1.5rem 2rem;
  }
  /* The key constraint: carousel must be a clean, zero-padding box.
     overflow:hidden here is what clips the track — no leaking slides. */
  .carousel {
    position: relative;
    border-radius: 8px;
    overflow: hidden;        /* clips track — must have no padding */
    height: 520px;
    width: 100%;             /* explicit 100% so track inherits correctly */
    user-select: none;
    touch-action: pan-y;
  }
  /* Track width = 100% of .carousel (not of a padded ancestor).
     flex children each get min-width:100% of the track = exact slide width. */
  .carousel-track {
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 0.65s cubic-bezier(0.4,0,0.2,1);
    will-change: transform;
  }
  .carousel-slide {
    position: relative;
    /* min-width + flex-shrink:0 = each slide is exactly 100% of track width */
    min-width: 100%;
    max-width: 100%;
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    cursor: pointer;
    /* NO overflow:hidden here — the parent .carousel clips everything */
  }
  .carousel-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* Hero overlay: reserve bottom space for dots (40px) so text never overlaps */
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.05) 60%);
    display: flex; flex-direction: column; justify-content: flex-end;
    /* padding-bottom must be > dot zone (bottom:1.25rem + dot height ~8px + gap) */
    padding: 2.5rem 2.25rem 3.5rem;
    pointer-events: none;
    box-sizing: border-box;
  }
  .hero-tag {
    display: inline-block; background: var(--gold-btn); color: #1a1a18;
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; padding: 0.28rem 0.8rem;
    margin-bottom: 0.65rem; width: fit-content; border-radius: 2px;
    flex-shrink: 0;
  }
  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.6rem, 1.2rem + 2vw, 2.75rem);
    color: #fff; line-height: 1.12; margin-bottom: 0.4rem;
    text-shadow: 0 2px 16px rgba(0,0,0,0.5);
  }
  .hero-subtitle {
    font-size: clamp(0.9rem, 0.8rem + 0.4vw, 1.05rem);
    color: rgba(255,255,255,0.72); font-style: italic;
    margin-bottom: 0.5rem; line-height: 1.45;
    /* clamp lines on mobile so subtitle never pushes dots */
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .hero-meta { font-size: 0.82rem; color: rgba(255,255,255,0.48); flex-shrink: 0; }

  .carousel-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.2);
    color: #fff; width: 46px; height: 46px; border-radius: 50%;
    font-size: 1.15rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s, opacity 0.25s; z-index: 10; opacity: 0;
  }
  .carousel:hover .carousel-arrow { opacity: 1; }
  .carousel-arrow:hover { background: rgba(0,0,0,0.78); }
  .carousel-arrow.prev { left: 1.1rem; }
  .carousel-arrow.next { right: 1.1rem; }
  .carousel-dots {
    position: absolute; bottom: 1.25rem; left: 50%; transform: translateX(-50%);
    display: flex; gap: 0.5rem; z-index: 10;
    /* dots sit above the progress bar */
  }
  .carousel-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(255,255,255,0.35); border: none; cursor: pointer;
    padding: 0; transition: all 0.3s;
  }
  .carousel-dot.active { background: var(--gold-btn); width: 24px; border-radius: 4px; }
  .carousel-progress {
    position: absolute; bottom: 0; left: 0; height: 3px;
    background: var(--gold-btn); z-index: 10; opacity: 0.75;
    transition: width linear;
  }

  /* ── SECTION DIVIDER ── */
  .section-divider {
    max-width: 1200px; margin: 2rem auto 0; padding: 0 1.5rem;
    display: flex; align-items: center; gap: 1.25rem;
  }
  .section-divider h2 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.25rem, 1rem + 0.6vw, 1.5rem);
    white-space: nowrap; color: var(--text); font-weight: 700;
  }
  .divider-line { flex: 1; height: 1px; background: var(--divider); }

  /* ── FILTERS ── */
  .filters {
    max-width: 1200px; margin: 0 auto; padding: 1rem 1.5rem;
    display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;
  }
  .filter-label {
    font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text3); margin-right: 0.2rem;
  }
  .filter-btn {
    padding: 0.35rem 0.9rem; border: 1px solid var(--filter-border);
    background: transparent; font-family: 'Lato', sans-serif;
    font-size: 0.875rem; color: var(--text2); cursor: pointer;
    border-radius: 3px; transition: all 0.2s; line-height: 1.5;
  }
  .filter-btn:hover { border-color: var(--text); color: var(--text); }
  .filter-btn.active { background: var(--text); color: var(--gold-light); border-color: var(--text); }
  .filter-sep { width: 1px; height: 24px; background: var(--divider); margin: 0 0.35rem; }

  /* ── GRID ── */
  .grid {
    max-width: 1200px; margin: 0 auto;
    padding: 1.5rem 1.5rem 5rem;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;
  }
  .card { cursor: pointer; }
  .card-img-wrap { overflow: hidden; border-radius: 5px; height: 215px; margin-bottom: 1rem; }
  .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.55s ease; }
  .card:hover .card-img-wrap img { transform: scale(1.05); }
  .card-cat {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 0.45rem;
  }
  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.15rem, 1rem + 0.4vw, 1.35rem);
    line-height: 1.3; margin-bottom: 0.3rem; color: var(--text); transition: color 0.2s;
  }
  .card:hover .card-title { color: var(--gold); }
  .card-subtitle { font-size: 0.95rem; color: var(--text3); font-style: italic; margin-bottom: 0.6rem; line-height: 1.5; }
  .card-excerpt {
    font-size: 1rem; color: var(--text2); line-height: 1.7; margin-bottom: 0.8rem;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .card-footer {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.8rem; color: var(--text3);
    border-top: 1px solid var(--border); padding-top: 0.75rem; gap: 0.5rem;
  }
  .card-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  .tag {
    background: var(--tag-bg); color: var(--tag-text);
    padding: 0.18rem 0.55rem; font-size: 0.8rem; border-radius: 3px;
  }
  .empty {
    grid-column: 1/-1; text-align: center;
    padding: 4rem 2rem; color: var(--text3); font-style: italic;
  }

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
    text-transform: uppercase; color: var(--gold); margin-bottom: 0.5rem;
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
  /* Light mode: dark fill + gold text */
  .modal-close {
    display: block; margin: 2rem auto 0;
    padding: 0.8rem 2.5rem;
    background: var(--text); color: var(--gold-light);
    border: 1px solid transparent;
    font-family: 'Lato', sans-serif;
    font-size: 0.85rem; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; border-radius: 3px;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .modal-close:hover { opacity: 0.8; }
  /* Dark mode: transparent + gold border + gold text — much easier on the eye */
  [data-theme="dark"] .modal-close {
    background: transparent;
    color: var(--gold-btn);
    border-color: var(--gold-btn);
  }
  [data-theme="dark"] .modal-close:hover {
    background: var(--gold-btn);
    color: #0f0f0d;
    opacity: 1;
  }

  /* ── GALLERY ── */
  .gallery { margin: 2rem 0 0.5rem; }
  .gallery-title {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--text3); margin-bottom: 1rem;
  }
  .gallery-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
  }
  .gallery-thumb {
    aspect-ratio: 4/3; overflow: hidden; border-radius: 3px;
    cursor: pointer; position: relative; background: var(--bg2);
  }
  .gallery-thumb img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.4s ease, opacity 0.2s;
  }
  .gallery-thumb:hover img { transform: scale(1.06); }
  .gallery-thumb:hover .gallery-thumb-overlay { opacity: 1; }
  .gallery-thumb-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    font-size: 1.3rem; color: #fff;
  }
  /* first photo spans 2 columns */
  .gallery-thumb:first-child { grid-column: span 2; aspect-ratio: 16/9; }

  /* Lightbox */
  .lightbox {
    position: fixed; inset: 0; background: rgba(0,0,0,0.96);
    z-index: 400; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }
  .lightbox-img-wrap {
    position: relative; max-width: min(90vw, 1100px); width: 100%;
    display: flex; align-items: center; justify-content: center;
  }
  .lightbox-img {
    max-width: 100%; max-height: 75vh;
    object-fit: contain; border-radius: 3px;
    display: block;
  }
  .lightbox-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.12); border: none; color: #fff;
    width: 44px; height: 44px; border-radius: 50%; font-size: 1.1rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .lightbox-nav:hover { background: rgba(255,255,255,0.25); }
  .lightbox-nav.lb-prev { left: -56px; }
  .lightbox-nav.lb-next { right: -56px; }
  .lightbox-caption {
    margin-top: 1rem; text-align: center;
    color: rgba(255,255,255,0.65); font-style: italic; font-size: 0.95rem;
    max-width: 600px; line-height: 1.5;
  }
  .lightbox-counter {
    margin-top: 0.5rem; font-size: 0.78rem; color: rgba(255,255,255,0.35);
    letter-spacing: 0.08em;
  }
  .lightbox-close {
    position: absolute; top: 1.25rem; right: 1.5rem;
    background: none; border: none; color: rgba(255,255,255,0.5);
    font-size: 1.75rem; cursor: pointer; line-height: 1;
    transition: color 0.2s;
  }
  .lightbox-close:hover { color: #fff; }

  @media (max-width: 600px) {
    .gallery-grid { grid-template-columns: repeat(2, 1fr); }
    .gallery-thumb:first-child { grid-column: span 2; }
    .lightbox-nav.lb-prev { left: 0.25rem; }
    .lightbox-nav.lb-next { right: 0.25rem; }
    .lightbox-img { max-height: 60vh; }
  }

  /* ── PAGINATION ── */
  .pagination {
    display: flex; align-items: center; justify-content: center;
    gap: 0.35rem; padding: 0 1.5rem 4rem; flex-wrap: wrap;
  }
  .page-btn {
    min-width: 38px; height: 38px; padding: 0 0.6rem;
    border: 1px solid var(--filter-border);
    background: transparent; color: var(--text2);
    font-family: 'Lato', sans-serif; font-size: 0.85rem; font-weight: 700;
    border-radius: 3px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }
  .page-btn:hover:not(:disabled) { border-color: var(--text); color: var(--text); }
  .page-btn.active {
    background: var(--text); color: var(--gold-light);
    border-color: var(--text);
  }
  .page-btn:disabled { opacity: 0.3; cursor: default; }
  .page-btn.prev-next { font-size: 1rem; letter-spacing: 0; }
  .page-dots { color: var(--text3); padding: 0 0.2rem; line-height: 38px; font-size: 0.9rem; }

  @media (max-width: 600px) {
    .pagination { padding: 0 1rem 3rem; gap: 0.3rem; }
    .page-btn { min-width: 34px; height: 34px; font-size: 0.8rem; }
  }

  /* ── FOOTER ── */
  .footer {
    background: var(--footer-bg); color: var(--text3);
    padding: 3rem 2rem; border-top: 1px solid var(--header-border);
  }
  .footer-inner {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; align-items: start;
  }
  .footer-brand .logo { font-size: 1.3rem; cursor: default; }
  .footer-tagline { font-size: 0.9rem; color: var(--text3); margin-top: 0.5rem; line-height: 1.6; max-width: 220px; }
  .footer-col h4 {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--text3); margin-bottom: 0.85rem;
  }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .footer-col ul li a { font-size: 0.9rem; color: #666; text-decoration: none; cursor: pointer; transition: color 0.2s; }
  .footer-col ul li a:hover { color: var(--gold-light); }
  .footer-bottom {
    max-width: 1200px; margin: 2rem auto 0; padding-top: 1.5rem;
    border-top: 1px solid var(--header-border);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.8rem; color: #555; flex-wrap: wrap; gap: 0.5rem;
  }
  .footer-bottom .brand { color: var(--gold-btn); }
  .footer-bottom a { color: #555; text-decoration: none; cursor: pointer; }
  .footer-bottom a:hover { color: var(--gold-light); }

  /* ── ABOUT ── */
  .back-btn {
    background: none; border: none; color: var(--gold);
    cursor: pointer; font-family: 'Lato', sans-serif;
    font-size: 0.85rem; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 2rem; padding: 0;
    display: inline-flex; align-items: center; gap: 0.4rem;
  }
  .back-btn:hover { color: var(--gold-light); }
  .about-wrap { max-width: 860px; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  .about-eyebrow {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 0.75rem;
  }
  .about-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 1.5rem + 2vw, 3rem);
    line-height: 1.1; color: var(--text); margin-bottom: 1.5rem;
  }
  .about-title em { color: var(--gold-btn); font-style: italic; }
  .about-intro {
    font-size: 1.1rem; line-height: 1.85; color: var(--text2);
    margin-bottom: 2.5rem; border-left: 3px solid var(--gold-btn); padding-left: 1.5rem;
  }
  .about-photo { width: 100%; height: 420px; object-fit: cover; border-radius: 8px; margin-bottom: 2.5rem; }
  .about-body { font-size: 1rem; line-height: 1.9; color: var(--text2); }
  .about-body p { margin-bottom: 1.5rem; }
  .about-stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
    margin: 3rem 0; padding: 2rem; background: var(--bg2);
    border-radius: 8px; border: 1px solid var(--border);
  }
  .about-stat-num { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: var(--gold-btn); line-height: 1; margin-bottom: 0.3rem; }
  .about-stat-label { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); }
  .about-values { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 2.5rem 0; }
  .about-value-card {
    padding: 1.5rem; border: 1px solid var(--border);
    border-radius: 6px; background: var(--surface); transition: border-color 0.2s;
  }
  .about-value-card:hover { border-color: var(--gold); }
  .about-value-icon { font-size: 1.5rem; margin-bottom: 0.75rem; }
  .about-value-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--text); margin-bottom: 0.4rem; }
  .about-value-text { font-size: 0.95rem; color: var(--text3); line-height: 1.7; }
  .about-contact-btn {
    display: inline-block; margin-top: 2rem; padding: 0.9rem 2.5rem;
    background: var(--gold-btn); color: #1a1a18; font-size: 0.85rem;
    font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    border: none; border-radius: 3px; cursor: pointer; text-decoration: none;
    transition: opacity 0.2s;
  }
  .about-contact-btn:hover { opacity: 0.85; }

  /* ── PRIVACY ── */
  .privacy-wrap { max-width: 760px; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  .privacy-wrap h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.5rem);
    color: var(--text); margin-bottom: 0.5rem;
  }
  .privacy-wrap .updated { font-size: 0.85rem; color: var(--text3); margin-bottom: 2.5rem; }
  .privacy-wrap h2 { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: var(--text); margin: 2rem 0 0.75rem; }
  .privacy-wrap p, .privacy-wrap li { font-size: 1rem; line-height: 1.85; color: var(--text2); margin-bottom: 0.75rem; }
  .privacy-wrap ul { padding-left: 1.5rem; margin-bottom: 1rem; }
  .privacy-wrap a { color: var(--gold); text-decoration: underline; }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .header { padding: 0 1.25rem; }
    .nav-list { display: none; }
    .lang-switcher { display: none; }
    .theme-btn { display: none; }
    .menu-btn { display: flex; }

    /* overflow:hidden on wrap ensures no slide leaks past the padded container */
    .carousel-wrap { padding: 1.25rem 1.25rem 1rem; overflow: hidden; }
    .carousel { height: 370px; }
    .hero-overlay { padding: 2rem 1.75rem 3.25rem; }

    .section-divider { padding: 0 1.25rem; }
    .filters { padding: 0.85rem 1.25rem; }
    .filter-sep { display: none; }
    .grid { grid-template-columns: repeat(2, 1fr); padding: 1rem 1.25rem 3rem; gap: 1.5rem; }

    .footer-inner { grid-template-columns: 1fr 1fr; }
    .footer-brand { grid-column: 1 / -1; }

    .about-stats { grid-template-columns: repeat(2, 1fr); }
    .about-values { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    /* Full-bleed carousel: no padding, no border-radius, explicit width */
    .carousel-wrap {
      padding: 0;
      overflow: hidden;   /* clips .carousel which clips .track */
      max-width: 100vw;
    }
    .carousel { height: 285px; border-radius: 0; width: 100%; }
    /* Overlay: pad bottom enough for dots (1.25rem bottom + 8px dot + 8px gap = ~2.5rem) */
    .hero-overlay { padding: 1.25rem 1.1rem 3rem; }
    /* Smaller text on small phones so title never overflows into dot zone */
    .hero-title { font-size: clamp(1.35rem, 5vw, 1.75rem); margin-bottom: 0.25rem; }
    .hero-subtitle { font-size: 0.85rem; margin-bottom: 0.25rem; -webkit-line-clamp: 1; }
    .hero-meta { font-size: 0.78rem; }
    .hero-tag { font-size: 0.68rem; margin-bottom: 0.5rem; }
    .carousel-arrow { display: none; }

    .section-divider { padding: 0 1rem; margin-top: 1.5rem; }
    .filters { padding: 0.75rem 1rem; gap: 0.35rem; }
    .filter-btn { padding: 0.3rem 0.7rem; font-size: 0.82rem; }
    .filter-label { display: none; }

    .grid { grid-template-columns: 1fr; padding: 0.75rem 1rem 3rem; gap: 1.5rem; }
    .card-img-wrap { height: 210px; }

    .modal-overlay { padding: 0; align-items: flex-end; }
    .modal { max-height: 95vh; border-radius: 10px 10px 0 0; }
    .modal-hero-img { height: 220px; }
    .modal-body { padding: 1.25rem 1.25rem 2rem; }

    .footer-inner { grid-template-columns: 1fr; gap: 1.5rem; }
    .footer-bottom { flex-direction: column; align-items: flex-start; }

    .about-stats { grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.25rem; }
    .about-photo { height: 260px; }
    .about-wrap, .privacy-wrap { padding: 2.5rem 1rem 4rem; }
  }
`;

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function TravelBlog({ onMap }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { theme, toggle } = useTheme();

  // ── state ──
  const [posts,           setPosts]          = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [error,           setError]          = useState(null);
  const [activeContinent, setActiveContinent]= useState("all");
  const [activeCategory,  setActiveCategory] = useState("all");
  const [selectedPost,    setSelectedPost]   = useState(null);
  const [menuOpen,        setMenuOpen]       = useState(false);
  const [page,            setPage]           = useState("blog"); // "blog" | "about" | "privacy"
  const [currentPage,     setCurrentPage]    = useState(1);

  // gallery images for open post
  const [postImages,    setPostImages]   = useState([]);
  const [galleryIdx,    setGalleryIdx]   = useState(0);
  const [galleryOpen,   setGalleryOpen]  = useState(false);

  // carousel
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [paused,      setPaused]      = useState(false);
  const [progress,    setProgress]    = useState(0);
  const progressRef = useRef(null);
  const touchStartX = useRef(null);
  const gridRef     = useRef(null);

  // ── data ──
  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      const { data, error } = await supabase
        .from("posts").select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  // fetch gallery images when a post is opened
  useEffect(() => {
    if (!selectedPost) { setPostImages([]); setGalleryIdx(0); setGalleryOpen(false); return; }
    (async () => {
      const { data } = await supabase
        .from("post_images")
        .select("*")
        .eq("post_id", selectedPost.id)
        .order("position", { ascending: true });
      setPostImages(data || []);
    })();
  }, [selectedPost]);

  // lock body scroll when modal or drawer is open
  useEffect(() => {
    document.body.style.overflow = (selectedPost || menuOpen || galleryOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedPost, menuOpen, galleryOpen]);

  // ── helpers ──
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

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m] = d.split("-");
    return new Date(y, (m || 1) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  };

  // Reset pagination when filters change
  useEffect(() => { setCurrentPage(1); }, [activeContinent, activeCategory]);

  // ── navigation ──
  // Single source of truth: always call navigate() to change page.
  const navigate = useCallback((target) => {
    setPage(target);
    setMenuOpen(false);
    setSelectedPost(null);
    if (target === "blog") {
      setActiveContinent("all");
      setActiveCategory("all");
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // ── derived ──
  // Dynamic filter keys built from actual DB data (always includes "all")
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

  // ── pagination ──
  const PAGE_SIZE   = 6;
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage    = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (p) => {
    setCurrentPage(p);
    // Scroll to top of grid on mobile, smooth on desktop
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── carousel logic ──
  const goTo = useCallback((idx) => {
    setCarouselIdx((idx + carouselPosts.length) % carouselPosts.length);
    setProgress(0);
  }, [carouselPosts.length]);

  const next = useCallback(() => goTo(carouselIdx + 1), [carouselIdx, goTo]);
  const prev = useCallback(() => goTo(carouselIdx - 1), [carouselIdx, goTo]);

  useEffect(() => {
    if (paused || carouselPosts.length < 2) return;
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / CAROUSEL_INTERVAL) * 100, 100));
      if (elapsed >= CAROUSEL_INTERVAL) next();
    }, 30);
    return () => clearInterval(progressRef.current);
  }, [carouselIdx, paused, next, carouselPosts.length]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="blog-root">

        {/* ── HEADER ── */}
        <header className="header">
          <div className="header-inner">

            <div className="logo" onClick={() => navigate("blog")}>
              <em>viaggiare</em>·ontheroad
            </div>

            <div className="header-right">
              {/* Desktop nav — inline, no sub-component */}
              <ul className="nav-list">
                <li><a onClick={() => navigate("blog")}>{t("nav.destinations")}</a></li>
                <li><a onClick={() => { setActiveCategory("culture"); setPage("blog"); window.scrollTo({top:0,behavior:"instant"}); }}>{t("nav.stories")}</a></li>
                <li><a onClick={() => onMap?.()}>🗺 Mappa</a></li>
                <li><a onClick={() => navigate("about")}>Chi siamo</a></li>
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

              <button className="menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </header>

        {/* ── MOBILE DRAWER ── */}
        <nav className={`mobile-drawer${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
          {/* Inline nav links — no sub-component, direct navigate() calls */}
          <ul className="nav-list">
            <li><a onClick={() => navigate("blog")}>{t("nav.destinations")}</a></li>
            <li><a onClick={() => { setActiveCategory("culture"); navigate("blog"); }}>{t("nav.stories")}</a></li>
            <li><a onClick={() => { setMenuOpen(false); onMap?.(); }}>🗺 Mappa</a></li>
            <li><a onClick={() => navigate("about")}>Chi siamo</a></li>
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

        {/* ── PAGE: ABOUT ── */}
        {page === "about" && (
          <AboutPage onBack={() => navigate("blog")} posts={posts} />
        )}

        {/* ── PAGE: PRIVACY ── */}
        {page === "privacy" && (
          <PrivacyPage onBack={() => navigate("blog")} />
        )}

        {/* ── PAGE: BLOG ── */}
        {page === "blog" && (
          loading ? (
            <div className="loading">
              <div className="spinner" />
              <p className="loading-text">Caricamento articoli…</p>
            </div>
          ) : error ? (
            <div className="error-banner">⚠️ {error}</div>
          ) : (
            <>
              {/* CAROUSEL */}
              {carouselPosts.length > 0 && (
                <div className="carousel-wrap">
                  <div
                    className="carousel"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                  >
                    <div
                      className="carousel-track"
                      style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
                    >
                      {carouselPosts.map(post => {
                        const tr = getT(post);
                        return (
                          <div
                            key={post.id}
                            className="carousel-slide"
                            onClick={() => setSelectedPost(post)}
                          >
                            <img src={post.image_url} alt={tr.title} />
                            <div className="hero-overlay">
                              <span className="hero-tag">{tr.destination} · {t(`categories.${post.category}`)}</span>
                              <h1 className="hero-title">{tr.title}</h1>
                              <p className="hero-subtitle">{tr.subtitle}</p>
                              <span className="hero-meta">{formatDate(post.date)} · {post.read_time} {t("hero.readTime")}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button className="carousel-arrow prev" onClick={e => { e.stopPropagation(); prev(); }}>&#8592;</button>
                    <button className="carousel-arrow next" onClick={e => { e.stopPropagation(); next(); }}>&#8594;</button>

                    <div className="carousel-dots">
                      {carouselPosts.map((_, i) => (
                        <button
                          key={i}
                          className={`carousel-dot${i === carouselIdx ? " active" : ""}`}
                          onClick={e => { e.stopPropagation(); goTo(i); }}
                        />
                      ))}
                    </div>

                    {!paused && (
                      <div className="carousel-progress" style={{ width: `${progress}%`, transitionDuration: "30ms" }} />
                    )}
                  </div>
                </div>
              )}

              {/* SECTION TITLE */}
              <div className="section-divider">
                <h2>{t("section.allTrips")}</h2>
                <div className="divider-line" />
              </div>

              {/* FILTERS */}
              <div className="filters">
                <span className="filter-label">{t("filter.continent")}</span>
                {continentKeys.map(c => (
                  <button
                    key={c}
                    className={`filter-btn${activeContinent === c ? " active" : ""}`}
                    onClick={() => setActiveContinent(c)}
                  >{t(`continents.${c}`)}</button>
                ))}
                <div className="filter-sep" />
                <span className="filter-label">{t("filter.category")}</span>
                {categoryKeys.map(c => (
                  <button
                    key={c}
                    className={`filter-btn${activeCategory === c ? " active" : ""}`}
                    onClick={() => setActiveCategory(c)}
                  >{t(`categories.${c}`)}</button>
                ))}
              </div>

              {/* GRID */}
              <div className="grid" ref={gridRef}>
                {filtered.length === 0 && <div className="empty">{t("empty")}</div>}
                {paginated.map(post => {
                  const tr = getT(post);
                  return (
                    <article key={post.id} className="card" onClick={() => setSelectedPost(post)}>
                      <div className="card-img-wrap">
                        <img src={post.image_url} alt={tr.title} />
                      </div>
                      <div className="card-cat">{tr.destination} · {t(`categories.${post.category}`)}</div>
                      <h2 className="card-title">{tr.title}</h2>
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

              {/* PAGINATION */}
              {totalPages > 1 && (() => {
                // Build page number list with ellipsis: always show first, last,
                // current and its neighbours — everything else becomes "…"
                const pages = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 || i === totalPages ||
                    (i >= safePage - 1 && i <= safePage + 1)
                  ) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== "…") {
                    pages.push("…");
                  }
                }
                return (
                  <div className="pagination">
                    <button
                      className="page-btn prev-next"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage === 1}
                      aria-label="Pagina precedente"
                    >←</button>

                    {pages.map((p, i) =>
                      p === "…"
                        ? <span key={`dots-${i}`} className="page-dots">…</span>
                        : <button
                            key={p}
                            className={`page-btn${p === safePage ? " active" : ""}`}
                            onClick={() => goToPage(p)}
                            aria-label={`Pagina ${p}`}
                            aria-current={p === safePage ? "page" : undefined}
                          >{p}</button>
                    )}

                    <button
                      className="page-btn prev-next"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage === totalPages}
                      aria-label="Pagina successiva"
                    >→</button>
                  </div>
                );
              })()}
            </>
          )
        )}

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="logo"><em>viaggiare</em>·ontheroad</div>
              <p className="footer-tagline">Racconti di viaggio lenti, onesti e scritti con cura.</p>
            </div>
            <div className="footer-col">
              <h4>Esplora</h4>
              <ul>
                <li><a onClick={() => navigate("blog")}>Tutti i viaggi</a></li>
                <li><a onClick={() => onMap?.()}>Mappa interattiva</a></li>
                <li><a onClick={() => { setActiveCategory("culture"); setPage("blog"); }}>Cultura</a></li>
                <li><a onClick={() => { setActiveCategory("nature");  setPage("blog"); }}>Natura</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Il progetto</h4>
              <ul>
                <li><a onClick={() => navigate("about")}>Chi siamo</a></li>
                <li><a href="mailto:ciao@viaggilontani.it">Contatti</a></li>
                <li><a onClick={() => navigate("privacy")}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="brand">© 2025 viaggiare·ontheroad</span>
            <a onClick={() => navigate("privacy")}>Privacy Policy</a>
          </div>
        </footer>

        {/* ── ARTICLE MODAL ── */}
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

                  {/* ── GALLERY ── */}
                  {postImages.length > 0 && (
                    <div className="gallery">
                      <div className="gallery-title">Galleria fotografica · {postImages.length} foto</div>
                      <div className="gallery-grid">
                        {postImages.map((img, i) => (
                          <div
                            key={img.id}
                            className="gallery-thumb"
                            onClick={() => { setGalleryIdx(i); setGalleryOpen(true); }}
                          >
                            <img src={img.url} alt={img.alt_text || img.caption || ""} loading="lazy" />
                            <div className="gallery-thumb-overlay">⊕</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="modal-close" onClick={() => setSelectedPost(null)}>
                    {t("modal.back")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* ── LIGHTBOX ── */}
      {galleryOpen && postImages.length > 0 && (() => {
        const img = postImages[galleryIdx];
        const goPrev = (e) => { e.stopPropagation(); setGalleryIdx(i => (i - 1 + postImages.length) % postImages.length); };
        const goNext = (e) => { e.stopPropagation(); setGalleryIdx(i => (i + 1) % postImages.length); };
        return (
          <div className="lightbox" onClick={() => setGalleryOpen(false)}>
            <button className="lightbox-close" onClick={() => setGalleryOpen(false)}>✕</button>
            <div className="lightbox-img-wrap" onClick={e => e.stopPropagation()}>
              {postImages.length > 1 && (
                <button className="lightbox-nav lb-prev" onClick={goPrev}>&#8592;</button>
              )}
              <img className="lightbox-img" src={img.url} alt={img.alt_text || img.caption || ""} />
              {postImages.length > 1 && (
                <button className="lightbox-nav lb-next" onClick={goNext}>&#8594;</button>
              )}
            </div>
            {img.caption && <p className="lightbox-caption">{img.caption}</p>}
            {postImages.length > 1 && (
              <p className="lightbox-counter">{galleryIdx + 1} / {postImages.length}</p>
            )}
          </div>
        );
      })()}

    </>
  );
}
