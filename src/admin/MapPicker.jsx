import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function ClickToSet({ onPick }) {
  useMapEvents({ click: (e) => onPick(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)) });
  return null;
}

// Scelta delle coordinate: clic sulla mappa oppure numeri nei campi.
export default function MapPicker({ lat, lng, onChange, label = "Posizione" }) {
  const has = Number.isFinite(lat) && Number.isFinite(lng);
  const num = (v) => (v === "" ? null : Number(v));
  return (
    <fieldset className="adm-map">
      <legend>{label}</legend>
      <div className="adm-map-box">
        <MapContainer center={has ? [lat, lng] : [30, 10]} zoom={has ? 6 : 2} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          <ClickToSet onPick={(a, b) => onChange(a, b)} />
          {has && <CircleMarker center={[lat, lng]} radius={8} pathOptions={{ color: "#1a1a18", fillColor: "#d4a843", fillOpacity: 1 }} />}
        </MapContainer>
      </div>
      <p className="adm-hint">Clicca sulla mappa per scegliere il punto, oppure scrivi le coordinate.</p>
      <div className="adm-row">
        <label>Latitudine<input type="number" step="any" min="-90" max="90" value={has ? lat : ""} onChange={e => onChange(num(e.target.value), lng)} /></label>
        <label>Longitudine<input type="number" step="any" min="-180" max="180" value={has ? lng : ""} onChange={e => onChange(lat, num(e.target.value))} /></label>
        {has && <button type="button" className="adm-btn-link" onClick={() => onChange(null, null)}>Togli posizione</button>}
      </div>
    </fieldset>
  );
}
