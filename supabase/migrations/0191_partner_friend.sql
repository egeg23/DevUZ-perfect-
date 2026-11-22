-- «Приведи друга — сайт бесплатно»: участник — партнёр нового вида friend.
--
-- Владелец, 22.11.2026: «Давай будет механика - приведи друга который
-- закажет сайт и получи сайт себе бесплатно». Та же ссылка, слово-промокод и
-- атрибуция, что у партнёров (lib/partners), но награда — подарочный сайт, не
-- деньги: процента и выплат у friend нет (lib/partners/rules.ts,
-- partnerAccrualOf). Подарок считается кодом из проектов и платежей
-- (lib/partners/friend.ts), здесь — только допустимый вид.

alter table public.partners drop constraint if exists partners_kind_check;
alter table public.partners
  add constraint partners_kind_check check (kind in ('person', 'agency', 'friend'));

comment on column public.partners.kind is
  'person — человек по ссылке (ставка по ступеням), agency — агентство: 15% с суммы проекта всегда, friend — «Приведи друга»: за оплатившего друга подарочный сайт, денег нет.';
