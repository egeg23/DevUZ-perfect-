-- Порядок в лидах (lib/admin/lead-tidy.ts). Владелец, 13.10.2026: лидов
-- «в работе» 434, ни один не отмечен «выиграли». Бот по утрам спрашивает,
-- чем кончилось, а забытые 21+ день закрывает «проиграли» сам.
alter table public.leads
  add column if not exists tidy_asked_at timestamptz,
  add column if not exists tidy_snoozed_until timestamptz,
  add column if not exists tidy_auto_lost_at timestamptz;

comment on column public.leads.tidy_asked_at is 'Когда бот последний раз спросил «чем кончилось» по лиду без движения.';
comment on column public.leads.tidy_snoozed_until is '«⏳ Ещё в работе»: не спрашивать до этого времени.';
comment on column public.leads.tidy_auto_lost_at is 'Бот закрыл «проиграли» сам; снимается любой сменой статуса.';
