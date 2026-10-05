-- Прототип из нескольких страниц.
--
-- Сайт, где у каждого курса или услуги своя страница, не показать одной
-- главной: самое убедительное в нём — устройство целиком, свой адрес,
-- заголовок и описание у каждой страницы. Остальные страницы прототипа
-- живут под той же ссылкой (`/proto/<токен>/kurs/python`) и лежат здесь же,
-- с тем же отпечатком: адрес страницы → готовый html (lib/proto/pages).
--
-- proto_views.path — какую страницу открыли; пусто — главную.

alter table public.protos
  add column if not exists pages jsonb not null default '{}'::jsonb;

comment on column public.protos.pages is
  'Остальные страницы прототипа: {"kurs/python": "<html>"}. Отпечаток — тем же зерном, что у главной (protos.stamp).';

alter table public.proto_views
  add column if not exists path text;
