-- PROPOSTA di policy RLS per viaggiare·ontheroad. NON ancora applicata.
-- Rivedi e adatta prima di eseguirla (SQL Editor di Supabase).
--
-- Perche': la chiave pubblica e' leggibile da chiunque dal bundle del sito.
-- Cio' che protegge i dati e' la RLS, non il filtro .eq("published", true)
-- nel codice client. Senza policy, le bozze (published = false) possono essere
-- lette da chiunque conosca l'URL del progetto e la chiave.
-- Doc ufficiale: https://supabase.com/docs/guides/api/api-keys
--
-- Assunzioni (ricavate dal codice, da verificare sul tuo schema):
--   public.posts(id, published boolean, ...)
--   public.post_images(id, post_id -> posts.id, position, url, ...)
-- Le scritture avvengono dalla dashboard / service role, che bypassano la RLS.

alter table public.posts       enable row level security;
alter table public.post_images enable row level security;

drop policy if exists "Lettura pubblica dei post pubblicati" on public.posts;
create policy "Lettura pubblica dei post pubblicati"
  on public.posts
  for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Lettura pubblica immagini di post pubblicati" on public.post_images;
create policy "Lettura pubblica immagini di post pubblicati"
  on public.post_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_images.post_id and p.published = true
    )
  );

-- Verifica rapida (da eseguire dopo, come anon):
--   set role anon;
--   select count(*) from public.posts where published = false;  -- deve dare 0
--   reset role;
