-- Откат 0179: новый партнёр снова «от прибыли». Перевод партнёров обратно —
-- руками по журналу partner_model_changes (to_model = 'turnover' за 05.11.2026).
alter table public.partners alter column payout_model set default 'profit';
