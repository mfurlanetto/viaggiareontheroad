import { useTranslation } from "react-i18next";
import { photoImage, photoText } from "../images";
import { formatMonth, dayAnchor } from "../content";

const pick = (obj, field, lang) => obj[`${field}_${lang}`] || obj[`${field}_it`] || "";

function formatDay(date, lang) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return formatMonth(date, lang);
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// Galleria di miniature: ogni foto apre il lightbox sull'elenco completo.
function PhotoGrid({ photos, lang, label, onOpen }) {
  const { t } = useTranslation();
  if (!photos.length) return null;
  return (
    <ul className="gallery-grid" aria-label={label}>
      {photos.map((img, i) => {
        const { alt, caption } = photoText(img, lang);
        return (
          <li key={img.id}><button
            className="gallery-thumb"
            aria-label={alt || caption || t("a11y.openPhoto", { n: i + 1 })}
            onClick={() => onOpen(photos, i)}
          >
            <img {...photoImage(img, "(max-width: 600px) 50vw, 240px")} alt="" loading="lazy" decoding="async"
              width={img.width || undefined} height={img.height || undefined} />
            <span className="gallery-thumb-overlay" aria-hidden="true">⊕</span>
          </button></li>
        );
      })}
    </ul>
  );
}

// Viaggio diviso per giorni: indice, poi per ogni giorno copertina, testo e
// galleria. Le foto senza giorno restano in una galleria generale in fondo.
export default function ArticleDays({ days, images, lang, onOpenPhotos, onJump }) {
  const { t } = useTranslation();
  const byDay = new Map();
  for (const img of images) {
    if (!img.day_id) continue;
    if (!byDay.has(img.day_id)) byDay.set(img.day_id, []);
    byDay.get(img.day_id).push(img);
  }
  const general = images.filter(img => !img.day_id);

  return (
    <>
      {days.length > 0 && (
        <nav className="days-toc" aria-labelledby="days-toc-title">
          <h2 className="days-toc-title" id="days-toc-title">{t("days.toc")}</h2>
          <ol>
            {days.map(d => {
              const place = pick(d, "place", lang);
              const title = pick(d, "title", lang);
              return (
                <li key={d.id}>
                  <a href={`#${dayAnchor(d.day_number)}`} onClick={(e) => { e.preventDefault(); onJump(d.day_number); }}>
                    <span className="days-toc-n">{t("days.day", { n: d.day_number })}</span>
                    {(title || place) && <span className="days-toc-label">{title || place}</span>}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {days.map(d => {
        const photos = byDay.get(d.id) || [];
        const cover = photos.find(p => p.id === d.cover_image_id) || photos[0] || null;
        const rest = cover ? photos.filter(p => p.id !== cover.id) : photos;
        const title = pick(d, "title", lang);
        const place = pick(d, "place", lang);
        const body = pick(d, "body", lang);
        const coverText = cover ? photoText(cover, lang) : null;
        return (
          <section key={d.id} className="day" id={dayAnchor(d.day_number)} aria-labelledby={`${dayAnchor(d.day_number)}-title`}>
            <h2 className="day-title" id={`${dayAnchor(d.day_number)}-title`}>
              <span className="day-n">{t("days.day", { n: d.day_number })}</span>
              {title && <span className="day-name">{title}</span>}
            </h2>
            {(d.date || place) && (
              <p className="day-meta">
                {d.date && <time dateTime={d.date}>{formatDay(d.date, lang)}</time>}
                {d.date && place && " · "}
                {place}
              </p>
            )}
            {cover && (
              <figure className="day-cover">
                <button className="day-cover-btn" onClick={() => onOpenPhotos(photos, photos.indexOf(cover))}
                  aria-label={coverText.alt || coverText.caption || t("a11y.openPhoto", { n: 1 })}>
                  <img {...photoImage(cover, "(max-width: 760px) 100vw, 660px")} alt="" loading="lazy" decoding="async"
                    width={cover.width || undefined} height={cover.height || undefined} />
                </button>
                {coverText.caption && <figcaption>{coverText.caption}</figcaption>}
              </figure>
            )}
            {body && <p className="modal-text day-text">{body}</p>}
            <PhotoGrid photos={rest} lang={lang} label={t("days.photos", { n: d.day_number })}
              onOpen={(list, i) => onOpenPhotos(photos, photos.indexOf(list[i]))} />
          </section>
        );
      })}

      {general.length > 0 && (
        <section className="gallery" aria-labelledby="gallery-general-title">
          <h2 className="gallery-title" id="gallery-general-title">
            {days.length ? t("days.morePhotos") : t("gallery.title", { count: general.length })}
          </h2>
          <PhotoGrid photos={general} lang={lang} label={t("a11y.gallery")} onOpen={onOpenPhotos} />
        </section>
      )}
    </>
  );
}
