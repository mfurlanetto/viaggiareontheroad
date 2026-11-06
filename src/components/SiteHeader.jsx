import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGS, LANG_INFO } from "../config";
import { pathFor, routeIn, navigateTo, linkProps } from "../router";

// Header comune a blog e mappa: logo, menu, tema, lingue e menu mobile.
// onBlog(category) apre il blog con un filtro di categoria ("all" = nessuno).
export default function SiteHeader({ route, current, theme, onToggleTheme, menuOpen, setMenuOpen, onBlog, wide = false }) {
  const { t, i18n } = useTranslation();
  const lang = route.lang;

  // Esc chiude il menu mobile
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, setMenuOpen]);

  const goMap = () => { setMenuOpen(false); navigateTo(pathFor.map(lang)); };
  const goAbout = () => { setMenuOpen(false); navigateTo(pathFor.about(lang)); window.scrollTo({ top: 0, behavior: "instant" }); };
  const goLang = (l) => {
    setMenuOpen(false);
    i18n.changeLanguage(l);
    navigateTo(routeIn(route, l));
  };
  const themeLabel = theme === "dark" ? t("a11y.themeToLight") : t("a11y.themeToDark");

  const navLinks = (
    <>
      <li><a {...linkProps(pathFor.home(lang), () => onBlog("all"))}
        aria-current={current === "blog" ? "page" : undefined}>{t("nav.destinations")}</a></li>
      <li><a {...linkProps(pathFor.home(lang), () => onBlog("culture"))}>{t("nav.stories")}</a></li>
      <li><a {...linkProps(pathFor.map(lang), goMap)}
        aria-current={current === "map" ? "page" : undefined}>🗺 {t("nav.map")}</a></li>
      <li><a {...linkProps(pathFor.about(lang), goAbout)}
        aria-current={current === "about" ? "page" : undefined}>{t("nav.about")}</a></li>
    </>
  );

  const langLinks = (withLabel) => LANGS.map(l => (
    <a
      key={l}
      className={`lang-btn${lang === l ? " active" : ""}`}
      hrefLang={l}
      lang={l}
      aria-label={LANG_INFO[l].name}
      aria-current={lang === l ? "true" : undefined}
      {...linkProps(routeIn(route, l), () => goLang(l))}
    >{LANG_INFO[l].flag}{withLabel ? ` ${LANG_INFO[l].label}` : ""}</a>
  ));

  return (
    <>
      <a className="skip-link" href="#main">{t("a11y.skip")}</a>
      <header className="header">
        <div className={`header-inner${wide ? " wide" : ""}`}>
          <a className="logo" {...linkProps(pathFor.home(lang), () => onBlog("all"))}>
            <em>viaggiare</em>·ontheroad
          </a>
          <div className="header-right">
            <nav aria-label="Menu">
              <ul className="nav-list">{navLinks}</ul>
            </nav>
            <button className="theme-btn" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel}>
              <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>
            <div className="lang-switcher" role="group" aria-label={t("a11y.language")}>
              {langLinks(false)}
            </div>
            <button
              className="menu-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
            >
              <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sempre nel DOM (animazione); quando e' chiuso "inert" lo toglie anche
          dalla navigazione da tastiera e dagli screen reader. */}
      <nav
        id="mobile-drawer"
        className={`mobile-drawer${menuOpen ? " open" : ""}`}
        aria-label="Menu"
        inert={!menuOpen}
      >
        <ul className="nav-list">{navLinks}</ul>
        <div className="lang-switcher" role="group" aria-label={t("a11y.language")}>
          {langLinks(true)}
        </div>
        <button className="theme-row" onClick={() => { onToggleTheme(); setMenuOpen(false); }}>
          <span className="theme-btn" aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? t("theme.light") : t("theme.dark")}</span>
        </button>
      </nav>
    </>
  );
}
