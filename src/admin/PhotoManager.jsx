import { useState } from "react";
import { addPhoto, updateImage, deletePhoto } from "./api";

// Foto di un giorno (dayId) o della galleria generale (dayId = null):
// caricamento multiplo con ridimensionamento, didascalie it/en, testo
// alternativo, ordine, copertina (solo per i giorni) ed eliminazione.
export default function PhotoManager({ postId, dayId, photos, setPhotos, coverId, onSetCover, onError }) {
  const [busy, setBusy] = useState(null); // "Caricamento 2 di 5…"
  const [drafts, setDrafts] = useState({}); // modifiche ai testi non ancora salvate

  const sorted = [...photos].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  async function onFiles(files) {
    const list = [...files];
    if (!list.length) return;
    let pos = sorted.length ? Math.max(...sorted.map(p => p.position ?? 0)) + 1 : 1;
    const added = [];
    try {
      for (const [i, file] of list.entries()) {
        setBusy(`Caricamento ${i + 1} di ${list.length}…`);
        added.push(await addPhoto(postId, dayId, file, pos++));
        setPhotos(prev => [...prev, added[added.length - 1]]);
      }
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(null);
    }
  }

  const draft = (img) => ({ ...img, ...(drafts[img.id] || {}) });
  const setField = (id, field, value) => setDrafts(d => ({ ...d, [id]: { ...(d[id] || {}), [field]: value } }));

  async function saveTexts(img) {
    const d = drafts[img.id];
    if (!d) return;
    try {
      const saved = await updateImage(img.id, d);
      setPhotos(prev => prev.map(p => (p.id === img.id ? saved : p)));
      setDrafts(x => { const y = { ...x }; delete y[img.id]; return y; });
    } catch (e) { onError(e.message); }
  }

  async function move(img, delta) {
    const i = sorted.findIndex(p => p.id === img.id);
    const other = sorted[i + delta];
    if (!other) return;
    try {
      const [a, b] = await Promise.all([
        updateImage(img.id, { position: other.position }),
        updateImage(other.id, { position: img.position }),
      ]);
      setPhotos(prev => prev.map(p => (p.id === a.id ? a : p.id === b.id ? b : p)));
    } catch (e) { onError(e.message); }
  }

  async function remove(img) {
    if (!window.confirm("Eliminare definitivamente questa foto (anche il file)?")) return;
    try {
      await deletePhoto(img);
      setPhotos(prev => prev.filter(p => p.id !== img.id));
    } catch (e) { onError(e.message); }
  }

  const inputId = `files-${dayId || "general"}`;
  return (
    <div className="adm-photos">
      <div className="adm-drop"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}>
        <label htmlFor={inputId} className="adm-btn">+ Aggiungi foto</label>
        <input id={inputId} type="file" accept="image/*" multiple className="sr-only"
          onChange={e => { onFiles(e.target.files); e.target.value = ""; }} />
        <span className="adm-hint">oppure trascinale qui. Vengono ridotte a 1600 px (e miniatura 600 px) e i dati GPS vengono rimossi.</span>
        {busy && <span className="adm-busy" role="status">{busy}</span>}
      </div>

      {sorted.length > 0 && (
        <ul className="adm-photo-list">
          {sorted.map((img, i) => {
            const d = draft(img);
            const dirty = !!drafts[img.id];
            return (
              <li key={img.id} className="adm-photo">
                <img src={img.thumb_url || img.url} alt="" width="160" height="107" />
                <div className="adm-photo-fields">
                  <label>Didascalia (IT)<input value={d.caption_it || ""} onChange={e => setField(img.id, "caption_it", e.target.value)} /></label>
                  <label>Didascalia (EN)<input value={d.caption_en || ""} onChange={e => setField(img.id, "caption_en", e.target.value)} /></label>
                  <label>Testo alternativo (IT) <span className="adm-hint">cosa si vede, per chi non vede l'immagine</span>
                    <input value={d.alt_it || ""} onChange={e => setField(img.id, "alt_it", e.target.value)} /></label>
                  <label>Testo alternativo (EN)<input value={d.alt_en || ""} onChange={e => setField(img.id, "alt_en", e.target.value)} /></label>
                  <div className="adm-row">
                    {dirty && <button type="button" className="adm-btn" onClick={() => saveTexts(img)}>Salva testi</button>}
                    {onSetCover && (
                      <label className="adm-check">
                        <input type="radio" name={`cover-${dayId}`} checked={coverId === img.id} onChange={() => onSetCover(img.id)} />
                        Copertina del giorno
                      </label>
                    )}
                    <button type="button" className="adm-btn-link" disabled={i === 0} onClick={() => move(img, -1)} aria-label="Sposta prima">↑</button>
                    <button type="button" className="adm-btn-link" disabled={i === sorted.length - 1} onClick={() => move(img, 1)} aria-label="Sposta dopo">↓</button>
                    <button type="button" className="adm-btn-link adm-danger" onClick={() => remove(img)}>Elimina</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
