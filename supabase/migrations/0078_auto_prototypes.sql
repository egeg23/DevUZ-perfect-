-- Прототип заранее: собирается сам, пока готовится письмо касания, и уходит
-- в письме ссылкой вместо обещания «соберём за 12 часов».
--
-- Владелец, 02.10.2026: «Давай пункт 1, максимально автоматизируй его» —
-- брать компании из пула касаний с худшими сайтами, заранее собирать им
-- прототипы и отправлять в касании ссылку вместо обещания.

alter table public.prospects
  add column if not exists proto_url text,
  add column if not exists proto_tried_at timestamptz,
  add column if not exists proto_note text;

comment on column public.prospects.proto_url is
  'Ссылка на прототип, собранный заранее для этого касания. Есть — письмо даёт её вместо обещания собрать за 12 часов.';
comment on column public.prospects.proto_tried_at is
  'Когда пробовали собрать прототип заранее. Одна попытка на касание: не сложилось с первого раза — не сложится и с десятого.';
comment on column public.prospects.proto_note is
  'Почему прототип заранее не собрался: niche, collect, services, name, missing, draft, model.';

alter table public.protos
  add column if not exists auto boolean not null default false;

comment on column public.protos.auto is
  'Собран сам, для касания, без человека: услуги сняты с сайта компании и сверены с ним дословно.';

-- Открытие, которое стоит сообщить: первое за всё время.
--
-- Тот же счётчик, что proto_opened, но отвечает, первое ли это открытие и к
-- какому касанию прототип: в первую же минуту, как владелец открыл ссылку,
-- об этом узнаёт тот, кто ведёт касание. Прочитать opened_at в приложении и
-- потом прибавить — значит дважды позвать человека, когда ссылку открыли
-- двое разом.
create or replace function public.proto_seen(proto uuid)
returns table (first_open boolean, prospect_id uuid, name text)
language sql
security definer
set search_path = public
as $$
  update public.protos p
     set opens = p.opens + 1,
         opened_at = coalesce(p.opened_at, now())
    from (select id, opened_at is null as was_unseen from public.protos where id = proto for update) prev
   where p.id = prev.id
  returning prev.was_unseen, p.prospect_id, p.name;
$$;

revoke all on function public.proto_seen(uuid) from public, anon, authenticated;
grant execute on function public.proto_seen(uuid) to service_role;
