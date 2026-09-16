-- Полный маршрут договора: смета, срок, отправка на подпись, скан с подписями.
--
-- Владелец: «сотрудник на этом этапе загружает смету и данные по смете
-- вытягиваются в договор. Согласованный срок выполнения прописывается
-- сотрудником. После нажатия кнопки „отправить на подпись" мне уже должен
-- придти полный вариант договора со сметой и сроками, уведомление в
-- телеграмм от бота обязательно! После моего подтверждения — на договор в
-- места подписи накладывается мое png подпись и его можно посмотреть или
-- скачать. После подписания необходимо загрузить менеджеру договор обратно,
-- уже с подписями клиента и моей. Договор останется у нас в базе.»
--
-- Отсюда пять состояний вместо трёх, и каждое отвечает на свой вопрос:
--
--   draft    — менеджер собирает: клиент, смета, срок. Правится свободно.
--   pending  — отправлен на подпись. ЗАМОРОЖЕН: владельцу пришло
--              уведомление, и то, что он открыл, не должно измениться под
--              ним между уведомлением и нажатием кнопки.
--   approved — владелец подтвердил, подпись наложена, можно отдавать.
--   signed   — вернулся скан с обеими подписями. Конец маршрута.
--   void     — отменён. Не удалён: документы не удаляют.
--
-- Возврат pending → draft разрешён: владелец может вернуть на доработку, и
-- это нормальная часть работы, а не ошибка.

alter table public.contracts drop constraint if exists contracts_status_check;
alter table public.contracts add constraint contracts_status_check
  check (status in ('draft', 'pending', 'approved', 'signed', 'void'));

-- Смета: файл как приложение и разобранные строки для тела договора.
--
-- Хранится и файл, и строки. Файл — потому что это то, что согласовали с
-- клиентом, и он приложение к договору. Строки — потому что по ним
-- считается сумма и они печатаются в документе; ссылаться в договоре на
-- вложение, которого читатель не видит, значит получить спор о его
-- содержании.
alter table public.contracts add column if not exists estimate_path text;
alter table public.contracts add column if not exists estimate_name text;
alter table public.contracts add column if not exists estimate_items jsonb not null default '[]'::jsonb;

-- Срок выполнения словами сотрудника: «60 рабочих дней с даты аванса».
-- Отдельно от этапов: этапы это разбивка оплаты, а это общий срок, который
-- согласовали с клиентом, и спорить будут о нём.
alter table public.contracts add column if not exists deadline_text text;

-- Отправка на подпись: кто и когда. Без этого «я не получал» нечем крыть.
alter table public.contracts add column if not exists sent_at timestamptz;
alter table public.contracts add column if not exists sent_by uuid references public.staff(id) on delete set null;
alter table public.contracts add column if not exists notified_at timestamptz;

-- Скан с подписями обеих сторон.
alter table public.contracts add column if not exists signed_path text;
alter table public.contracts add column if not exists signed_at timestamptz;
alter table public.contracts add column if not exists signed_by uuid references public.staff(id) on delete set null;

-- Отправленный на подпись обязан помнить, кто и когда отправил.
alter table public.contracts drop constraint if exists contracts_sent_complete;
alter table public.contracts add constraint contracts_sent_complete
  check (status not in ('pending', 'approved', 'signed') or (sent_at is not null and sent_by is not null));

-- Подписанный обязан иметь скан. Статус без файла — это «договор подписан,
-- но показать нечего», и выясняется это в споре.
alter table public.contracts drop constraint if exists contracts_signed_complete;
alter table public.contracts add constraint contracts_signed_complete
  check (status <> 'signed' or (signed_path is not null and signed_at is not null));
