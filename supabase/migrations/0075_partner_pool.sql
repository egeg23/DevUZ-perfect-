-- Партнёрка: копилка — не забирать автоматически, а копить на ступень выше.
--
-- Владелец, 01.10: «Давай сделаем возможность увеличивать грейд до выплаты.
-- Если партнёр не забирает деньги сразу, то по той же таблице от — до он
-- может получить по достижению тех сумм тот %, который указан. Так мы
-- сохраним деньги вначале и пустим их на развитие студии, а взамен человек
-- позже получит больше. Отдельным тумблером: „не забирать в автоматическом
-- режиме“».
--
-- Правило — lib/partners/rules.ts, раздел «Копилка»: пока тумблер включён,
-- оплаченные и ещё не выплаченные проекты партнёра считаются по ступени их
-- общей суммы, а не каждого по отдельности.

-- Тумблер «Копить, не забирать автоматически».
alter table public.partners add column if not exists accumulate boolean not null default false;

-- Какой выплатой закрыт проект. Пусто — начисление ещё в копилке (или
-- заморожено). Отклонённая выплата возвращает проекты в копилку.
alter table public.projects
  add column if not exists partner_payout_id uuid references public.partner_payouts(id) on delete set null;
create index if not exists projects_partner_payout_idx on public.projects (partner_payout_id) where partner_payout_id is not null;

-- Ставка копилки, по которой проект выплачен. Фиксируется в момент
-- выплаты: после неё копилка обнуляется, а выплаченное пересчитываться
-- вниз не должно.
alter table public.projects
  add column if not exists partner_bonus_percent integer
  check (partner_bonus_percent is null or partner_bonus_percent between 0 and 100);

comment on column public.partners.accumulate is
  'Копилка: автовыплаты выключены, оплаченные невыплаченные проекты считаются по ступени их общей суммы.';
