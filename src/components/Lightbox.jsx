import { useTranslation } from "react-i18next";
import { photoText } from "../images";

// Foto a schermo intero con navigazione. Esc e' gestito da chi lo apre
// (chiude prima il lightbox, poi l'articolo).
export default function Lightbox({ photos, index, setIndex, onClose, lang }) {
  const { t } = useTranslation();
  const img = photos[index];
  if (!img) return null;
  const { alt, caption } = photoText(img, lang);
  const many = photos.length > 1;
  const go = (delta) => (e) => { e.stopPropagation(); setIndex((index + delta + photos.length) % photos.length); };

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={t("a11y.gallery")} onClick={onClose}
      onKeyDown={(e) => { if (many && e.key === "ArrowLeft") go(-1)(e); if (many && e.key === "ArrowRight") go(1)(e); }}>
      <button className="lightbox-close" aria-label={t("a11y.closeGallery")} autoFocus onClick={onClose}>
        <span aria-hidden="true">✕</span>
      </button>
      <div className="lightbox-img-wrap" onClick={e => e.stopPropagation()}>
        {many && (
          <button className="lightbox-nav lb-prev" aria-label={t("a11y.prevPhoto")} onClick={go(-1)}><span aria-hidden="true">&#8592;</span></button>
        )}
        <img className="lightbox-img" src={img.url} alt={alt} width={img.width || undefined} height={img.height || undefined} />
        {many && (
          <button className="lightbox-nav lb-next" aria-label={t("a11y.nextPhoto")} onClick={go(1)}><span aria-hidden="true">&#8594;</span></button>
        )}
      </div>
      {caption && <p className="lightbox-caption">{caption}</p>}
      {many && <p className="lightbox-counter" aria-live="polite">{index + 1} / {photos.length}</p>}
    </div>
  );
}
