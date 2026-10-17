-- Панель — приложение на телефоне: пуш-подписки устройств и вход кодом.
--
-- Владелец, 17.10.2026: «если сотрудники выносят сайт на экран, чтобы оно
-- было как приложение типа и были пуш уведомления… Если менеджеры заходят с
-- телефона, уведомления по лидам и тд чтобы приходили + я могу делать
-- рассылки». На план ответил: «Делаем».
--
-- push_subscriptions — одно устройство сотрудника (телефон, ПК): адрес
-- службы пуша браузера и ключи шифрования. Сообщения бота сотруднику уходят
-- сюда зеркалом (lib/admin/push-mirror.ts). Ответ службы 404/410 — подписка
-- мертва, строка удаляется.
--
-- app_login_codes — вход в установленное приложение кодом из бота: у
-- приложения на iPhone свои куки, отдельные от Safari, и ссылка входа из
-- бота открылась бы в Safari. Строка — одна попытка входа: приложение
-- заводит её нажатием «Получить код в боте», бот кладёт сюда хеш шести
-- цифр того сотрудника, который нажал ссылку. Код живёт 5 минут, гасится
-- первым верным вводом, после 5 неверных — только новый.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device text,
  created_at timestamptz not null default now(),
  last_ok_at timestamptz,
  last_error text,
  last_error_at timestamptz
);

create index if not exists push_subscriptions_staff_idx on public.push_subscriptions (staff_id);

alter table public.push_subscriptions enable row level security;

comment on table public.push_subscriptions is
  'Пуш-подписки устройств сотрудников (панель как приложение): сюда зеркалом уходят сообщения бота сотруднику.';
comment on column public.push_subscriptions.device is
  'Подпись устройства для «Команды»: «iPhone · приложение», «Android · Chrome», «Компьютер».';

create table if not exists public.app_login_codes (
  id uuid primary key default gen_random_uuid(),
  request_hash text not null unique,
  staff_id uuid references public.staff (id) on delete cascade,
  code_hash text,
  attempts integer not null default 0,
  issued_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_login_codes_created_idx on public.app_login_codes (created_at);

alter table public.app_login_codes enable row level security;

comment on table public.app_login_codes is
  'Вход в приложение панели кодом из бота: попытка входа приложения (хеш куки), хеш кода, счёт неверных вводов.';
