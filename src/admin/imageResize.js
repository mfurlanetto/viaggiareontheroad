// Ridimensionamento delle foto nel browser, prima del caricamento.
// - lato lungo massimo LARGE (1600 px) e miniatura THUMB (600 px);
// - WebP dove il browser lo sa codificare, altrimenti JPEG;
// - la ricodifica tramite canvas elimina i metadati EXIF, compresa la
//   posizione GPS dello scatto.
export const LARGE = 1600;
export const THUMB = 600;

async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`Formato non leggibile da questo browser: ${file.name}. Esporta la foto in JPEG e riprova.`);
  }
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encode(bitmap, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  let blob = await toBlob(canvas, "image/webp", 0.82);
  // Alcuni browser non codificano WebP e restituiscono PNG: si passa a JPEG.
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85);
  return { blob, width, height };
}

// Restituisce { large, thumb } con blob, larghezza, altezza ed estensione.
export async function resizePhoto(file) {
  const bitmap = await decode(file);
  try {
    const large = await encode(bitmap, LARGE);
    const thumb = await encode(bitmap, THUMB);
    const ext = large.blob.type === "image/webp" ? "webp" : "jpg";
    return { large, thumb, ext };
  } finally {
    bitmap.close?.();
  }
}
