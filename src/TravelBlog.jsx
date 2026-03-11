import { useState, useEffect, useRef, useCallback } from "react";
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

// ── OPZIONE A: Playfair Display + Lato (max leggibilità, accessibile WCAG) ──
const googleFont = document.createElement("link");
googleFont.rel = "stylesheet";
googleFont.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap";
if (!document.querySelector('link[href*="Playfair"]')) document.head.appendChild(googleFont);

const styles = `
  /* ── THEME TOKENS ── */
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
    --accent-warm:   #c9643c;
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
    --accent-warm:   #d4784c;
  }

  /* ── RESET & BASE ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); transition: background 0.3s; }

  /* WCAG: fluid base font, never below 16px */
  .blog-root {
    font-family: 'Lato', -apple-system, sans-serif;
    font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
    line-height: 1.65;
    letter-spacing: 0.01em;
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
    transition: background 0.3s, color 0.3s;
  }

  /* ── HEADER ── */
  .header {
    background: var(--header-bg);
    padding: 0 2rem;
    position: sticky; top: 0; z-index: 100;
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
    cursor: pointer; flex-shrink: 0; letter-spacing: 0.01em;
  }
  .logo span { color: #e8dfd0; font-style: italic; }
  .header-right { display: flex; align-items: center; gap: 1.25rem; }

  .nav-links {
    display: flex; gap: 1.5rem; list-style: none;
    font-family: 'Lato', sans-serif;
    font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .nav-links a { color: #888; text-decoration: none; transition: color 0.2s; cursor: pointer; white-space: nowrap; }
  .nav-links a:hover, .nav-links a.active { color: var(--gold-light); }

  .theme-btn {
    background: transparent; border: 1px solid var(--header-border);
    color: #888; width: 34px; height: 34px; border-radius: 50%;
    cursor: pointer; font-size: 1rem;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0;
  }
  .theme-btn:hover { border-color: var(--gold-light); color: var(--gold-light); }

  .lang-switcher { display: flex; gap: 0.25rem; border-left: 1px solid var(--header-border); padding-left: 1rem; }
  .lang-btn {
    background: transparent; border: 1px solid transparent;
    color: #666; font-family: 'Lato', sans-serif;
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
    padding: 0.2rem 0.45rem; border-radius: 2px; cursor: pointer; transition: all 0.2s;
  }
  .lang-btn:hover { color: var(--gold-light); border-color: #444; }
  .lang-btn.active { background: var(--gold-btn); color: #1a1a18; border-color: var(--gold-btn); }

  .menu-btn {
    display: none; background: transparent; border: none;
    color: #888; font-size: 1.5rem; cursor: pointer; padding: 0.25rem; line-height: 1;
  }

  /* ── MOBILE DRAWER ── */
  .mobile-drawer {
    display: none; position: fixed; inset: 0; top: 64px;
    background: var(--header-bg); z-index: 99;
    flex-direction: column; padding: 2rem; gap: 1.5rem;
    animation: fadeIn 0.2s ease; border-top: 1px solid var(--header-border);
    overflow-y: auto;
  }
  .mobile-drawer.open { display: flex; }
  .mobile-drawer .nav-links { display: flex !important; flex-direction: column; gap: 1.5rem; }
  .mobile-drawer .nav-links a { font-size: 1.15rem; color: #aaa; letter-spacing: 0.06em; }
  .mobile-drawer .lang-switcher { border-left: none; padding-left: 0; border-top: 1px solid var(--header-border); padding-top: 1.25rem; flex-wrap: wrap; gap: 0.4rem; }
  .mobile-drawer .theme-row { display: flex; align-items: center; gap: 0.75rem; color: #666; font-size: 0.9rem; font-family: 'Lato', sans-serif; }

  /* ── LOADING ── */
  .loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; flex-direction: column; gap: 1rem; }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--spinner-track); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--text3); font-style: italic; }
  .error-banner { max-width: 1200px; margin: 2rem auto; padding: 1rem 2rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404; font-size: 1rem; }

  /* ── CAROUSEL ── */
  .carousel-wrap { max-width: 1200px; margin: 0 auto; padding: 2.5rem 1.5rem 2rem; }
  .carousel { position: relative; border-radius: 8px; overflow: hidden; height: 520px; user-select: none; }
  .carousel-track { display: flex; height: 100%; transition: transform 0.65s cubic-bezier(0.4,0,0.2,1); will-change: transform; }
  .carousel-slide { position: relative; min-width: 100%; height: 100%; flex-shrink: 0; cursor: pointer; }
  .carousel-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.05) 55%); display: flex; flex-direction: column; justify-content: flex-end; padding: 2.5rem 2.25rem; pointer-events: none; }
  .hero-tag {
    display: inline-block; background: var(--gold-btn); color: #1a1a18;
    font-family: 'Lato', sans-serif; font-size: 0.72rem; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    padding: 0.28rem 0.8rem; margin-bottom: 0.8rem; width: fit-content; border-radius: 2px;
  }
  /* WCAG H1: min 32px */
  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 1.5rem + 2vw, 2.75rem);
    color: #fff; line-height: 1.12; margin-bottom: 0.5rem;
    text-shadow: 0 2px 16px rgba(0,0,0,0.5);
  }
  .hero-subtitle { font-size: clamp(1rem, 0.9rem + 0.3vw, 1.1rem); color: rgba(255,255,255,0.75); font-style: italic; margin-bottom: 0.75rem; line-height: 1.5; }
  .hero-meta { font-family: 'Lato', sans-serif; font-size: 0.85rem; color: rgba(255,255,255,0.5); letter-spacing: 0.04em; }

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

  .carousel-dots { position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; z-index: 10; }
  .carousel-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.35); border: none; cursor: pointer; padding: 0; transition: all 0.3s; }
  .carousel-dot.active { background: var(--gold-btn); width: 24px; border-radius: 4px; }
  .carousel-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: var(--gold-btn); z-index: 10; opacity: 0.75; transition: width linear; }

  /* ── SECTION DIVIDER ── */
  .section-divider { max-width: 1200px; margin: 2rem auto 0; padding: 0 1.5rem; display: flex; align-items: center; gap: 1.25rem; }
  /* WCAG H2: min 24px */
  .section-divider h2 { font-family: 'Playfair Display', serif; font-size: clamp(1.25rem, 1rem + 0.6vw, 1.5rem); white-space: nowrap; color: var(--text); font-weight: 700; }
  .divider-line { flex: 1; height: 1px; background: var(--divider); }

  /* ── FILTERS ── */
  .filters { max-width: 1200px; margin: 0 auto; padding: 1rem 1.5rem; display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
  /* WCAG: label min 14px, uppercase con letter-spacing conta come "bold small text" */
  .filter-label { font-family: 'Lato', sans-serif; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); margin-right: 0.2rem; }
  .filter-btn {
    padding: 0.35rem 0.9rem; border: 1px solid var(--filter-border);
    background: transparent; font-family: 'Lato', sans-serif; font-size: 0.875rem;
    color: var(--text2); cursor: pointer; border-radius: 3px; transition: all 0.2s;
    line-height: 1.5;
  }
  .filter-btn:hover { border-color: var(--text); color: var(--text); }
  .filter-btn.active { background: var(--text); color: var(--gold-light); border-color: var(--text); }
  .filter-sep { width: 1px; height: 24px; background: var(--divider); margin: 0 0.35rem; }

  /* ── GRID ── */
  .grid { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1.5rem 5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
  .card { cursor: pointer; }
  .card-img-wrap { overflow: hidden; border-radius: 5px; height: 215px; margin-bottom: 1rem; }
  .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.55s ease; }
  .card:hover .card-img-wrap img { transform: scale(1.05); }
  /* WCAG: category label ≥14px, bold uppercase = ok */
  .card-cat { font-family: 'Lato', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.45rem; }
  /* WCAG H2 in grid: min 20px */
  .card-title { font-family: 'Playfair Display', serif; font-size: clamp(1.15rem, 1rem + 0.4vw, 1.35rem); line-height: 1.3; margin-bottom: 0.3rem; color: var(--text); transition: color 0.2s; }
  .card:hover .card-title { color: var(--gold); }
  .card-subtitle { font-size: 0.95rem; color: var(--text3); font-style: italic; margin-bottom: 0.6rem; line-height: 1.5; }
  /* WCAG body: 16px = 1rem */
  .card-excerpt { font-size: 1rem; color: var(--text2); line-height: 1.7; margin-bottom: 0.8rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .card-footer { display: flex; justify-content: space-between; align-items: center; font-family: 'Lato', sans-serif; font-size: 0.8rem; color: var(--text3); border-top: 1px solid var(--border); padding-top: 0.75rem; gap: 0.5rem; }
  .card-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  /* WCAG: tag min 14px */
  .tag { background: var(--tag-bg); color: var(--tag-text); padding: 0.18rem 0.55rem; font-size: 0.8rem; border-radius: 3px; font-family: 'Lato', sans-serif; font-weight: 400; letter-spacing: 0.02em; }

  /* ── ARTICLE MODAL ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  .modal { background: var(--modal-bg); max-width: 720px; width: 100%; max-height: 92vh; overflow-y: auto; border-radius: 6px; animation: slideUp 0.35s ease; }
  @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  .modal-hero-img { width: 100%; height: 300px; object-fit: cover; }
  .modal-body { padding: 2rem 2.25rem 2.75rem; }
  .modal-cat { font-family: 'Lato', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.5rem; }
  /* WCAG H1 modal: clamp min 28px */
  .modal-title { font-family: 'Playfair Display', serif; font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem); line-height: 1.18; margin-bottom: 0.4rem; color: var(--text); }
  .modal-subtitle { font-size: 1.05rem; color: var(--text3); font-style: italic; margin-bottom: 1.25rem; line-height: 1.5; }
  .modal-meta { display: flex; gap: 1.5rem; font-family: 'Lato', sans-serif; font-size: 0.85rem; color: var(--text3); margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; letter-spacing: 0.02em; }
  /* WCAG body text: 1rem + line-height 1.8 */
  .modal-text { font-size: 1rem; line-height: 1.9; color: var(--text2); white-space: pre-line; letter-spacing: 0.01em; }
  .modal-close {
    display: block; margin: 2rem auto 0;
    padding: 0.8rem 2.5rem; background: var(--text); color: var(--gold-light);
    border: none; font-family: 'Lato', sans-serif; font-size: 0.85rem;
    font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; border-radius: 3px; transition: opacity 0.2s;
  }
  .modal-close:hover { opacity: 0.8; }

  .empty { grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: var(--text3); font-style: italic; font-size: 1.05rem; }

  /* ── FOOTER ── */
  .footer {
    background: var(--footer-bg);
    color: var(--text3); padding: 3rem 2rem;
    border-top: 1px solid var(--header-border);
  }
  .footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem; align-items: start; }
  .footer-brand .logo { font-size: 1.3rem; cursor: default; }
  .footer-tagline { font-size: 0.9rem; color: var(--text3); margin-top: 0.5rem; line-height: 1.6; max-width: 220px; }
  .footer-col h4 { font-family: 'Lato', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text3); margin-bottom: 0.85rem; }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
  .footer-col ul li a { font-size: 0.9rem; color: #666; text-decoration: none; cursor: pointer; transition: color 0.2s; }
  .footer-col ul li a:hover { color: var(--gold-light); }
  .footer-bottom { max-width: 1200px; margin: 2rem auto 0; padding-top: 1.5rem; border-top: 1px solid var(--header-border); display: flex; justify-content: space-between; align-items: center; font-family: 'Lato', sans-serif; font-size: 0.8rem; color: #555; flex-wrap: wrap; gap: 0.5rem; }
  .footer-bottom span { color: var(--gold-btn); }
  .footer-bottom a { color: #555; text-decoration: none; }
  .footer-bottom a:hover { color: var(--gold-light); }

  /* ── ABOUT PAGE ── */
  .about-wrap { max-width: 860px; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  .about-eyebrow { font-family: 'Lato', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.75rem; }
  .about-title { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 1.5rem + 2vw, 3rem); line-height: 1.1; color: var(--text); margin-bottom: 1.5rem; }
  .about-title em { color: var(--gold-btn); font-style: italic; }
  .about-intro { font-size: 1.1rem; line-height: 1.85; color: var(--text2); margin-bottom: 2.5rem; border-left: 3px solid var(--gold-btn); padding-left: 1.5rem; }
  .about-photo { width: 100%; height: 420px; object-fit: cover; border-radius: 8px; margin-bottom: 2.5rem; }
  .about-body { font-size: 1rem; line-height: 1.9; color: var(--text2); }
  .about-body p { margin-bottom: 1.5rem; }
  .about-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin: 3rem 0; padding: 2rem; background: var(--bg2); border-radius: 8px; border: 1px solid var(--border); }
  .about-stat-num { font-family: 'Playfair Display', serif; font-size: 2.5rem; color: var(--gold-btn); line-height: 1; margin-bottom: 0.3rem; }
  .about-stat-label { font-family: 'Lato', sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text3); }
  .about-values { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 2.5rem 0; }
  .about-value-card { padding: 1.5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--surface); transition: border-color 0.2s; }
  .about-value-card:hover { border-color: var(--gold); }
  .about-value-icon { font-size: 1.5rem; margin-bottom: 0.75rem; }
  .about-value-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--text); margin-bottom: 0.4rem; }
  .about-value-text { font-size: 0.95rem; color: var(--text3); line-height: 1.7; }
  .about-contact-btn { display: inline-block; margin-top: 2rem; padding: 0.9rem 2.5rem; background: var(--gold-btn); color: #1a1a18; font-family: 'Lato', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: none; border-radius: 3px; cursor: pointer; text-decoration: none; transition: opacity 0.2s; }
  .about-contact-btn:hover { opacity: 0.85; }

  /* ── PRIVACY PAGE ── */
  .privacy-wrap { max-width: 760px; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  .privacy-wrap h1 { font-family: 'Playfair Display', serif; font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.5rem); color: var(--text); margin-bottom: 0.5rem; }
  .privacy-wrap .updated { font-family: 'Lato', sans-serif; font-size: 0.85rem; color: var(--text3); margin-bottom: 2.5rem; letter-spacing: 0.03em; }
  .privacy-wrap h2 { font-family: 'Playfair Display', serif; font-size: 1.3rem; color: var(--text); margin: 2rem 0 0.75rem; }
  .privacy-wrap p, .privacy-wrap li { font-size: 1rem; line-height: 1.85; color: var(--text2); margin-bottom: 0.75rem; }
  .privacy-wrap ul { padding-left: 1.5rem; margin-bottom: 1rem; }
  .privacy-wrap a { color: var(--gold); text-decoration: underline; }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .header { padding: 0 1.25rem; }
    .nav-links { display: none; }
    .lang-switcher { display: none; }
    .theme-btn { display: none; }
    .menu-btn { display: flex; }

    .carousel-wrap { padding: 1.5rem 1.25rem 1.25rem; }
    .carousel { height: 370px; }

    .grid { grid-template-columns: repeat(2, 1fr); padding: 1rem 1.25rem 3rem; gap: 1.5rem; }
    .filters { padding: 0.85rem 1.25rem; }
    .filter-sep { display: none; }
    .section-divider { padding: 0 1.25rem; }

    .footer-inner { grid-template-columns: 1fr 1fr; }
    .footer-brand { grid-column: 1 / -1; }

    .about-stats { grid-template-columns: repeat(2, 1fr); }
    .about-values { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    .carousel-wrap { padding: 1rem 0 0.75rem; }
    .carousel { height: 285px; border-radius: 0; }
    .hero-overlay { padding: 1.5rem 1.25rem; }
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
    .about-wrap { padding: 2.5rem 1rem 4rem; }
    .privacy-wrap { padding: 2.5rem 1rem 4rem; }
  }
`;

