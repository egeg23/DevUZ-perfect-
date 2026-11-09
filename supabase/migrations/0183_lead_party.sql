-- Кто это: клиент, агентство или блогер (lib/admin/lead-party.ts).
--
-- Владелец, 09.11.2026: «Когда вручную добавляем лидов в панели нашей —
-- сделай возможность выбрать: клиент / агентство или блоггер». Агентство и
-- блогер сами приводят клиентов: в списке у них метка, в карточке —
-- подсказка завести агентство в «Агентствах», блогера — партнёром.
-- Старые лиды и все лиды не руками — клиенты.

alter table public.leads add column if not exists party text not null default 'client';
alter table public.leads drop constraint if exists leads_party_check;
alter table public.leads add constraint leads_party_check check (party in ('client', 'agency', 'blogger'));
