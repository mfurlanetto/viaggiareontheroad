// Accesso ai dati per la pagina admin. Tutte le scritture passano dalla RLS di
// Supabase: solo l'utente amministratore puo' modificare post, giorni e foto.
import { supabase } from "../supabaseClient";
import { resizePhoto } from "./imageResize";

const BUCKET = "post-images";

// Errore leggibile da un risultato di supabase-js.
function check({ data, error }) {
  if (error) {
    const msg = error.code === "42501" || /row-level security/i.test(error.message || "")
      ? "Permesso negato: questo account non e' l'amministratore del sito."
      : error.message;
    throw new Error(msg);
  }
  return data;
}

// ── articoli ──
export const listPosts = async () =>
  check(await supabase.from("posts")
    .select("id, slug, title_it, title_en, published, featured, created_at, image_thumb_url, image_url")
    .order("created_at", { ascending: false }));

export const getPost = async (id) =>
  check(await supabase.from("posts").select("*").eq("id", id).single());

export const createPost = async (fields) =>
  check(await supabase.from("posts").insert(fields).select("*").single());

export const updatePost = async (id, fields) =>
  check(await supabase.from("posts").update(fields).eq("id", id).select("*").single());

export async function deletePost(id) {
  const images = check(await supabase.from("post_images").select("id, storage_path").eq("post_id", id));
  await removeFiles(images);
  check(await supabase.from("post_images").delete().eq("post_id", id));
  check(await supabase.from("posts").delete().eq("id", id));
}

// ── giorni ──
export const listDays = async (postId) =>
  check(await supabase.from("post_days").select("*").eq("post_id", postId).order("day_number", { ascending: true }));

export const createDay = async (postId, dayNumber) =>
  check(await supabase.from("post_days").insert({ post_id: postId, day_number: dayNumber }).select("*").single());

export const updateDay = async (id, fields) =>
  check(await supabase.from("post_days").update(fields).eq("id", id).select("*").single());

// Elimina un giorno: le sue foto tornano nella galleria generale (day_id = null,
// vincolo "on delete set null"), non vengono cancellate.
export const deleteDay = async (id) => check(await supabase.from("post_days").delete().eq("id", id));

// Scambia la posizione di due giorni. Ogni richiesta e' una transazione a se',
// quindi si passa per un numero temporaneo per non violare l'unicita'.
export async function swapDays(a, b) {
  check(await supabase.from("post_days").update({ day_number: 10000 + a.day_number }).eq("id", a.id));
  check(await supabase.from("post_days").update({ day_number: a.day_number }).eq("id", b.id));
  check(await supabase.from("post_days").update({ day_number: b.day_number }).eq("id", a.id));
}

// Rinumera i giorni 1..n nell'ordine dato (dopo un'eliminazione).
export async function renumberDays(days) {
  for (const [i, d] of days.entries()) {
    if (d.day_number !== i + 1) check(await supabase.from("post_days").update({ day_number: 10000 + i }).eq("id", d.id));
  }
  for (const [i, d] of days.entries()) {
    if (d.day_number !== i + 1) check(await supabase.from("post_days").update({ day_number: i + 1 }).eq("id", d.id));
  }
}

// ── foto ──
export const listImages = async (postId) =>
  check(await supabase.from("post_images").select("*").eq("post_id", postId).order("position", { ascending: true }));

export const updateImage = async (id, fields) =>
  check(await supabase.from("post_images").update(fields).eq("id", id).select("*").single());

const publicUrl = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

async function uploadBlob(path, blob) {
  check(await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type, cacheControl: "31536000", upsert: false,
  }));
  return publicUrl(path);
}

// Ridimensiona e carica una foto (grande + miniatura). Restituisce i campi
// da salvare: url, thumb_url, width, height, storage_path.
export async function uploadPhoto(postId, file) {
  const { large, thumb, ext } = await resizePhoto(file);
  const base = `${postId}/${crypto.randomUUID()}`;
  const url = await uploadBlob(`${base}-1600.${ext}`, large.blob);
  const thumbUrl = await uploadBlob(`${base}-600.${ext}`, thumb.blob);
  return { url, thumb_url: thumbUrl, width: large.width, height: large.height, storage_path: `${base}|${ext}` };
}

// Carica una foto e la registra in post_images (per un giorno o generale).
export async function addPhoto(postId, dayId, file, position) {
  const uploaded = await uploadPhoto(postId, file);
  return check(await supabase.from("post_images")
    .insert({ post_id: postId, day_id: dayId, position, ...uploaded })
    .select("*").single());
}

// File nello storage di una foto (storage_path = "<base>|<ext>").
function filesOf(img) {
  if (!img.storage_path) return [];
  const [base, ext] = img.storage_path.split("|");
  return [`${base}-1600.${ext}`, `${base}-600.${ext}`];
}

async function removeFiles(images) {
  const paths = images.flatMap(filesOf);
  if (paths.length) check(await supabase.storage.from(BUCKET).remove(paths));
}

export async function deletePhoto(img) {
  await removeFiles([img]);
  check(await supabase.from("post_images").delete().eq("id", img.id));
}

// Copertina dell'articolo: carica la foto e restituisce i campi per posts.
export async function uploadCover(postId, file) {
  const { url, thumb_url } = await uploadPhoto(postId, file);
  return { image_url: url, image_thumb_url: thumb_url };
}

// ── autenticazione ──
export const signIn = async (email, password) =>
  check(await supabase.auth.signInWithPassword({ email, password }));
export const signOut = () => supabase.auth.signOut();
export const getSession = async () => (await supabase.auth.getSession()).data.session;
export const onAuthChange = (cb) => supabase.auth.onAuthStateChange((_e, session) => cb(session)).data.subscription;