const CONTINENT_KEYS = ["all", "asia", "europe", "america", "africa", "oceania"];
const CATEGORY_KEYS = ["all", "culture", "adventure", "nature", "food", "sea"];
const LANG_KEYS = ["it", "en", "fr", "es", "de"];

// ── ABOUT PAGE ──
function AboutPage({ onBack, posts }) {
  const countries = new Set(posts.map(p => p.destination_it || p.destination_en)).size;
  const continents = new Set(posts.map(p => p.continent)).size;
  const km = Math.round(posts.length * 8400);

  return (
    <div className="about-wrap">
      <button onClick={onBack} style={{background:"none",border:"none",color:"var(--gold)",cursor:"pointer",fontFamily:"'Lato',sans-serif",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"2rem",padding:0,display:"flex",alignItems:"center",gap:"0.4rem"}}>
        ← Torna al blog
      </button>
      <div className="about-eyebrow">Il progetto</div>
      <h1 className="about-title">Un blog nato dalla<br /><em>nostalgia del movimento</em></h1>
      <p className="about-intro">
        Ogni viaggio lascia qualcosa che non si porta a casa con i bagagli. Questi racconti sono il tentativo di custodire quelle cose — la luce di un tramonto a Kyoto, il rumore del mercato di Marrakech, il silenzio di un fiordo islandese alle tre di notte.
      </p>

      <img
        className="about-photo"
        src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=80"
        alt="Viaggiatore con zaino guarda un panorama montano"
      />

      <div className="about-stats">
        <div>
          <div className="about-stat-num">{posts.length}</div>
          <div className="about-stat-label">Racconti pubblicati</div>
        </div>
        <div>
          <div className="about-stat-num">{countries}</div>
          <div className="about-stat-label">Paesi visitati</div>
        </div>
        <div>
          <div className="about-stat-num">{continents}</div>
          <div className="about-stat-label">Continenti</div>
        </div>
        <div>
          <div className="about-stat-num">{posts.length > 0 ? `${Math.round(km/1000)}k` : "—"}</div>
          <div className="about-stat-label">Km stimati</div>
        </div>
      </div>

      <div className="about-body">
        <p>
          Sono un viaggiatore lento. Preferisco restare tre settimane in un posto che capirci qualcosa, anziché fotografare dieci città in dieci giorni. Questo blog è il diario di quella lentezza — scritto per chi vuole viaggiare con intenzione, non con fretta.
        </p>
        <p>
          Ogni articolo è scritto dopo il viaggio, non durante. Lascio sedimentare le impressioni, aspetto che la stanchezza passi e rimanga solo quello che conta davvero. Non troverai consigli su "i 10 posti da non perdere" — troverai storie vere, con i dettagli brutti e quelli belli.
        </p>
      </div>

      <div className="about-values">
        {[
          { icon: "🐢", title: "Viaggi lenti", text: "Niente corse. Un luogo alla volta, con tutto il tempo necessario per capirlo davvero." },
          { icon: "✍️", title: "Scrittura onesta", text: "Niente filtri o sponsorizzazioni nascoste. Solo quello che ho visto, mangiato e vissuto." },
          { icon: "🌍", title: "Rispetto locale", text: "Ogni posto ha una cultura. Il mio obiettivo è osservarla, non consumarla." },
          { icon: "📷", title: "Foto proprie", text: "Tutte le immagini sono scattate sul posto. Nessuna stock photo." },
        ].map(v => (
          <div key={v.title} className="about-value-card">
            <div className="about-value-icon">{v.icon}</div>
            <div className="about-value-title">{v.title}</div>
            <p className="about-value-text">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="about-body">
        <p>
          Hai domande su un viaggio? Vuoi collaborare? Scrivimi — rispondo a tutti.
        </p>
      </div>
      <a className="about-contact-btn" href="mailto:ciao@viaggilontani.it">Scrivimi ✉️</a>
    </div>
  );
}

// ── PRIVACY PAGE ──
function PrivacyPage({ onBack }) {
  return (
    <div className="privacy-wrap">
      <button onClick={onBack} style={{background:"none",border:"none",color:"var(--gold)",cursor:"pointer",fontFamily:"'Lato',sans-serif",fontSize:"0.85rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"2rem",padding:0}}>
        ← Torna al blog
      </button>
      <h1>Privacy Policy</h1>
      <p className="updated">Ultimo aggiornamento: marzo 2025</p>

      <h2>1. Titolare del trattamento</h2>
      <p>Il blog <strong>viaggi·lontani</strong> è gestito a titolo personale. Per qualsiasi richiesta relativa ai dati personali: <a href="mailto:ciao@viaggilontani.it">ciao@viaggilontani.it</a></p>

      <h2>2. Dati raccolti</h2>
      <p>Questo sito non raccoglie dati personali tramite form o registrazione. I contenuti sono ospitati su <strong>Supabase</strong> (Supabase Inc., USA). Supabase può raccogliere dati tecnici di accesso (IP, timestamp) per scopi di sicurezza e monitoraggio.</p>

      <h2>3. Cookie</h2>
      <p>Il sito utilizza esclusivamente:</p>
      <ul>
        <li><strong>localStorage</strong> — per salvare la preferenza di lingua e tema (chiaro/scuro). Nessun dato viene inviato a server esterni.</li>
      </ul>
      <p>Non vengono usati cookie di tracciamento, pubblicitari o di terze parti.</p>

      <h2>4. Hosting e CDN</h2>
      <p>Il sito è ospitato su <strong>Vercel</strong> (Vercel Inc., USA). Vercel raccoglie log tecnici anonimi (IP anonimizzati, tipo di browser, URL richiesti) per garantire il funzionamento del servizio.</p>

      <h2>5. Diritti dell'utente (GDPR)</h2>
      <p>Ai sensi del Regolamento UE 2016/679 hai diritto di accesso, rettifica, cancellazione e opposizione al trattamento dei tuoi dati. Per esercitare questi diritti scrivi a <a href="mailto:ciao@viaggilontani.it">ciao@viaggilontani.it</a>.</p>

      <h2>6. Modifiche</h2>
      <p>Questa privacy policy può essere aggiornata. Le modifiche saranno visibili su questa pagina con la data di aggiornamento in cima.</p>
    </div>
  );
}

// ── MAIN BLOG ──
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
  const [page, setPage] = useState("blog"); // blog | about | privacy

  // carousel
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const INTERVAL = 4500;
  const touchStart = useRef(null);

  useEffect(() => { fetchPosts(); }, []);
  useEffect(() => {
    document.body.style.overflow = (menuOpen || selectedPost) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, selectedPost]);

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

  const carouselPosts = posts.filter(p => p.featured).concat(posts.filter(p => !p.featured)).slice(0, 6);
  const filtered = posts.filter(p =>
    (activeContinent === "all" || p.continent === activeContinent) &&
    (activeCategory === "all" || p.category === activeCategory)
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-");
    return new Date(year, (month || 1) - 1).toLocaleDateString(lang, { month: "long", year: "numeric" });
  };

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
      setProgress(Math.min((elapsed / INTERVAL) * 100, 100));
      if (elapsed >= INTERVAL) next();
    }, 30);
    return () => clearInterval(progressRef.current);
  }, [carouselIdx, paused, next, carouselPosts.length]);

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStart.current = null;
  };

  const goHome = () => { setPage("blog"); setMenuOpen(false); setActiveContinent("all"); setActiveCategory("all"); };

  const NavItems = ({ onClick }) => (
    <ul className="nav-links">
      <li><a onClick={() => { goHome(); onClick?.(); }}>{t("nav.destinations")}</a></li>
      <li><a onClick={() => { setActiveCategory("culture"); setPage("blog"); onClick?.(); }}>{t("nav.stories")}</a></li>
      <li><a onClick={() => { onMap?.(); onClick?.(); }}>🗺 Mappa</a></li>
      <li><a onClick={() => { setPage("about"); onClick?.(); }}>Chi siamo</a></li>
    </ul>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="blog-root">

        {/* HEADER */}
        <header className="header">
          <div className="header-inner">
            <div className="logo" onClick={goHome}><span>via</span>ggi&middot;lontani</div>
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
          <div className="theme-row" onClick={() => { toggle(); setMenuOpen(false); }} style={{cursor:"pointer"}}>
            <button className="theme-btn" onClick={e => e.stopPropagation()}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <span>{theme === "dark" ? "Tema chiaro" : "Tema scuro"}</span>
          </div>
        </div>

        {/* PAGES */}
        {page === "about" && <AboutPage onBack={goHome} posts={posts} />}
        {page === "privacy" && <PrivacyPage onBack={goHome} />}

        {/* BLOG */}
        {page === "blog" && (
          loading ? (
            <div className="loading"><div className="spinner" /><p className="loading-text">Caricamento articoli…</p></div>
          ) : error ? (
            <div className="error-banner">⚠️ Errore: {error}</div>
          ) : (
            <>
              {/* CAROUSEL */}
              {carouselPosts.length > 0 && (
                <div className="carousel-wrap">
                  <div className="carousel"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="carousel-track" style={{ transform: `translateX(-${carouselIdx * 100}%)` }}>
                      {carouselPosts.map((post) => {
                        const tr = getT(post);
                        return (
                          <div key={post.id} className="carousel-slide" onClick={() => setSelectedPost(post)}>
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
                        <button key={i} className={`carousel-dot${i === carouselIdx ? " active" : ""}`} onClick={e => { e.stopPropagation(); goTo(i); }} />
                      ))}
                    </div>
                    {!paused && <div className="carousel-progress" style={{ width: `${progress}%`, transitionDuration: "30ms" }} />}
                  </div>
                </div>
              )}

              {/* SECTION + FILTERS */}
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
          )
        )}

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="logo"><span>via</span>ggi&middot;lontani</div>
              <p className="footer-tagline">Racconti di viaggio lenti, onesti e scritti con cura.</p>
            </div>
            <div className="footer-col">
              <h4>Esplora</h4>
              <ul>
                <li><a onClick={goHome}>Tutti i viaggi</a></li>
                <li><a onClick={() => { onMap?.(); }}>Mappa interattiva</a></li>
                <li><a onClick={() => { setActiveCategory("culture"); setPage("blog"); }}>Cultura</a></li>
                <li><a onClick={() => { setActiveCategory("nature"); setPage("blog"); }}>Natura</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Il progetto</h4>
              <ul>
                <li><a onClick={() => setPage("about")}>Chi siamo</a></li>
                <li><a href="mailto:ciao@viaggilontani.it">Contatti</a></li>
                <li><a onClick={() => setPage("privacy")}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 <span>viaggi·lontani</span></span>
            <a onClick={() => setPage("privacy")} style={{cursor:"pointer"}}>Privacy Policy</a>
          </div>
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
