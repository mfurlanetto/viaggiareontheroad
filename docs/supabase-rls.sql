-- Sicurezza del database di viaggiare·ontheroad
-- Progetto Supabase "viaggiare-ontheroad" (eu-west-1). Stato verificato il 2026-11-06.
--
-- Questo file DOCUMENTA cio' che e' gia' applicato al progetto (vedi la lista
-- delle migrazioni in Dashboard > Database > Migrations) e come annullarlo.
-- Non va rieseguito: le migrazioni sono gia' attive.
-- <UUID-ADMIN> = id dell'unico utente amministratore (Authentication > Users).
--
-- Perche' conta: la chiave pubblica (publishable key) e' leggibile da chiunque nel
-- bundle del sito; cio' che protegge i dati e' la RLS, non i filtri nel codice.
-- Doc ufficiale: https://supabase.com/docs/guides/api/api-keys
--
-- ───────────── STATO ATTUALE ─────────────
-- Tabelle public.posts e public.post_images (RLS attiva su entrambe)
--   * anon: solo SELECT; legge i post con published = true e le immagini dei
--     post pubblicati.
--   * authenticated: SELECT/INSERT/UPDATE/DELETE solo se auth.uid() = <UUID-ADMIN>
--     (l'admin vede anche le bozze).
--   * posts.published: NOT NULL, default false (un post nuovo nasce bozza).
--   * posts.lat / posts.lng: coordinate per la mappa (nullable, con CHECK di range).
--
-- Storage, bucket "post-images" (pubblico: i file si leggono tramite URL pubblico)
--   * Elenco, upload, modifica e cancellazione dei file solo per <UUID-ADMIN>.
--   * Limite 10 MB per file; tipi ammessi: image/jpeg, image/png, image/webp, image/avif.
--   * La dashboard Supabase usa la service role e non e' soggetta a queste policy,
--     ma limite di dimensione e tipi valgono anche li'.
--
-- Auth e chiavi (impostazioni dalla dashboard, non SQL)
--   * Registrazioni pubbliche disattivate.
--   * Chiavi JWT legacy disattivate (anon verificata disabled); il sito usa la
--     publishable key (sb_publishable_...).
--   * DA FARE: "Leaked password protection" e' disattivata (advisor WARN):
--     https://supabase.com/docs/guides/auth/password-security
--
-- ───────────── MIGRAZIONI APPLICATE ─────────────
-- 1) rls_hardening_admin_only_writes
--    Revoca ad anon di INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER e ad
--    authenticated di TRUNCATE/REFERENCES/TRIGGER; policy di scrittura e di
--    lettura completa solo per <UUID-ADMIN> su posts e post_images.
--
-- 2) storage_post_images_admin_only
--    Sostituite le policy "Immagini pubbliche" (elenco aperto a tutti),
--    "Upload autenticati" e "Delete autenticati" (qualsiasi utente loggato) con:

create policy "post-images: admin legge/elenca" on storage.objects
  for select to authenticated
  using (bucket_id = 'post-images' and (select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "post-images: admin carica" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "post-images: admin modifica" on storage.objects
  for update to authenticated
  using      (bucket_id = 'post-images' and (select auth.uid()) = '<UUID-ADMIN>'::uuid)
  with check (bucket_id = 'post-images' and (select auth.uid()) = '<UUID-ADMIN>'::uuid);
create policy "post-images: admin elimina" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (select auth.uid()) = '<UUID-ADMIN>'::uuid);
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
 where id = 'post-images';

-- 3) posts_published_default_false
alter table public.posts alter column published set default false;
alter table public.posts alter column published set not null;
--    + il post "Cina" (id 21ea82d1-...), senza data, immagine e testi, riportato a bozza.

-- 4) posts_add_lat_lng
alter table public.posts add column if not exists lat double precision;
alter table public.posts add column if not exists lng double precision;
alter table public.posts add constraint posts_lat_range check (lat is null or lat between -90 and 90);
alter table public.posts add constraint posts_lng_range check (lng is null or lng between -180 and 180);
--    + popolate con le coordinate prima scritte in src/TravelMap.jsx.

