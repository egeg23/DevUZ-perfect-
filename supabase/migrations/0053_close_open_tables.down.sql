alter table public.talk_reviews disable row level security;
alter table public.candidate_reviews disable row level security;
grant execute on function public.proto_opened(uuid) to anon, authenticated;
