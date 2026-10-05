# Прототип bloger.agency — исходники

Многостраничный прототип (ru и uz): главная, `blogery`, `ugc`, `brendam`,
`blogeram`, `keysy`. Исследование — `docs/research/blogger-agencies.md`.

- `gen.mjs` собирает 12 страниц в `out/pages.json`; ссылки между страницами —
  через `__PROTO_BASE__` (lib/proto/pages), токен подставляется при показе.
- `catalog.json` — 64 блогера с bloger.agency/our-blogers (снято 05.10.2026):
  ник, подписчики, ER, ниша, город, цена Story и Post, топ.
- `gp.js` — Glyph Portal © 2026 Christian Katzmann, MIT (влёт в «O» из BLOGER).
- `serve.mjs` — локальный показ: `node serve.mjs`, затем
  `http://localhost:4789/proto/<43 символа>/`; `/api/proto-ai` отвечает
  `fallback`, страницы показывают демо-ответы.

Сборка ещё пишет `content/proto-bundles/bloger-agency.json` — оттуда страницы
отдаёт сервер (lib/proto/bundles), ставя отпечаток зерном из `protos.stamp`.
В базе — обычная запись `protos` с `facts.bundle = "bloger-agency"`.

Раньше (без сборки) прототип клался одной записью: главная — `html`,
остальные — `pages`, отпечаток — `stampPages` (lib/proto/stamp) одним зерном,
`status = ready`, `auto = false`, в `facts.ai` — `["match","brief","ugc"]`,
иначе /api/proto-ai ему не ответит.
