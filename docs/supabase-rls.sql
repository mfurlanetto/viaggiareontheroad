-- Stato RLS di viaggiare·ontheroad e hardening.
-- Progetto Supabase "viaggiare-ontheroad" (eu-west-1).
-- 2026-11-06: stato iniziale verificato in sola lettura; i punti 1 e 2 qui sotto
-- sono stati APPLICATI come migrazione "rls_hardening_admin_only_writes"
-- (con <UUID-ADMIN> = unico utente Auth) e verificati: lettura pubblica dei soli post
-- pubblicati OK, scrittura anon bloccata, utente non admin bloccato, admin consentito.
-- Il punto 0 (disattivare le registrazioni) resta da fare dalla dashboard.
-- Il ripristino esatto dello stato iniziale e' al punto 4.
--
-- Perche' conta: la chiave pubblica e' leggibile da chiunque dal bundle del sito;
-- cio' che protegge i dati e' la RLS, non il filtro .eq("published", true) del codice.
-- Doc ufficiale: https://supabase.com/docs/guides/api/api-keys
--
-- ───────────── STATO ATTUALE (osservato) ─────────────
-- * RLS attiva su public.posts e public.post_images.                       OK
-- * Lettura: posts solo con published = true; post_images solo se il post
--   e' pubblicato. Le bozze non sono leggibili con la chiave pubblica.      OK
-- * Scrittura: INSERT/UPDATE/DELETE su entrambe le tabelle sono consentiti a
--   QUALSIASI utente autenticato (auth.role() = 'authenticated' oppure true).
--   Oggi esiste un solo utente Auth, ma se le registrazioni sono aperte
--   chiunque puo' crearsi un account e poi modificare o cancellare i contenuti.
--                                                                          DA CORREGGERE
-- * Il ruolo anon ha tutti i privilegi sulle tabelle (default Supabase). La RLS
--   li limita, ma TRUNCATE non e' soggetto a RLS. Non e' raggiungibile dall'API
--   REST, ma e' meglio toglierlo (difesa in profondita').                   CONSIGLIATO
-- * Advisor di sicurezza: "Leaked Password Protection Disabled" (WARN).
--   https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
--
-- ───────────── PROPOSTE ─────────────
-- 0) Dashboard (la mossa piu' efficace, senza SQL): Authentication > Sign In /
--    Providers > disattiva "Allow new users to sign up". Con un solo utente
--    amministratore, nessun altro potra' registrarsi.
--
-- 1) Togliere ad anon (e a authenticated) i privilegi non usati.
--    Dopo questo, anon puo' solo leggere (SELECT), comunque filtrato dalla RLS.

revoke insert, update, delete, truncate, references, trigger on public.posts       from anon;
revoke insert, update, delete, truncate, references, trigger on public.post_images from anon;
revoke truncate, references, trigger on public.posts       from authenticated;
revoke truncate, references, trigger on public.post_images from authenticated;

-- 2) Scrittura solo per l'amministratore (non per qualunque utente autenticato).
--    Sostituisci <UUID-ADMIN> con l'id del tuo utente: Authentication > Users.
--    Finche' resta il segnaposto, lo script fallisce: e' voluto.
--    Se le modifiche le fai solo dalla dashboard/SQL editor (service role), che
--    bypassano la RLS, queste policy non cambiano il tuo flusso di lavoro.

drop policy if exists "Insert autenticato"                  on public.posts;
drop policy if exists "Update autenticato"                  on public.posts;
drop policy if exists "Delete autenticato"                  on public.posts;
drop policy if exists "authenticated can insert post images" on public.post_images;
drop policy if exists "authenticated can update post images" on public.post_images;
drop policy if exists "authenticated can delete post images" on public.post_images;

create policy "Admin legge tutti i post" on public.posts
  for select to authenticated
  using ((select auth.uid()) = '<UUID-ADMIN>'::uuid);   -- vede anche le bozze
create policy "Admin inserisce post" on public.posts
  for insert to authenticated
  with check ((select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "Admin modifica post" on public.posts
  for update to authenticated
  using      ((select auth.uid()) = '<UUID-ADMIN>'::uuid)
  with check ((select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "Admin elimina post" on public.posts
  for delete to authenticated
  using ((select auth.uid()) = '<UUID-ADMIN>'::uuid);

create policy "Admin legge tutte le immagini" on public.post_images
  for select to authenticated
  using ((select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "Admin inserisce immagini" on public.post_images
  for insert to authenticated
  with check ((select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "Admin modifica immagini" on public.post_images
  for update to authenticated
  using      ((select auth.uid()) = '<UUID-ADMIN>'::uuid)
  with check ((select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "Admin elimina immagini" on public.post_images
  for delete to authenticated
  using ((select auth.uid()) = '<UUID-ADMIN>'::uuid);

-- 3) Verifica dopo l'esecuzione (SQL editor):
--    set role anon;
--    select count(*) from public.posts where published = false;   -- atteso 0
--    insert into public.posts (continent, category, date, read_time)
--      values ('x', 'x', 'x', 1);                                  -- atteso: permission denied
--    reset role;
--
-- 4) Ripristino dello stato iniziale (da eseguire solo se serve tornare indietro).
--    Riporta le policy e i privilegi com'erano prima della migrazione.
--
--    drop policy if exists "Admin legge tutti i post"        on public.posts;
--    drop policy if exists "Admin inserisce post"            on public.posts;
--    drop policy if exists "Admin modifica post"             on public.posts;
--    drop policy if exists "Admin elimina post"              on public.posts;
--    drop policy if exists "Admin legge tutte le immagini"   on public.post_images;
--    drop policy if exists "Admin inserisce immagini"        on public.post_images;
--    drop policy if exists "Admin modifica immagini"         on public.post_images;
--    drop policy if exists "Admin elimina immagini"          on public.post_images;
--
--    create policy "Insert autenticato" on public.posts for insert to public
--      with check (auth.role() = 'authenticated'::text);
--    create policy "Update autenticato" on public.posts for update to public
--      using (auth.role() = 'authenticated'::text);
--    create policy "Delete autenticato" on public.posts for delete to public
--      using (auth.role() = 'authenticated'::text);
--    create policy "authenticated can insert post images" on public.post_images
--      for insert to authenticated with check (true);
--    create policy "authenticated can update post images" on public.post_images
--      for update to authenticated using (true);
--    create policy "authenticated can delete post images" on public.post_images
--      for delete to authenticated using (true);
--
--    grant all on public.posts, public.post_images to anon;
--    grant truncate, references, trigger on public.posts, public.post_images to authenticated;
