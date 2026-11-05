-- Снять ступень продажи нажатием (lib/admin/sales-stages.ts, UNDO_STAGES;
-- sales-stages-store.ts, undoStage).
--
-- Владелец, 05.11.2026, на «Ход сделки» CREAT: «статусы сами поменялись, хотя
-- мы ещё макет им даже не делали. Сделай возможность откатывать менеджерам
-- статусы, просто нажимая на статус».
--
-- Ничего не удаляется: строка kind = 'undo' с undo_stage, и всё, что записано
-- на этой ступени и после неё до этой минуты, перестаёт считаться. Что
-- случится позже — считается снова.

alter table public.sales_marks drop constraint if exists sales_marks_kind_check;
alter table public.sales_marks
  add constraint sales_marks_kind_check check (kind in ('interest', 'shown', 'priced', 'undo'));

alter table public.sales_marks
  add column if not exists undo_stage text
    check (undo_stage in ('replied', 'interest', 'mockup', 'shown', 'priced'));

alter table public.sales_marks drop constraint if exists sales_marks_undo_check;
alter table public.sales_marks
  add constraint sales_marks_undo_check check ((kind = 'undo') = (undo_stage is not null));

comment on column public.sales_marks.undo_stage is
  'Только у kind = undo: какая ступень снята нажатием (она и всё после неё до этой минуты не считается).';
