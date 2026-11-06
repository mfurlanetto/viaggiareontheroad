import { useEffect, useState } from "react";
import { getPost, createPost, updatePost, deletePost, listDays, listImages, createDay, deleteDay, swapDays, renumberDays, uploadCover } from "./api";
import { navigateTo } from "../router";
import MapPicker from "./MapPicker";
import DayEditor from "./DayEditor";
import PhotoManager from "./PhotoManager";

const CONTINENTS = ["europe", "asia", "africa", "america", "oceania"];
const CATEGORIES = ["culture", "adventure", "nature", "food", "sea"];
const TEXT = ["title", "subtitle", "destination", "excerpt", "body"];
const EMPTY = {
  continent: "europe", category: "culture", date: "", read_time: 5, tags: "", featured: false, published: false,
  slug: "", lat: null, lng: null, image_url: "", image_thumb_url: "",
  ...Object.fromEntries(TEXT.flatMap(f => [[`${f}_it`, ""], [`${f}_en`, ""]])),
};

const fromPost = (p) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map(k => [k, p[k] ?? EMPTY[k]])),
  tags: (p.tags || []).join(", "),
});

function toFields(form, isNew) {
  const f = { ...form };
  f.tags = form.tags.split(",").map(s => s.trim()).filter(Boolean);
  f.read_time = Number(form.read_time) || 1;
  for (const k of Object.keys(f)) if (f[k] === "") f[k] = null;
  // Lo slug vuoto lo genera il database dal titolo; dopo la pubblicazione non si cambia.
  if (!f.slug) delete f.slug;
  if (!isNew) { // copertina gestita dal caricamento, non dal form
    delete f.image_url;
    delete f.image_thumb_url;
  }
  return f;
}

