-- Договор от ИП в сторону заказчика.
--
-- Владелец: «мы как студия должны быть защищены… обезопась нас максимально».
-- И отдельно: «менеджер может подготовить договор (проверить всё), но подпись
-- моя появится на договоре только после подтверждения мной».
--
-- Отсюда два решения, которые и определяют схему.
--
-- Первое: договор — СНИМОК, а не вид на проект. Поля клиента, предмета и
-- суммы копируются в момент подготовки и дальше живут своей жизнью. Иначе
-- правка суммы в карточке проекта задним числом меняла бы подписанный
-- документ, и выяснилось бы это в споре.
--
-- Второе: подпись владельца — это не картинка в вёрстке, а состояние записи.
-- Файл подписи отдаётся только для договора со статусом approved и только
-- тому, кто вправе его видеть. Пока владелец не подтвердил, подписи нет
-- физически, а не «скрыта стилями».

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  project_id uuid not null references public.projects(id) on delete cascade,

  -- Номер уникален: два договора с одним номером — это спор о том, какой из
  -- них настоящий, и выигрывает его тот, у кого экземпляр на руках.
  number text not null unique,
  signed_date date not null,

  -- Снимок договорённости.
  client_name text not null,
  client_details text not null default '',
  subject text not null,
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  -- Этапы: [{title, percent, workdays}]. Сумма долей обязана давать 100 —
  -- проверяется в коде, потому что ошибку надо показать человеку словами,
  -- а не отказом базы.
  stages jsonb not null default '[]'::jsonb,

  -- draft — менеджер готовит; approved — владелец подтвердил, подпись
  -- накладывается; void — отменён, но не удалён: удалять документы нельзя.
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'void')),

  prepared_by uuid references public.staff(id) on delete set null,
  prepared_at timestamptz,

  -- Кто и когда подтвердил. Только владелец; проверяется в коде.
  approved_by uuid references public.staff(id) on delete set null,
  approved_at timestamptz,

  void_reason text
);

-- Договор ищут от проекта, и почти всегда нужен последний.
create index if not exists contracts_project_idx
  on public.contracts (project_id, created_at desc);

-- Подтверждённый договор обязан знать, кто и когда его подтвердил.
-- Без этого «подпись появилась сама» — и доказать обратное нечем.
alter table public.contracts drop constraint if exists contracts_approved_complete;
alter table public.contracts add constraint contracts_approved_complete
  check (status <> 'approved' or (approved_by is not null and approved_at is not null));

-- Отменённый договор обязан объяснять причину: через год никто не вспомнит.
alter table public.contracts drop constraint if exists contracts_void_reason;
alter table public.contracts add constraint contracts_void_reason
  check (status <> 'void' or coalesce(void_reason, '') <> '');

alter table public.contracts enable row level security;
