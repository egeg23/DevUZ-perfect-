# Деплой на VPS

Схема повторяет ту, что уже работает в других проектах студии: Docker Compose
на сервере, выкатка через GitHub Actions по SSH. Отличие одно — reverse proxy
здесь Caddy, а не nginx с certbot.

Причина не в эстетике. Вебхук Telegram принимается только по HTTPS с валидным
сертификатом: как только сертификат протухнет, приём лидов остановится молча,
и заметить это можно будет лишь по тишине в чате продаж. Caddy получает и
продлевает сертификат сам, убирая целый класс таких отказов.

## Что поднимается

```
     :80 :443
        │
   ┌────▼─────┐        ┌──────────────┐
   │  caddy   │───────▶│     web      │
   │  HTTPS   │  :3000 │  Next.js     │
   └──────────┘        └──────────────┘
```

Наружу торчит только Caddy. Приложение слушает 3000 внутри сети Docker и
недоступно снаружи напрямую.

## Первая настройка сервера

Нужны git, docker и docker compose v2.

```bash
git clone https://github.com/egeg23/DevUZ-perfect-.git /opt/devuz
cd /opt/devuz
cp .env.example .env
nano .env          # домен и ключи
docker compose up -d --build
```

### Про переменные

Разделение принципиальное, и перепутать их нельзя:

- `NEXT_PUBLIC_*` **вшиваются в клиентский бандл на этапе сборки**. Они
  указаны в `docker-compose.yml` как build args. Меняются — нужна пересборка
  образа, простого перезапуска мало.
- Всё остальное — ключ модели, токен бота, сервисный ключ базы — читается
  **в рантайме** и в образ не попадает. Именно поэтому секреты никогда не
  передаются как build args: всё, что видел билд, остаётся в слоях образа и
  вытаскивается из него любым, кто до образа доберётся.

`DOMAIN` и `NEXT_PUBLIC_SITE_URL` должны указывать на один и тот же адрес.
Первый нужен Caddy для сертификата, второй уходит в canonical и hreflang —
расхождение означает, что поисковик увидит ссылки на несуществующий домен.

## Автоматическая выкатка

`.github/workflows/deploy-vps.yml` заходит на сервер и запускает
`scripts/vps-deploy.sh`. Секреты репозитория:

| Секрет | Что это |
|---|---|
| `VPS_HOST` | IP или домен сервера |
| `VPS_USER` | SSH-пользователь |
| `VPS_SSH_KEY` | приватный ключ деплоя целиком |
| `VPS_PORT` | SSH-порт, если не 22 |
| `VPS_APP_DIR` | путь на сервере, по умолчанию `/opt/devuz` |

Ключ деплоя:

```bash
ssh-keygen -t ed25519 -f devuz_deploy -N "" -C "github-actions"
cat devuz_deploy.pub >> ~/.ssh/authorized_keys   # на VPS
# содержимое devuz_deploy целиком → секрет VPS_SSH_KEY
```

Перед выкаткой прогоняются проверка типов и сборка. Поймать сломанный билд в
CI дешевле, чем обнаружить его на сервере, где старый контейнер уже остановлен.

## Вебхук Telegram

Ставится один раз, после того как домен заработал по HTTPS:

```bash
curl -X POST "https://api.telegram.org/bot<ТОКЕН>/setWebhook" \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://ВАШ-ДОМЕН/api/telegram/webhook",
    "secret_token": "ЗНАЧЕНИЕ TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Проверить: `curl "https://api.telegram.org/bot<ТОКЕН>/getWebhookInfo"` —
в ответе не должно быть `last_error_message`.

## Проверка после выкатки

```bash
curl -s https://ВАШ-ДОМЕН/api/health | jq
```

Отдаёт хеш выкаченного коммита и флаги того, что настроено:

```json
{ "ok": true, "commit": "2814bdb",
  "configured": { "llm": true, "telegram": true, "webhookSecret": true, "database": true } }
```

Значений переменных проба не показывает — только сам факт, что они заданы.
`telegram: false` на боевом сервере означает, что лиды сейчас не доходят.

## Если что-то пошло не так

```bash
docker compose logs -f web      # приложение
docker compose logs -f caddy    # сертификат и проксирование
docker compose ps               # состояние и healthcheck
```

Частое: Caddy не получает сертификат — проверьте, что A-запись домена ведёт
на этот сервер и что порты 80 и 443 не заняты другим веб-сервером.
