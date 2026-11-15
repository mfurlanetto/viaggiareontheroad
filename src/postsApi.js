import { supabase } from "./supabaseClient";
import { LANGS } from "./config";

// Solo le colonne delle lingue del sito (le colonne *_fr/_es/_de restano nel DB ma non si usano).
const perLang = (name) => LANGS.map(l => `${name}_${l}`);

// Colonne usate da griglia, carosello, About e mappa. Il corpo degli articoli
// (body_*) e' il campo piu' pesante e serve solo quando un articolo viene aperto.
const LIST_COLUMNS = [
  "id", "created_at", "published", "featured", "continent", "category",
  "date", "read_time", "image_url", "image_thumb_url", "tags", "lat", "lng", "slug",
  ...["title", "subtitle", "destination", "excerpt"].flatMap(perLang),
].join(",");

const BODY_COLUMNS = perLang("body").join(",");

// 42703 = undefined_column: lo schema reale non ha una delle colonne attese.
// Solo in quel caso si ripiega su select("*"); gli altri errori (rete, permessi)
// vengono restituiti al chiamante invece di essere mascherati da un secondo tentativo.
const isMissingColumn = (error) => error?.code === "42703";

export async function fetchPublishedPosts() {
  const run = (columns) =>
    supabase.from("posts").select(columns)
      .eq("published", true)
      .order("created_at", { ascending: false });
  const res = await run(LIST_COLUMNS);
  return isMissingColumn(res.error) ? run("*") : res;
}

export async function fetchPostBody(id) {
  const run = (columns) => supabase.from("posts").select(columns).eq("id", id).maybeSingle();
  const res = await run(BODY_COLUMNS);
  return isMissingColumn(res.error) ? run("*") : res;
}

// Giorni e foto di un articolo (caricati all'apertura). Le foto senza giorno
// formano la galleria generale dell'articolo.
export async function fetchPostDaysAndImages(postId) {
  const [days, images] = await Promise.all([
    supabase.from("post_days").select("*").eq("post_id", postId).order("day_number", { ascending: true }),
    supabase.from("post_images").select("*").eq("post_id", postId).order("position", { ascending: true }),
  ]);
  return {
    days: days.error ? [] : (days.data || []),
    images: images.error ? [] : (images.data || []),
    error: days.error || images.error || null,
  };
}

// Tappe con coordinate di tutti i post pubblicati (percorso sulla mappa).
// La RLS restituisce solo i giorni dei post pubblicati.
export async function fetchDayStops() {
  const cols = ["post_id", "day_number", "lat", "lng", ...perLang("place"), ...perLang("title")].join(",");
  const { data, error } = await supabase.from("post_days").select(cols)
    .not("lat", "is", null).not("lng", "is", null)
    .order("day_number", { ascending: true });
  return error ? [] : (data || []);
}
