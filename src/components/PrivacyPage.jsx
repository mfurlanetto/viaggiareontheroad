import { useTranslation } from "react-i18next";
import { CONTACT_EMAIL } from "../config";

// BOZZA da far rivedere (anche da un legale) prima della pubblicazione.
export default function PrivacyPage({ onBack }) {
  const { t } = useTranslation();
  const providers = t("privacy.providers", { returnObjects: true });
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

  return (
    <div className="privacy-wrap">
      <button className="back-btn" onClick={onBack}>{t("backToBlog")}</button>
      <h1>{t("privacy.title")}</h1>
      <p className="updated">{t("privacy.updated")}</p>

      <h2>{t("privacy.h1")}</h2>
      <p>{t("privacy.owner")} {mail}</p>

      <h2>{t("privacy.h2")}</h2>
      <p>{t("privacy.data")}</p>

      <h2>{t("privacy.h3")}</h2>
      <ul>
        {providers.map(p => (
          <li key={p.name}><strong>{p.name}</strong> {p.text}</li>
        ))}
      </ul>
      <p>{t("privacy.providersNote")}</p>

      <h2>{t("privacy.h4")}</h2>
      <p>{t("privacy.cookies")}</p>

      <h2>{t("privacy.h5")}</h2>
      <p>
        {t("privacy.rights")} <a href="https://www.garanteprivacy.it">garanteprivacy.it</a>).{" "}
        {t("privacy.rightsContact")} {mail}.
      </p>

      <h2>{t("privacy.h6")}</h2>
      <p>{t("privacy.changes")}</p>
    </div>
  );
}
