import { useState } from "react";
import { updateDay } from "./api";
import MapPicker from "./MapPicker";
import PhotoManager from "./PhotoManager";

const FIELDS = ["date", "place_it", "place_en", "lat", "lng", "title_it", "title_en", "body_it", "body_en"];

// Un giorno del viaggio: dati, posizione e foto. I testi si salvano con
// "Salva giorno"; le foto si salvano subito al caricamento.
export default function DayEditor({ postId, day, photos, setPhotos, onSaved, onMove, onDelete, isFirst, isLast, onError }) {
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map(f => [f, day[f] ?? (f === "lat" || f === "lng" ? null : "")])));
  const [open, setOpen] = useState(!day.title_it);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const fields = { ...form, date: form.date || null };
      for (const k of ["place_it", "place_en", "title_it", "title_en", "body_it", "body_en"]) fields[k] = fields[k] || null;
      const saved = await updateDay(day.id, fields);
      onSaved(saved);
      setSavedAt(new Date());
    } catch (e) { onError(e.message); }
    finally { setSaving(false); }
  }

  // Aggiornamento immediato della scelta; se il salvataggio fallisce si torna indietro.
  async function setCover(imageId) {
    const previous = day.cover_image_id;
    onSaved({ ...day, cover_image_id: imageId });
    try { onSaved(await updateDay(day.id, { cover_image_id: imageId })); }
    catch (e) { onSaved({ ...day, cover_image_id: previous }); onError(e.message); }
  }

  const headingId = `day-${day.id}-h`;
  return (
    <section className="adm-day" aria-labelledby={headingId}>
      <div className="adm-day-head">
        <h3 id={headingId}>Giorno {day.day_number}{day.title_it ? ` — ${day.title_it}` : ""}</h3>
        <div className="adm-row">
          <button type="button" className="adm-btn-link" disabled={isFirst} onClick={() => onMove(-1)} aria-label={`Sposta il giorno ${day.day_number} prima`}>↑</button>
          <button type="button" className="adm-btn-link" disabled={isLast} onClick={() => onMove(1)} aria-label={`Sposta il giorno ${day.day_number} dopo`}>↓</button>
          <button type="button" className="adm-btn-link" aria-expanded={open} onClick={() => setOpen(o => !o)}>{open ? "Chiudi" : "Modifica"}</button>
          <button type="button" className="adm-btn-link adm-danger" onClick={onDelete}>Elimina giorno</button>
        </div>
      </div>

      {open && (
        <div className="adm-day-body">
          <div className="adm-grid2">
            <label>Data<input type="date" value={form.date || ""} onChange={e => set("date", e.target.value)} /></label>
            <span />
            <label>Luogo (IT)<input value={form.place_it} onChange={e => set("place_it", e.target.value)} placeholder="es. Kyoto" /></label>
            <label>Luogo (EN)<input value={form.place_en} onChange={e => set("place_en", e.target.value)} /></label>
            <label>Titolo (IT)<input value={form.title_it} onChange={e => set("title_it", e.target.value)} /></label>
            <label>Titolo (EN)<input value={form.title_en} onChange={e => set("title_en", e.target.value)} /></label>
            <label>Testo (IT)<textarea rows={8} value={form.body_it} onChange={e => set("body_it", e.target.value)} /></label>
            <label>Testo (EN)<textarea rows={8} value={form.body_en} onChange={e => set("body_en", e.target.value)} /></label>
          </div>
          <MapPicker lat={form.lat} lng={form.lng} label="Posizione del giorno (per il percorso sulla mappa)"
            onChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))} />
          <div className="adm-row">
            <button type="button" className="adm-btn adm-primary" onClick={save} disabled={saving}>{saving ? "Salvataggio…" : "Salva giorno"}</button>
            {savedAt && <span className="adm-ok" role="status">Salvato alle {savedAt.toLocaleTimeString("it-IT")}</span>}
          </div>
        </div>
      )}

      <h4 className="adm-sub">Foto del giorno {day.day_number}</h4>
      <PhotoManager postId={postId} dayId={day.id} photos={photos} setPhotos={setPhotos}
        coverId={day.cover_image_id} onSetCover={setCover} onError={onError} />
    </section>
  );
}
