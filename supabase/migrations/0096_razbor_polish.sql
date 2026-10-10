-- Польская версия разбора (владелец, 10.10.2026: «А в польской версии статей
-- вообще, русские показываются»). Как и английскую (0095), её пишет сервер
-- сам из опубликованной русской статьи: lib/razbor/foreign-run.ts.
--
-- slug_pl     — адрес польской версии; не меняется, когда статью пишут заново.
-- article_pl  — статья (та же структура, что article_ru); null — ещё не написана
--               или сброшена правкой русской.
-- pl_tried_at — когда сервер взялся за неё в последний раз: не прошла проверку —
--               повтор через шесть часов, а не каждые пять минут.
alter table public.razbors add column if not exists slug_pl text;
alter table public.razbors add column if not exists article_pl jsonb;
alter table public.razbors add column if not exists pl_tried_at timestamptz;

create unique index if not exists razbors_slug_pl_key on public.razbors (slug_pl) where slug_pl is not null;

-- Почему версия не вышла в последний раз — словами проверки («Числа, которых
-- нет в русской версии: …»). Лог сервера отсюда не виден, а без причины
-- повтор через шесть часов чинить вслепую. Вышла — поле очищается.
alter table public.razbors add column if not exists en_note text;
alter table public.razbors add column if not exists pl_note text;
