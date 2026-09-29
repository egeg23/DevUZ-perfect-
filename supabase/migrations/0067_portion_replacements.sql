-- Порция дня: замена за «Не подходит».
--
-- Владелец, 29.09: «В порциях дня давай сделаем функцию: сделать нужно 5 в
-- день, без учёта „не подходит“. То есть именно 5 „связались“, а не 3
-- связались и 2 пропустили. Это и в боте тг должно работать как надо».
--
-- На каждую «Не подходит» человеку выдаётся новая компания из пула —
-- строкой порции со ссылкой на ту, вместо которой она выдана. Цель дня —
-- строки утренней раздачи (replaces пуст); замены в цель не входят.

alter table public.touch_portions
  add column if not exists replaces uuid references public.touch_portions(id) on delete set null;

-- Одна замена на одну пропущенную: двойное нажатие «Не подходит» в боте или
-- два прохода свипа подряд не выдадут за неё две компании.
create unique index if not exists touch_portions_replaces_key
  on public.touch_portions (replaces) where replaces is not null;

comment on column public.touch_portions.replaces is
  'Строка порции, вместо которой выдана эта (там нажали «Не подходит»). Пусто — утренняя раздача.';
