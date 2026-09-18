-- Маршрут касания: чем именно мы можем дотянуться до этой компании.
--
-- Первые полсотни касаний показали, что писать в телеграм по адресу с сайта
-- почти некому. Из четырнадцати адресатов девять оказались каналами — все
-- девять отбились с CHAT_WRITE_FORBIDDEN, потому что в канал нельзя написать
-- в личку; три — ботами, и все три «дошли» в автоответчик; и только два были
-- обычными аккаунтами. Живой человек не ответил ни разу.
--
-- Причина не в текстах: ссылка t.me на сайте компании — это её канал или её
-- бот, потому что именно их компания и публикует. Личный аккаунт, в который
-- можно постучаться, на сайте не печатают.
--
-- Отсюда три колонки.
--
-- target_kind — каким путём идём. 'handle' — свой @адрес, проверенный на то,
-- что это живой человек, а не канал и не бот. 'phone' — адреса нет, но есть
-- номер: скаут добавляет его в контакты, и телеграм часто находит по нему
-- аккаунт. 'manual' — не нашлось ни того, ни другого, и пишет менеджер
-- руками в WhatsApp или звонит.
--
-- target_user_id — кого именно телеграм нам вернул. Нужен для входящих:
-- раньше ответ узнавался по @адресу отправителя, а у человека, найденного по
-- номеру, адреса может не быть вовсе, и его ответ не связался бы ни с чем.
--
-- manual_note — что именно менеджер сделал руками: позвонил, написал в
-- WhatsApp. Без этого ручное касание неотличимо от забытого.
alter table public.prospects
  add column if not exists target_kind text,
  add column if not exists target_user_id bigint,
  add column if not exists manual_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prospects'::regclass and conname = 'prospects_target_kind_check'
  ) then
    alter table public.prospects add constraint prospects_target_kind_check
      check (target_kind is null or target_kind in ('handle', 'phone', 'manual'));
  end if;
end $$;

-- Новый статус 'manual': писать некуда автономно, дальше человек.
--
-- Отдельным статусом, а не пометкой на 'failed': провал — это когда не
-- сработало то, что должно было, и такую карточку менеджер пролистывает.
-- Здесь же ничего не сломалось, просто дальше нужны руки, и карточка обязана
-- попасться на глаза.
alter table public.prospects drop constraint if exists prospects_status_check;
alter table public.prospects add constraint prospects_status_check
  check (status in ('new', 'contacting', 'sending', 'sent', 'failed', 'skipped', 'manual'));

-- Входящее ищется по отправителю: у того, кого нашли по номеру, @адреса нет.
create index if not exists prospects_by_user on public.prospects (target_user_id)
  where target_user_id is not null;

-- Уже отправленным маршрут проставляется задним числом: все они шли по
-- @адресу, другого пути тогда не было.
update public.prospects set target_kind = 'handle'
  where target_kind is null and target is not null;
