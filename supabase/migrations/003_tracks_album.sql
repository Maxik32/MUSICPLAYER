-- Опционально: поле album для UI (Cover Flow / Now Playing)
alter table public.tracks add column if not exists album text;
