-- Аудит безопасности базы: две таблицы без защиты строк и функция,
-- которую мог вызвать кто угодно.
--
-- talk_reviews (разборы переписок) и candidate_reviews (разборы резюме —
-- чужие персональные данные) создавались без enable row level security.
-- Остальные сорок таблиц закрыты: читает их только сервер ключом службы,
-- а у публичного ключа нет ни одной политики. У этих двух защиты не было
-- вовсе — прочитать их через REST можно было любым ключом проекта. Сайт
-- публичный ключ не использует и наружу не отдаёт, так что держалось это
-- только на том, что ключ никому не показывали.
alter table public.talk_reviews enable row level security;
alter table public.candidate_reviews enable row level security;

-- proto_opened (счётчик открытий прототипа) — security definer, и вызвать
-- его мог и аноним, и любой вошедший: накрутить открытия чужого прототипа.
-- Зовёт его только сервер ключом службы.
revoke all on function public.proto_opened(uuid) from public, anon, authenticated;
grant execute on function public.proto_opened(uuid) to service_role;