export default function PostEditor({ postId }) {
  const isNew = !postId;
  const [form, setForm] = useState(EMPTY);
  const [post, setPost] = useState(null);
  const [days, setDays] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const onError = (text) => setMessage({ type: "error", text });

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    Promise.all([getPost(postId), listDays(postId), listImages(postId)])
      .then(([p, d, i]) => { if (!cancelled) { setPost(p); setForm(fromPost(p)); setDays(d); setImages(i); } })
      .catch(e => { if (!cancelled) onError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId, isNew]);

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMessage(null);
    try {
      if (isNew) {
        const created = await createPost(toFields(form, true));
        navigateTo(`/admin/post/${created.id}`, { replace: true });
        return;
      }
      const saved = await updatePost(postId, toFields(form, false));
      setPost(saved); setForm(fromPost(saved));
      setMessage({ type: "ok", text: saved.published
        ? "Salvato. Il sito pubblico si aggiorna da solo in circa 2 minuti."
        : "Salvato come bozza (non visibile sul sito)." });
    } catch (err) { onError(err.message); }
    finally { setSaving(false); }
  }

  async function onCover(file) {
    if (!file) return;
    setMessage({ type: "ok", text: "Caricamento copertina…" });
    try {
      const fields = await uploadCover(postId, file);
      const saved = await updatePost(postId, fields);
      setPost(saved); set("image_url", saved.image_url); set("image_thumb_url", saved.image_thumb_url);
      setMessage({ type: "ok", text: "Copertina aggiornata." });
    } catch (e) { onError(e.message); }
  }

  async function addDay() {
    try {
      const n = days.length ? Math.max(...days.map(d => d.day_number)) + 1 : 1;
      const d = await createDay(postId, n);
      setDays(ds => [...ds, d]);
    } catch (e) { onError(e.message); }
  }

  async function moveDay(i, delta) {
    const a = days[i], b = days[i + delta];
    if (!a || !b) return;
    try {
      await swapDays(a, b);
      setDays(await listDays(postId));
    } catch (e) { onError(e.message); }
  }

  async function removeDay(day) {
    if (!window.confirm(`Eliminare il giorno ${day.day_number}? Le sue foto passano nella galleria generale.`)) return;
    try {
      await deleteDay(day.id);
      const rest = days.filter(d => d.id !== day.id);
      await renumberDays(rest);
      const [d, i] = await Promise.all([listDays(postId), listImages(postId)]);
      setDays(d); setImages(i);
    } catch (e) { onError(e.message); }
  }

  async function removePost() {
    if (!window.confirm("Eliminare definitivamente questo articolo, i suoi giorni e tutte le foto?")) return;
    try { await deletePost(postId); navigateTo("/admin"); }
    catch (e) { onError(e.message); }
  }

  // setPhotos per un sottoinsieme (giorno o galleria generale) aggiorna l'elenco completo.
  const photosSetter = (dayId) => (updater) => setImages(all => {
    const mine = all.filter(i => (i.day_id || null) === dayId);
    const next = typeof updater === "function" ? updater(mine) : updater;
    return [...all.filter(i => (i.day_id || null) !== dayId), ...next];
  });

  if (loading) return <p role="status">Caricamento…</p>;

  const textPair = (field, label, multiline = false, rows = 3) => (
    <>
      {["it", "en"].map(l => {
        const k = `${field}_${l}`;
        const props = { value: form[k] || "", onChange: e => set(k, e.target.value), required: field === "title" && l === "it" };
        return (
          <label key={k}>{label} ({l.toUpperCase()})
            {multiline ? <textarea rows={rows} {...props} /> : <input {...props} />}
          </label>
        );
      })}
    </>
  );

  return (
    <div className="adm-editor">
      <p><a href="/admin" onClick={e => { e.preventDefault(); navigateTo("/admin"); }}>← Tutti gli articoli</a></p>
      <h1>{isNew ? "Nuovo articolo" : (post?.title_it || "Articolo")}</h1>
      {post?.published && post.slug && (
        <p><a href={`/articoli/${post.slug}`} target="_blank" rel="noopener noreferrer">Apri sul sito ↗</a></p>
      )}
      {message && <p className={message.type === "error" ? "adm-error" : "adm-ok"} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}

      <form onSubmit={save} className="adm-card">
        <h2>Articolo</h2>
        <div className="adm-grid2">
          {textPair("title", "Titolo")}
          {textPair("subtitle", "Sottotitolo")}
          {textPair("destination", "Paese / destinazione")}
          {textPair("excerpt", "Estratto (anteprima e descrizione per Google)", true, 3)}
          {textPair("body", "Introduzione", true, 8)}
        </div>
        <div className="adm-grid3">
          <label>Continente
            <select value={form.continent} onChange={e => set("continent", e.target.value)}>{CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </label>
          <label>Categoria
            <select value={form.category} onChange={e => set("category", e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </label>
          <label>Mese del viaggio<input type="month" required value={form.date || ""} onChange={e => set("date", e.target.value)} /></label>
          <label>Minuti di lettura<input type="number" min="1" required value={form.read_time} onChange={e => set("read_time", e.target.value)} /></label>
          <label>Tag (separati da virgola)<input value={form.tags} onChange={e => set("tags", e.target.value)} /></label>
          <label>Indirizzo (slug)
            <input value={form.slug || ""} onChange={e => set("slug", e.target.value)} disabled={!!post?.published}
              placeholder="generato dal titolo" pattern="[a-z0-9]+(-[a-z0-9]+)*" />
          </label>
        </div>
        {post?.published && <p className="adm-hint">Lo slug non si cambia dopo la pubblicazione: i link già condivisi smetterebbero di funzionare.</p>}
        <MapPicker lat={form.lat} lng={form.lng} label="Posizione dell'articolo sulla mappa"
          onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} />
        <div className="adm-row">
          <label className="adm-check"><input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} /> In evidenza (carosello)</label>
          <label className="adm-check"><input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} /> Pubblicato</label>
        </div>
        <div className="adm-row">
          <button type="submit" className="adm-btn adm-primary" disabled={saving}>{saving ? "Salvataggio…" : isNew ? "Crea articolo" : "Salva articolo"}</button>
          {!isNew && <button type="button" className="adm-btn-link adm-danger" onClick={removePost}>Elimina articolo</button>}
        </div>
      </form>

      {!isNew && (
        <>
          <section className="adm-card" aria-labelledby="cover-h">
            <h2 id="cover-h">Copertina dell'articolo</h2>
            {form.image_url && <img className="adm-cover" src={form.image_thumb_url || form.image_url} alt="" />}
            <label className="adm-btn" htmlFor="cover-file">{form.image_url ? "Sostituisci copertina" : "Carica copertina"}</label>
            <input id="cover-file" type="file" accept="image/*" className="sr-only" onChange={e => { onCover(e.target.files[0]); e.target.value = ""; }} />
          </section>

          <section className="adm-card" aria-labelledby="days-h">
            <h2 id="days-h">Giorni del viaggio</h2>
            {days.length === 0 && <p className="adm-hint">Nessun giorno: l'articolo si vede come un racconto unico.</p>}
            {days.map((d, i) => (
              <DayEditor
                key={d.id}
                postId={postId}
                day={d}
                photos={images.filter(img => img.day_id === d.id)}
                setPhotos={photosSetter(d.id)}
                onSaved={(saved) => setDays(ds => ds.map(x => (x.id === saved.id ? saved : x)))}
                onMove={(delta) => moveDay(i, delta)}
                onDelete={() => removeDay(d)}
                isFirst={i === 0}
                isLast={i === days.length - 1}
                onError={onError}
              />
            ))}
            <button type="button" className="adm-btn" onClick={addDay}>+ Aggiungi giorno</button>
          </section>

          <section className="adm-card" aria-labelledby="general-h">
            <h2 id="general-h">Altre foto (senza giorno)</h2>
            <PhotoManager postId={postId} dayId={null} photos={images.filter(img => !img.day_id)}
              setPhotos={photosSetter(null)} onError={onError} />
          </section>
        </>
      )}
    </div>
  );
}
