// Varianti responsive per le immagini Unsplash: il CDN di Unsplash ridimensiona
// e converte al volo tramite i parametri w, q e auto=format (WebP/AVIF quando
// il browser li supporta). Le immagini di altri host vengono usate cosi' come sono.
const UNSPLASH = "images.unsplash.com";

function withParams(url, width) {
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", "75");
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "crop");
  return u.toString();
}

// Foto caricate dall'admin: versione grande (1600 px) e miniatura (600 px) in WebP.
const THUMB_W = 600, LARGE_W = 1600;
function withThumb(url, thumbUrl, sizes) {
  return { src: thumbUrl, srcSet: `${thumbUrl} ${THUMB_W}w, ${url} ${LARGE_W}w`, sizes };
}

// Restituisce le props { src, srcSet, sizes } per un <img>.
// thumbUrl: miniatura gia' generata (foto caricate dall'admin), se esiste.
export function responsiveImage(url, widths, sizes, thumbUrl) {
  if (!url) return {};
  if (thumbUrl) return withThumb(url, thumbUrl, sizes);
  let host;
  try { host = new URL(url).host; } catch { return { src: url }; }
  if (host !== UNSPLASH) return { src: url };
  return {
    src: withParams(url, widths[Math.min(1, widths.length - 1)]),
    srcSet: widths.map(w => `${withParams(url, w)} ${w}w`).join(", "),
    sizes,
  };
}

// Larghezze usate nei vari punti del sito.
export const IMG = {
  hero:  [[640, 960, 1280, 1920, 2400], "(max-width: 1200px) 100vw, 1150px"],
  card:  [[400, 600, 800, 1200], "(max-width: 600px) 100vw, (max-width: 900px) 50vw, 380px"],
  modal: [[720, 1080, 1440], "(max-width: 760px) 100vw, 720px"],
  thumb: [[160, 320], "62px"],
  popup: [[240, 480], "210px"],
};

// Props per una foto della tabella post_images (miniatura + grande).
export function photoImage(img, sizes) {
  return img.thumb_url ? withThumb(img.url, img.thumb_url, sizes) : responsiveImage(img.url, IMG.card[0], sizes);
}

// Testi di una foto nella lingua del sito, con ripiego sui vecchi campi.
export function photoText(img, lang) {
  const caption = img[`caption_${lang}`] || img.caption_it || img.caption || "";
  const alt = img[`alt_${lang}`] || img.alt_it || img.alt_text || caption;
  return { caption, alt };
}
