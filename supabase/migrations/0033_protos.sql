-- Прототип сайта, собранный после первички.
--
-- Владелец: «что если после первичного опроса подагент будет делать прототип
-- сайта? Чисто закрывать лиды на нейронке». Отсюда таблица: прототип живёт по
-- ссылке, которую менеджер отправляет владельцу чужого бизнеса.
--
-- Готовая страница лежит здесь целиком, а не собирается при каждом показе.
-- Причина в том, что генератор будет меняться — добавим нишу, поправим трюк,
-- перекрасим палитру, — а ссылка, которую человек уже открыл и показал
-- партнёру, меняться под ним не должна. Хранимый html замораживает ровно то,
-- что мы отправили.
create table if not exists public.protos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  /*
   * Токен лежит открытым, а не хешем, и это отличается от договоров
   * намеренно.
   *
   * У договора ссылка одноразовая: показали один раз, дальше только выпустить
   * новую. Для прототипа это было бы вредно — менеджер отправляет ссылку в
   * переписке, теряет чат, отправляет ещё раз тому же человеку, и так
   * несколько раз за неделю. За токеном при этом стоит страница, собранная
   * из того, что компания сама опубликовала у себя на сайте, закрытая от
   * индексации. Утечка токена открывает ровно её.
   */
  token text not null unique,

  /** Кого разбирали. Прототип может быть и без лида — например, для показа. */
  prospect_id uuid references public.prospects(id) on delete set null,

  niche text not null,
  locale text not null default 'ru' check (locale in ('ru', 'uz')),
  name text not null,
  /** Сайт, с которого взяты факты. Печатается в подвале самого прототипа. */
  source text not null,

  /** Факты как есть: из чего собрана страница. Без них нечего пересобирать. */
  facts jsonb not null,
  html text not null,
  /** Что нашла машинная проверка. Пустой список — можно отправлять. */
  problems jsonb not null default '[]'::jsonb,

  status text not null default 'draft' check (status in ('draft', 'ready', 'sent')),
  created_by uuid references public.staff(id) on delete set null,
  sent_at timestamptz,

  /*
   * Открыл ли владелец ссылку — это то, ради чего менеджер вообще смотрит в
   * эту таблицу. Открыл и вернулся второй раз — звонить сегодня; не открыл
   * за два дня — прототип не дошёл, и дело не в прототипе.
   */
  opened_at timestamptz,
  opens integer not null default 0
);

create index if not exists protos_fresh on public.protos (created_at desc);
create index if not exists protos_prospect on public.protos (prospect_id) where prospect_id is not null;

alter table public.protos enable row level security;

-- Счётчик открытий увеличивается в базе, а не в приложении.
--
-- Читать значение, прибавлять единицу и записывать обратно — значит терять
-- открытия каждый раз, когда владелец переслал ссылку и её открыли двое
-- разом. Ровно тогда, когда счётчик важнее всего.
create or replace function public.proto_opened(proto uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.protos
     set opens = opens + 1,
         opened_at = coalesce(opened_at, now())
   where id = proto;
$$;
