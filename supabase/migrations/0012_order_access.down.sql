-- Откат 0012. Колонки удаляются вместе с данными: выданные покупателям
-- ссылки перестают работать, и это ожидаемо — откат снимает саму функцию.

drop index if exists public.orders_access_token_idx;
drop index if exists public.orders_invoice_no_idx;
drop index if exists public.orders_buyer_chat_idx;
drop index if exists public.orders_bind_code_idx;

alter table public.orders
  drop column if exists access_token_hash,
  drop column if exists access_issued_at,
  drop column if exists buyer_chat_id,
  drop column if exists bind_code,
  drop column if exists invoice_no,
  drop column if exists invoice_issued_at,
  drop column if exists paid_at,
  drop column if exists paid_ref,
  drop column if exists paid_by,
  drop column if exists delivered_at,
  drop column if exists entitlement_version;


drop function if exists public.next_invoice_no();
drop sequence if exists public.invoice_no_seq;
