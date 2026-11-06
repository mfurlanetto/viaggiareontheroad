import { useState, useEffect } from "react";
import { fetchPostBody } from "./postsApi";

// Restituisce l'articolo con i testi completi (body_*), caricandoli al bisogno.
// Se l'articolo li contiene gia' (lista caricata con select("*")), non fa richieste.
export function usePostBody(post) {
  const [loaded, setLoaded] = useState({ id: null, fields: null });
  const id = post?.id;
  const needsBody = !!post && !("body_en" in post) && !("body_it" in post);

  useEffect(() => {
    if (!id || !needsBody) return;
    let cancelled = false; // ignora risposte di un articolo gia' chiuso
    fetchPostBody(id).then(({ data }) => {
      if (!cancelled && data) setLoaded({ id, fields: data });
    });
    return () => { cancelled = true; };
  }, [id, needsBody]);

  if (!post) return null;
  return loaded.id === id && loaded.fields ? { ...post, ...loaded.fields } : post;
}
