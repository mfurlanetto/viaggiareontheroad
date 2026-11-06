import { useState, useEffect } from "react";
import { fetchPostBody } from "./postsApi";

// Restituisce [articolo, stato] con i testi completi (body_*), caricati al bisogno.
// stato: "ready" | "loading" | "error". Se l'articolo contiene gia' i testi
// (lista caricata con select("*")), non fa richieste.
export function usePostBody(post) {
  const [loaded, setLoaded] = useState({ id: null, fields: null, error: false });
  const id = post?.id;
  const needsBody = !!post && !("body_en" in post) && !("body_it" in post);

  useEffect(() => {
    if (!id || !needsBody) return;
    let cancelled = false; // ignora risposte di un articolo gia' chiuso
    fetchPostBody(id)
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoaded(error || !data
          ? { id, fields: null, error: true }
          : { id, fields: data, error: false });
      })
      .catch(() => { if (!cancelled) setLoaded({ id, fields: null, error: true }); });
    return () => { cancelled = true; };
  }, [id, needsBody]);

  if (!post) return [null, "ready"];
  if (!needsBody) return [post, "ready"];
  if (loaded.id !== id) return [post, "loading"];
  if (loaded.error) return [post, "error"];
  return [{ ...post, ...loaded.fields }, "ready"];
}
