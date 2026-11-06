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

// Restituisce le props { src, srcSet, sizes } per un <img>.
export function responsiveImage(url, widths, sizes) {
  if (!url) return {};
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
