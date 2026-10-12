drop table if exists public.learn_materials;
drop table if exists public.learn_attempts;
delete from public.stats_snapshots where key = 'section-on:/admin/learn';
