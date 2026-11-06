import { useEffect, useState } from "react";
import "../styles/admin.css";
import { getSession, onAuthChange, signIn, signOut, listPosts } from "./api";
import { usePath, navigateTo } from "../router";
import PostEditor from "./PostEditor";

// Area riservata: /admin (elenco), /admin/nuovo, /admin/post/<id>.
// Non indicizzata (meta robots + header X-Robots-Tag + robots.txt) e protetta
// dalla RLS: anche con la pagina aperta, solo l'amministratore puo' scrivere.
function useNoIndex() {
  useEffect(() => {
    document.title = "Admin · Viaggiare On The Road";
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex, nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await signIn(email, password); }
    catch (err) { setError(err.message === "Invalid login credentials" ? "Email o password non corretti." : err.message); }
    finally { setBusy(false); }
  }
  return (
    <form className="adm-card adm-login" onSubmit={submit}>
      <h1>Accesso</h1>
      {error && <p className="adm-error" role="alert">{error}</p>}
      <label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button type="submit" className="adm-btn adm-primary" disabled={busy}>{busy ? "Accesso…" : "Entra"}</button>
    </form>
  );
}

function PostList() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    listPosts().then(setPosts).catch(e => setError(e.message));
  }, []);
  if (error) return <p className="adm-error" role="alert">{error}</p>;
  if (!posts) return <p role="status">Caricamento…</p>;
  const go = (path) => (e) => { e.preventDefault(); navigateTo(path); };
  return (
    <div>
      <div className="adm-row adm-between">
        <h1>Articoli</h1>
        <a className="adm-btn adm-primary" href="/admin/nuovo" onClick={go("/admin/nuovo")}>+ Nuovo articolo</a>
      </div>
      <ul className="adm-list">
        {posts.map(p => (
          <li key={p.id}>
            {(p.image_thumb_url || p.image_url) ? <img src={p.image_thumb_url || p.image_url} alt="" width="96" height="64" /> : <span className="adm-noimg" />}
            <a href={`/admin/post/${p.id}`} onClick={go(`/admin/post/${p.id}`)}>{p.title_it || "(senza titolo)"}</a>
            <span className={`adm-badge${p.published ? " on" : ""}`}>{p.published ? "Pubblicato" : "Bozza"}</span>
            {p.featured && <span className="adm-badge">In evidenza</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminApp() {
  useNoIndex();
  const path = usePath();
  const [session, setSession] = useState(undefined); // undefined = verifica in corso

  useEffect(() => {
    getSession().then(setSession);
    const sub = onAuthChange(setSession);
    return () => sub.unsubscribe();
  }, []);

  const editMatch = path.match(/^\/admin\/post\/([0-9a-f-]{36})$/);
  return (
    <div className="adm-root">
      <header className="adm-header">
        <a href="/" className="adm-brand"><em>viaggiare</em>·ontheroad <span>admin</span></a>
        {session && (
          <div className="adm-row">
            <span className="adm-hint">{session.user.email}</span>
            <button type="button" className="adm-btn-link" onClick={() => signOut()}>Esci</button>
          </div>
        )}
      </header>
      <main id="main" className="adm-main">
        {session === undefined ? <p role="status">Caricamento…</p>
          : !session ? <Login />
          : path === "/admin/nuovo" ? <PostEditor key="new" />
          : editMatch ? <PostEditor key={editMatch[1]} postId={editMatch[1]} />
          : <PostList />}
      </main>
    </div>
  );
}
