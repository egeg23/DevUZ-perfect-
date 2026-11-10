drop index if exists public.scout_tenders_lead_idx;
alter table public.scout_tenders
  drop column if exists lead_id,
  drop column if exists lead_at,
  drop column if exists customer_inn,
  drop column if exists contact_person,
  drop column if exists email,
  drop column if exists phone;