-- 5) posts_add_slug + posts_slug_private_helpers
--    Colonna posts.slug (NOT NULL, UNIQUE, formato [a-z0-9-]) per gli URL
--    /articoli/<slug>; popolata dai titoli italiani. Trigger posts_set_slug
--    (SECURITY DEFINER) genera lo slug quando manca, con suffisso -2, -3... sui
--    duplicati; uno slug esistente non viene mai cambiato. La funzione slugify sta
--    nello schema private (non esposto all'API). Estensione unaccent.
--
-- 6) auto_rebuild_on_post_change
--    Estensioni pg_net e pg_cron; schema private (nessun permesso ad anon e
--    authenticated) con la tabella private.site_rebuild. Trigger su posts (solo
--    righe pubblicate prima o dopo la modifica) e post_images che segnano
--    dirty = true; job cron 'site-rebuild' ogni minuto che, se l'ultima modifica
--    ha piu' di 45 s, chiama via net.http_post l'URL salvato nel Vault come
--    'vercel_deploy_hook' (deve iniziare con https://api.vercel.com/).
--    Senza segreto il job non fa nulla e lo annota in private.site_rebuild.note.

-- ───────────── VERIFICHE (SQL editor) ─────────────
--   set role anon;
--   select count(*) from public.posts where published = false;   -- atteso 0
--   insert into public.posts (continent, category, date, read_time)
--     values ('x', 'x', 'x', 1);                                  -- atteso: permission denied
--   insert into storage.objects (bucket_id, name)
--     values ('post-images', 'x.jpg');                            -- atteso: permission denied
--   reset role;
--
-- ───────────── RIPRISTINO (solo se serve tornare indietro) ─────────────
-- 6) select cron.unschedule('site-rebuild');
--    drop trigger posts_mark_site_dirty on public.posts;
--    drop trigger post_images_mark_site_dirty on public.post_images;
--    drop schema private cascade;   -- ATTENZIONE: rimuove anche private.slugify (usata dal 5)
--    il segreto 'vercel_deploy_hook' si elimina dal Vault nella dashboard Supabase.
--
-- 5) drop trigger posts_set_slug on public.posts;
--    drop function public.posts_set_slug();
--    alter table public.posts drop column slug;   -- il sito torna senza URL per articolo
--
-- 4) drop delle colonne: il frontend tollera la loro assenza (ripiega su select *),
--    ma la mappa restera' vuota.
--    alter table public.posts drop column lat, drop column lng;
--
-- 3) alter table public.posts alter column published drop not null;
--    alter table public.posts alter column published set default true;
--
-- 2) drop policy if exists "post-images: admin legge/elenca" on storage.objects;
--    drop policy if exists "post-images: admin carica"       on storage.objects;
--    drop policy if exists "post-images: admin modifica"     on storage.objects;
--    drop policy if exists "post-images: admin elimina"      on storage.objects;
--    create policy "Immagini pubbliche" on storage.objects for select to public
--      using (bucket_id = 'post-images');
--    create policy "Upload autenticati" on storage.objects for insert to public
--      with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
--    create policy "Delete autenticati" on storage.objects for delete to public
--      using (bucket_id = 'post-images' and auth.role() = 'authenticated');
--    update storage.buckets set file_size_limit = null, allowed_mime_types = null
--      where id = 'post-images';
--
-- 1) drop policy if exists "Admin legge tutti i post"        on public.posts;
--    drop policy if exists "Admin inserisce post"            on public.posts;
--    drop policy if exists "Admin modifica post"             on public.posts;
--    drop policy if exists "Admin elimina post"              on public.posts;
--    drop policy if exists "Admin legge tutte le immagini"   on public.post_images;
--    drop policy if exists "Admin inserisce immagini"        on public.post_images;
--    drop policy if exists "Admin modifica immagini"         on public.post_images;
--    drop policy if exists "Admin elimina immagini"          on public.post_images;
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
--    grant all on public.posts, public.post_images to anon;
--    grant truncate, references, trigger on public.posts, public.post_images to authenticated;
