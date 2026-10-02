-- Защита макетов: скрытый отпечаток прототипа и журнал его открытий.
--
-- Владелец, 03.10.2026: «в коде делать маркеры, которые не будут видны, но в
-- случае разбирательств станут доказательствами нашей разработки», и это
-- правило — для всех макетов, сделанных и будущих.
--
-- stamp — какие числа оформления сдвинуты у этого прототипа и как: по ним
-- «Проверить сайт» узнаёт макет на чужом сайте. Только здесь, в странице о
-- нём нет ни слова. Старые прототипы получают отпечаток при первом открытии.
--
-- proto_views — журнал показа: каждое открытие живым человеком (превью
-- мессенджеров и открытия из панели не пишутся) с временем, адресом и
-- браузером. Это доказательство того, что клиент видел макет и когда.

alter table public.protos
  add column if not exists stamp jsonb;

comment on column public.protos.stamp is
  'Скрытый отпечаток: {v, seed, signals} — сдвинутые значения оформления этого прототипа. Только для проверки чужих сайтов.';

create table if not exists public.proto_views (
  id bigint generated always as identity primary key,
  proto_id uuid not null references public.protos(id) on delete cascade,
  at timestamptz not null default now(),
  ip text,
  user_agent text,
  referer text
);

comment on table public.proto_views is
  'Журнал показа прототипов: кто и когда открыл ссылку. Доказательство акцепта условий использования макетов.';

create index if not exists proto_views_proto on public.proto_views (proto_id, at desc);

alter table public.proto_views enable row level security;
