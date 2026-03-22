-- Run in Supabase SQL Editor (or migrate). Adjust RLS for your security model.

-- Storage buckets (public read)
insert into storage.buckets (id, name, public)
values
  ('audio_files', 'audio_files', true),
  ('cover_art', 'cover_art', true)
on conflict (id) do nothing;

-- Optional: allow public read on bucket objects
create policy "Public read audio_files"
  on storage.objects for select
  using (bucket_id = 'audio_files');

create policy "Public read cover_art"
  on storage.objects for select
  using (bucket_id = 'cover_art');

-- Authenticated uploads (Step 3 will use these)
create policy "Authenticated upload audio_files"
  on storage.objects for insert
  with check (bucket_id = 'audio_files' and auth.role() = 'authenticated');

create policy "Authenticated upload cover_art"
  on storage.objects for insert
  with check (bucket_id = 'cover_art' and auth.role() = 'authenticated');

-- Tracks
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  description text,
  audio_url text not null,
  cover_url text,
  created_at timestamptz not null default now()
);

alter table public.tracks enable row level security;

create policy "Anyone can read tracks"
  on public.tracks for select
  using (true);

-- Allow inserts for authenticated users (tighten to admin role if needed)
create policy "Authenticated users insert tracks"
  on public.tracks for insert
  with check (auth.role() = 'authenticated');

-- Playlists
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.playlists enable row level security;

create policy "Users read own playlists"
  on public.playlists for select
  using (auth.uid() = user_id);

create policy "Users insert own playlists"
  on public.playlists for insert
  with check (auth.uid() = user_id);

create policy "Users update own playlists"
  on public.playlists for update
  using (auth.uid() = user_id);

create policy "Users delete own playlists"
  on public.playlists for delete
  using (auth.uid() = user_id);

-- Playlist tracks
create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  primary key (playlist_id, track_id)
);

alter table public.playlist_tracks enable row level security;

create policy "Users read playlist_tracks for own playlists"
  on public.playlist_tracks for select
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage playlist_tracks for own playlists"
  on public.playlist_tracks for insert
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

create policy "Users delete playlist_tracks for own playlists"
  on public.playlist_tracks for delete
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

-- Дополнительно: см. migrations/002_listen_chart_favorites.sql
-- (play_count, user_favorites, increment_track_play)
