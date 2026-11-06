import { useTranslation } from "react-i18next";
import { CONTACT_EMAIL } from "../config";

export default function AboutPage({ onBack, posts }) {
  const { t } = useTranslation();
  const countries  = new Set(posts.map(p => p.destination_it || p.destination_en)).size;
  const continents = new Set(posts.map(p => p.continent)).size;
  const values = t("about.values", { returnObjects: true });

  return (
    <div className="about-wrap">
      <button className="back-btn" onClick={onBack}>{t("backToBlog")}</button>

      <div className="about-eyebrow">{t("about.eyebrow")}</div>
      <h1 className="about-title">
        {t("about.titleLine1")}<br /><em>{t("about.titleLine2")}</em>
      </h1>
      <p className="about-intro">{t("about.intro")}</p>

      <figure className="about-figure">
        <img
          className="about-photo"
          src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=80"
          alt={t("about.photoAlt")}
          width="860" height="420" loading="lazy" decoding="async"
        />
        <figcaption>{t("about.photoCredit")} <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a></figcaption>
      </figure>

      <ul className="about-stats">
        {[
          { num: posts.length, label: t("about.stats.stories") },
          { num: countries,    label: t("about.stats.countries") },
          { num: continents,   label: t("about.stats.continents") },
        ].map(s => (
          <li key={s.label}>
            <span className="about-stat-num">{s.num}</span>
            <span className="about-stat-label">{s.label}</span>
          </li>
        ))}
      </ul>

      <div className="about-body">
        <p>{t("about.body1")}</p>
        <p>{t("about.body2")}</p>
      </div>

      <ul className="about-values">
        {values.map(v => (
          <li key={v.title} className="about-value-card">
            <div className="about-value-icon" aria-hidden="true">{v.icon}</div>
            <h2 className="about-value-title">{v.title}</h2>
            <p className="about-value-text">{v.text}</p>
          </li>
        ))}
      </ul>

      <div className="about-body">
        <p>{t("about.contactText")}</p>
      </div>
      <a className="about-contact-btn" href={`mailto:${CONTACT_EMAIL}`}>{t("about.contactBtn")}</a>
    </div>
  );
}
