-- Лиды без лимита (lib/admin/lead-queue.ts, capsShare).
--
-- Владелец, 23.10.2026: «Сотрудникам Дина и Александр руководителю — им
-- делаем безлимит по количеству лидов которые могут брать».
--
-- staff.lead_unlimited = true — ночной потолок равной доли за месяц
-- (withinShare) на человека не действует: ночной лид он берёт сколько
-- угодно. Дневная очередь (полчаса тому, чья очередь) не меняется. Ставит и
-- снимает владелец в «Команде»; каждое изменение — в журнале
-- (staff.lead_unlimited).

alter table public.staff
  add column if not exists lead_unlimited boolean not null default false;
