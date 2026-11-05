-- Промокод партнёра — слово, которое клиент называет вслух: AZIZ, MEDIAPRO.
--
-- Владелец, 05.11.2026, на разбор «как мы поймём, что клиент от этого
-- блогера»: «Одну ссылку нет, но остальное да, делаем». Ссылка теряется,
-- когда клиент пишет менеджеру в Telegram или звонит; слово — нет: его
-- вписывает менеджер в карточку лида, его узнают бот и чат на сайте.
--
-- Старый код (partners.code, случайные 7 знаков) и коды ссылок остаются:
-- уже разосланные ссылки работают. Промокод — отдельным словом, верхним
-- регистром, единственный среди партнёров (с кодами сверяет код,
-- lib/partners/store.ts, freeWord).

alter table public.partners add column if not exists promo text;

alter table public.partners drop constraint if exists partners_promo_check;
alter table public.partners
  add constraint partners_promo_check check (promo is null or promo ~ '^[A-Z0-9_-]{3,24}$');

create unique index if not exists partners_promo_key on public.partners (promo) where promo is not null;
