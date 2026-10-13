-- Последнее нажатие кнопки в боте — признак «на месте» для очереди тёплых
-- лидов (lib/admin/lead-queue.ts, activeNow). Владелец, 13.10.2026:
-- лид днём предлагается сначала тем, кто был активен за последние 30 минут.
alter table public.staff add column if not exists bot_seen_at timestamptz;
