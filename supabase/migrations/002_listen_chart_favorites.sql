-- Прослушивания, избранное, RPC для счётчика. Выполните в SQL Editor, если ещё не применено.

alter table public.tracks
  add column if not exists play_count bigint not null default 0;

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.user_favorites enable row level security;

drop policy if exists "Users read own favorites" on public.user_favorites;
create policy "Users read own favorites"
  on public.user_favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own favorites" on public.user_favorites;
create policy "Users insert own favorites"
  on public.user_favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own favorites" on public.user_favorites;
create policy "Users delete own favorites"
  on public.user_favorites for delete
  using (auth.uid() = user_id);

create or replace function public.increment_track_play(p_track_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tracks
  set play_count = play_count + 1
  where id = p_track_id;
end;
$$;

grant execute on function public.increment_track_play(uuid) to anon;
grant execute on function public.increment_track_play(uuid) to authenticated;
