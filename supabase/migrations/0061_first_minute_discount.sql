-- Минута на скидку: написал ассистенту в первую минуту на сайте — скидка 30%
-- закреплена (lib/qualify/minute.ts).
--
-- Скидка 30% теперь выдаётся по двум причинам, и у лида видно, по какой:
-- promise — не уложились в 20 секунд ответа, minute — клиент написал, пока
-- шёл таймер первой минуты. Менеджеру это нужно, чтобы не извиняться за
-- ожидание, которого не было; владельцу — чтобы видеть цену каждой механики.
alter table public.leads
  add column if not exists discount_reason text
  check (discount_reason in ('promise', 'minute'));

-- Всё, что выдано раньше, выдано гарантией двадцати секунд: другой причины
-- до этой миграции не было.
update public.leads
   set discount_reason = 'promise'
 where discount_granted
   and discount_reason is null;

-- Закрепление за чатом бота. Сессии бота живут в памяти процесса и теряются
-- при выкатке, а скидка «закрепляется за человеком» — значит, переживает и
-- выкатку, и разговор через неделю.
create table if not exists public.discount_claims (
  chat_id bigint primary key,
  reason text not null default 'minute' check (reason in ('minute')),
  claimed_at timestamptz not null default now()
);

alter table public.discount_claims enable row level security;
