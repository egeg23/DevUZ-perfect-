delete from public.sales_marks where kind = 'undo';
alter table public.sales_marks drop constraint if exists sales_marks_undo_check;
alter table public.sales_marks drop column if exists undo_stage;
alter table public.sales_marks drop constraint if exists sales_marks_kind_check;
alter table public.sales_marks
  add constraint sales_marks_kind_check check (kind in ('interest', 'shown', 'priced'));
