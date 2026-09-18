alter table public.prospects
  drop column if exists sent_message_id,
  drop column if exists delivered_at,
  drop column if exists delivery_note;
