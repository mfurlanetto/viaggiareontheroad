import { supabase } from "./supabaseClient";

const LANGS = ["it", "en", "fr", "es", "de"];
const perLang = (name) => LANGS.map(l => `${name}_${l}`);

// Colonne usate da griglia, carosello, About e mappa. Il corpo degli articoli
// (body_*) e' il campo piu' pesante e serve solo quando un articolo viene aperto.
const LIST_COLUMNS = [
  "id", "created_at", "published", "featured", "continent", "category",
  "date", "read_time", "image_url", "tags",
  ...["title", "subtitle", "destination", "excerpt"].flatMap(perLang),
].join(",");

const BODY_COLUMNS = perLang("body").join(",");

// Se lo schema reale non ha una delle colonne attese, la select esplicita
// fallisce: in quel caso si ripiega su select("*"), che non puo' rompersi.
export async function fetchPublishedPosts() {
  const run = (columns) =>
    supabase.from("posts").select(columns)
      .eq("published", true)
      .order("created_at", { ascending: false });
  const res = await run(LIST_COLUMNS);
  return res.error ? run("*") : res;
}

export async function fetchPostBody(id) {
  const run = (columns) => supabase.from("posts").select(columns).eq("id", id).maybeSingle();
  const res = await run(BODY_COLUMNS);
  return res.error ? run("*") : res;
}
