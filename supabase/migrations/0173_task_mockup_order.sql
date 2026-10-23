-- Заказ макета в задаче (lib/admin/mockup-order.ts, mockup-order-store.ts).
--
-- Владелец, 23.10.2026: «На меня менеджеры через нашу crm ставят задачу,
-- может сделать обязательное поле: МАКЕТ (да/нет)? Тогда мы кодом сможем
-- определять ответственного за макеты. Если нажимает — да, значит он
-- ответственный за работу по этому макету с клиентом». На план — «Делаем».
--
-- mockup — ответ в форме: null — не спрашивали (задача не владельцу или
-- поставлена до правила), false — «нет», true — заказ макета. У заказа —
-- клиент (лид или касание) и сайт. mockup_ref — какой макет собран по
-- заказу: «p:<прототип>» или «s:<проект витрины>», как mockup_offers.mockup_ref.
-- Ответственный за макет «по заказу» — тот, кто поставил задачу.

alter table public.staff_tasks
  add column if not exists mockup boolean,
  add column if not exists mockup_lead_id uuid references public.leads(id) on delete set null,
  add column if not exists mockup_prospect_id uuid references public.prospects(id) on delete set null,
  add column if not exists mockup_site text,
  add column if not exists mockup_ref text;

create index if not exists staff_tasks_mockup_ref_idx
  on public.staff_tasks (mockup_ref) where mockup_ref is not null;
create index if not exists staff_tasks_mockup_open_idx
  on public.staff_tasks (assignee_id) where mockup is true and mockup_ref is null;
