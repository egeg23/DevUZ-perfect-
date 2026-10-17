-- Продажа после ответа (владелец, 17.10.2026: «Делаем все по твоим
-- рекомендациям, они правдивые»). С 07.10 по 17.10.2026: 453
-- «Здравствуйте» → 206 ответили, 188 получили кружок → 63 ответили после
-- него, «+» — 5, за 30 дней 41 макет и 0 оплат. Механика —
-- lib/admin/sales-after-reply.ts.
--
-- sales_arm — половина A/B, ставится при «Здравствуйте» случайно и поровну:
-- 'old' — как было, 'new' — строка перед кружком, кружок ниши, цена после
-- «+», готовые ответы на возражения, вопрос через 2 дня после «передам
-- руководству», «покажу за 15 минут». Старые касания — null, в A/B не идут.
-- boss_promised_at — клиент написал «передам руководству»;
-- boss_asked_at — ушёл единственный вопрос «Руководитель успел посмотреть?».
alter table public.prospects
  add column if not exists sales_arm text check (sales_arm is null or sales_arm in ('old', 'new')),
  add column if not exists boss_promised_at timestamptz,
  add column if not exists boss_asked_at timestamptz;

create index if not exists prospects_boss_promised_idx
  on public.prospects (boss_promised_at)
  where boss_promised_at is not null and boss_asked_at is null;

-- kind у сообщений касания:
-- 'intro' — строка перед кружком «Это про ваш сайт …, 40 секунд»;
-- 'price' — строка о цене после «+» (договорённость со второй сессией:
--   по ней считается ступень «цена названа», не переименовывать);
-- 'auto'  — входящий автоответчик компании («отвечаем в рабочее время»):
--   ответом не считается.
alter table public.outreach_messages drop constraint if exists outreach_messages_kind_check;
alter table public.outreach_messages
  add constraint outreach_messages_kind_check check (kind in ('text', 'circle', 'intro', 'price', 'auto'));
