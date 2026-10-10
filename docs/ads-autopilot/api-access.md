# Доступ к API Google Ads и Яндекс Директа: что подать владельцу

Дата: 10.10.2026. Для сервиса «автопилот рекламы» DevUz Studio. Всё, что не подтверждено первоисточником, помечено «проверить».

Адреса возврата после входа (redirect URI), одинаковые для разработки и боя:

- Google: `https://devuz.studio/api/ads/oauth/google/callback`
- Яндекс: `https://devuz.studio/api/ads/oauth/yandex/callback`

---

## Часть 1. Google Ads API

### 1.1. Что поменялось в сентябре 2026 (важно)

- **Developer token больше не решает доступ.** С 9–10 сентября 2026 уровень доступа привязан к **проекту Google Cloud**, из которого выпущены OAuth-ключи; подписка на API и смена уровня — на странице «Google Ads API → Overview» в Cloud Console, а не в API Center управляющего аккаунта. Заявки, поданные из API Center, не обрабатываются ([developer token](https://developers.google.com/google-ads/api/docs/api-policy/developer-token), [PPC.land](https://ppc.land/google-drops-developer-tokens-from-ads-api-access-decisions/), [Relevant Audience](https://www.relevantaudience.com/google-ads-en/google-ads-api-developer-tokens-sunset-cloud-project-access/)).
- **Управляющий аккаунт (MCC) для доступа не нужен.** Он нужен только если через API ведутся несколько аккаунтов из-под одного управляющего ([developer token](https://developers.google.com/google-ads/api/docs/api-policy/developer-token)).
- **Заголовок `developer-token` — необязателен и игнорируется**; Google обещает в одной из будущих основных версий начать отклонять запросы с токеном ([dev-token](https://developers.google.com/google-ads/api/docs/first-call/dev-token)). При этом страница про заголовки REST ещё пишет, что токен обязателен ([REST auth](https://developers.google.com/google-ads/api/rest/auth)) — документация не обновлена. Решение: **токен не отправляем**; если он есть в `GOOGLE_ADS_DEVELOPER_TOKEN` — отправляем, пока не получим ошибку — «проверить» на первой версии, где его начнут отклонять.
- Для заявок на Basic и Standard **нужна проверка бренда (brand verification)** проекта Cloud. Basic рассматривается **автоматически, за минуты** ([developer token](https://developers.google.com/google-ads/api/docs/api-policy/developer-token)).
- Проект на бесплатном пробном периоде Cloud (Free Trial) или с приостановленным платёжным аккаунтом могут не пустить даже на Explorer — нужен **платный платёжный аккаунт Cloud** (или без привязки биллинга вовсе) ([developer token](https://developers.google.com/google-ads/api/docs/api-policy/developer-token)).
- Известная ошибка: повышение уровня в Cloud Console у части проектов не применилось; обходной путь Google — подать на Explorer из нового проекта (сообщение Google, найденное в поисковой выдаче; на открытой странице [dev-token](https://developers.google.com/google-ads/api/docs/first-call/dev-token) его не было — «проверить», если уровень не меняется).

### 1.2. Уровни доступа

| Уровень | Какие аккаунты | Лимит в сутки | Как получить |
|---|---|---|---|
| Test | только тестовые | 15 000 операций | включить Google Ads API в проекте — выдаётся сам |
| Explorer | тестовые и боевые | **2 880 операций** по боевым, 15 000 по тестовым; нельзя создавать аккаунты, управлять пользователями, планировщик ключевых слов, биллинг | Overview → «Upgrade access level» → «Apply for access» |
| Basic | тестовые и боевые | **15 000 операций** | после Explorer + brand verification; автоматически, минуты |
| Standard | тестовые и боевые | без лимита (у отдельных функций свои лимиты) | после Basic; ручной аудит, нужен Required Minimum Functionality; **10 рабочих дней** |

Источник: [Access levels](https://developers.google.com/google-ads/api/docs/api-policy/access-levels). Ошибка, если проект с уровнем Test зовёт боевой аккаунт: v25 — `CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION`, раньше — `ACTION_NOT_PERMITTED` ([PPC.land](https://ppc.land/google-drops-developer-tokens-from-ads-api-access-decisions/), [тестовые аккаунты](https://developers.google.com/google-ads/api/docs/best-practices/test-accounts)).

**Для пилота хватает Explorer** (2 880 операций ≈ 10 аккаунтов × несколько отчётов и правок в день). Сразу после brand verification подаём на Basic.

### 1.3. Версия API

- Текущая — **v25.2 (23.09.2026)**; v25 вышла 22.07.2026, v24 — 22.04.2026 ([release notes](https://developers.google.com/google-ads/api/docs/release-notes)).
- С 2026 года Google выпускает версии ежемесячно, основная версия живёт около года; по графику v26 ожидается в октябре 2026 ([PPC.land](https://ppc.land/google-ads-api-shifts-to-monthly-releases-starting-january-2026/), [SE Roundtable](https://seroundtable.com/google-ads-api-v-25-41740.html)) — «проверить» перед релизом. В коде версия — одна константа (`v25`).

### 1.4. Пошагово, что делает владелец

1. **Проект Google Cloud.** console.cloud.google.com → новый проект «DevUz Ads Autopilot». Привязать платный платёжный аккаунт (не Free Trial) или не привязывать биллинг вообще.
2. **Включить API.** APIs & Services → Library → «Google Ads API» → Enable. Проект сразу получает уровень Test.
3. **Экран согласия OAuth и брендинг** (это и есть brand verification) ([Brand verification](https://developers.google.com/google-ads/api/docs/api-policy/brand-verification?hl=en)):
   1. APIs & Services → OAuth consent screen → Overview → «Get Started», заполнить, «Create».
   2. Вкладка **Audience**: тип пользователей **External**, статус публикации **In production** («Publish app» → подтвердить «Push to Production?»). Даже если где-то написано, что внутренним/тестовым приложениям проверка не нужна — для заявки на Basic нужно именно так.
   3. Вкладка **Branding**: название приложения «DevUz Ads Autopilot», логотип, почта поддержки, **домашняя страница** `https://devuz.studio/ads` (страница должна объяснять, что делает приложение, и называться так же, как приложение — иначе автопроверка зацикливается ([обсуждение](https://discuss.google.dev/t/brand-verification-loop-home-page-does-not-explain-purpose-and-app-name-does-not-match-despite-compliant-dedicated-app-page/379281))), **политика конфиденциальности** `https://devuz.studio/privacy`, условия `https://devuz.studio/terms`, авторизованный домен `devuz.studio` (домен должен быть подтверждён в Search Console — «проверить»). «Save».
   4. «Verify Branding» → подождать несколько минут → исправить замечания → «Publish branding».
   5. Области доступа (Data access): `https://www.googleapis.com/auth/adwords`. Среди «чувствительных» областей Google её нет; один разработчик сообщал, что полная проверка приложения не понадобилась ([обсуждение](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)) — «проверить» на своём проекте.
4. **OAuth-клиент.** APIs & Services → Credentials → Create credentials → OAuth client ID → тип **Web application**; Authorized redirect URI: `https://devuz.studio/api/ads/oauth/google/callback` (для локальной разработки можно добавить `http://localhost:3000/api/ads/oauth/google/callback`). Client ID и Client secret — в хранилище секретов.
5. **IAM.** У проекта должны быть владелец и редактор с живыми почтами: на них приходят обязательные сообщения Google об API ([PPC.land](https://ppc.land/google-drops-developer-tokens-from-ads-api-access-decisions/)). Права менять квоты — Owner, Editor, Quota Administrator или Service Usage Admin ([dev-token](https://developers.google.com/google-ads/api/docs/first-call/dev-token)).
6. **Тестовые аккаунты.** Отдельным Google-аккаунтом, не связанным с боевым MCC, создать **тестовый управляющий аккаунт** (кнопка «Create a test manager account» на странице), под ним — тестовые клиентские аккаунты (Accounts → + → Create new account; ошибку про бюджет можно игнорировать). До 50 тестовых аккаунтов на иерархию, показов и расходов нет, неактивные год удаляются ([Test accounts](https://developers.google.com/google-ads/api/docs/best-practices/test-accounts)).
7. **Explorer.** Cloud Console → Google Ads API → Overview → «Upgrade access level» → следующий уровень Explorer → «Apply for access» ([Access levels](https://developers.google.com/google-ads/api/docs/api-policy/access-levels)).
8. **Basic.** Там же, когда текущий уровень Explorer и брендинг проверен → «Apply for access». Описание приложения ниже (п. 1.6) держать под рукой: форма может его спросить — «проверить» состав формы при подаче, в документации он не описан.
9. **(Позже) Standard** — когда упрёмся в 15 000 операций; ручная проверка, 10 рабочих дней.
10. **(Для агентств) MCC студии** — завести управляющий аккаунт DevUz, чтобы агентства могли привязывать аккаунты под него, и передавать `login-customer-id`. Для пилота не обязателен: каждый клиент входит своим Google-аккаунтом.

### 1.5. Как ходим в API (REST)

**Вход пользователя (OAuth 2.0)** — стандартный поток Google:
- `GET https://accounts.google.com/o/oauth2/v2/auth?client_id=…&redirect_uri=https://devuz.studio/api/ads/oauth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/adwords&access_type=offline&prompt=consent&state=…` — `access_type=offline` нужен, чтобы получить refresh token.
- `POST https://oauth2.googleapis.com/token` (`grant_type=authorization_code` / `refresh_token`).
- Refresh token храним зашифрованным (`ADS_TOKEN_KEY`).

**Заголовки каждого запроса** ([REST auth](https://developers.google.com/google-ads/api/rest/auth)):
```
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
login-customer-id: 1234567890        # только если работаем через управляющий аккаунт; цифры без дефисов
developer-token: …                    # необязателен с 09.2026, сервер игнорирует (см. 1.1)
```

**Список доступных аккаунтов:** `GET https://googleads.googleapis.com/v25/customers:listAccessibleCustomers` → `{"resourceNames":["customers/1234567890", …]}`.

**Чтение — `searchStream`** ([Search](https://developers.google.com/google-ads/api/rest/common/search)):
```
POST https://googleads.googleapis.com/v25/customers/{customerId}/googleAds:searchStream
{"query": "<GAQL>"}
```
Ответ — **JSON-массив** пачек: `[{"results":[…], "fieldMask":"…", "requestId":"…"}, …]`. Поля в ответе — в camelCase (`searchTermView.searchTerm`, `metrics.costMicros`; int64 приходят строкой). Обычный `googleAds:search` отдаёт страницы по 10 000 строк с `nextPageToken`.

GAQL для поисковых запросов (по группам, без PMax):
```sql
SELECT
  campaign.id, campaign.name, ad_group.id, ad_group.name,
  search_term_view.search_term, search_term_view.status,
  segments.keyword.info.text, segments.keyword.info.match_type,
  metrics.impressions, metrics.clicks, metrics.cost_micros,
  metrics.conversions, metrics.conversions_value
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.impressions > 0
```
По кампаниям, в том числе Performance Max — `campaign_search_term_view` ([поля v25](https://developers.google.com/google-ads/api/fields/v25/campaign_search_term_view)); сегменты по ключевому слову туда не добавлять — PMax выпадет (там же):
```sql
SELECT campaign.id, campaign_search_term_view.search_term,
  metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
FROM campaign_search_term_view
WHERE segments.date DURING LAST_30_DAYS
```
Действующие минус-слова кампаний:
```sql
SELECT campaign.id, campaign_criterion.criterion_id,
  campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
FROM campaign_criterion
WHERE campaign_criterion.type = 'KEYWORD' AND campaign_criterion.negative = TRUE
```
Кампании и бюджеты для перераспределения:
```sql
SELECT campaign.id, campaign.name, campaign.status, campaign.bidding_strategy_type,
  campaign_budget.resource_name, campaign_budget.amount_micros,
  campaign_budget.explicitly_shared,
  metrics.cost_micros, metrics.conversions, metrics.conversions_value,
  metrics.search_budget_lost_impression_share
FROM campaign
WHERE segments.date DURING LAST_30_DAYS AND campaign.status = 'ENABLED'
```
Точные имена полей — сверить в справочнике полей v25 при реализации («проверить» `segments.keyword.info.*` и `search_budget_lost_impression_share` для нужных типов кампаний).

**Запись — `:mutate`** ([Mutate](https://developers.google.com/google-ads/api/rest/common/mutate)): тело `{"operations":[{create|update+updateMask|remove}]}`; по умолчанию всё или ничего. Флаги верхнего уровня `"partialFailure": true` и `"validateOnly": true` — у сервисов, которые их поддерживают (на странице не показаны — «проверить» в справочнике метода).

Минус-слово в кампанию:
```
POST https://googleads.googleapis.com/v25/customers/{customerId}/campaignCriteria:mutate
{
  "operations": [{
    "create": {
      "campaign": "customers/{customerId}/campaigns/{campaignId}",
      "negative": true,
      "keyword": { "text": "бесплатно", "matchType": "PHRASE" }
    }
  }],
  "partialFailure": true
}
```
Удалить минус: `{"operations":[{"remove":"customers/{cid}/campaignCriteria/{campaignId}~{criterionId}"}]}`.

Общий список минус-слов ([Shared sets](https://developers.google.com/google-ads/api/docs/targeting/shared-sets)):
```
POST …/v25/customers/{cid}/sharedSets:mutate
{"operations":[{"create":{"name":"DevUz — мусор","type":"NEGATIVE_KEYWORDS"}}]}

POST …/v25/customers/{cid}/sharedCriteria:mutate
{"operations":[{"create":{"sharedSet":"customers/{cid}/sharedSets/{setId}",
  "keyword":{"text":"вакансия","matchType":"BROAD"}}}]}

POST …/v25/customers/{cid}/campaignSharedSets:mutate
{"operations":[{"create":{"campaign":"customers/{cid}/campaigns/{campaignId}",
  "sharedSet":"customers/{cid}/sharedSets/{setId}"}}]}
```

Бюджет кампании:
```
POST https://googleads.googleapis.com/v25/customers/{customerId}/campaignBudgets:mutate
{
  "operations": [{
    "updateMask": "amountMicros",
    "update": {
      "resourceName": "customers/{customerId}/campaignBudgets/{budgetId}",
      "amountMicros": "55000000"
    }
  }]
}
```
`amountMicros` — дневной бюджет × 1 000 000 в валюте аккаунта. Если `explicitly_shared = true`, бюджет общий для нескольких кампаний — двигать его нельзя без учёта всех.

Остановить объявление: `adGroupAds:mutate`, `update` с `status: "PAUSED"`, `updateMask: "status"`, `resourceName: customers/{cid}/adGroupAds/{adGroupId}~{adId}`.

**Лимиты аккаунта** для проверок перед записью: 10 000 минус-слов на кампанию, 20 общих списков, 5 000 слов в списке ([лимиты](https://support.google.com/google-ads/answer/6372658)).

### 1.6. Описание приложения для Google (Design document), на английском

Документация 2026 года не говорит, просит ли форма Basic описание инструмента (раньше просила PDF «tool design document»). Для Standard — точно нужен аудит. Текст готов к подаче:

> **DevUz Ads Autopilot — Tool Design Document**
>
> **Company.** DevUz Studio, Tashkent, Uzbekistan. Website: https://devuz.studio. Contact: [owner name], [email]. We build websites and marketing tools for small and mid-size businesses and agencies in Uzbekistan and Central Asia.
>
> **Purpose.** DevUz Ads Autopilot is a web application for marketers and advertising agencies who manage their own or their clients' Google Ads accounts. It reduces wasted spend and manual work by (1) finding irrelevant search terms and adding them as negative keywords, (2) alerting the account manager about anomalies (spend spikes, stopped campaigns, rising cost per conversion), (3) suggesting and, with the user's permission, applying budget changes between campaigns of the same account, and (4) evaluating ad tests with statistical significance.
>
> **Users and access.** Only the advertiser or agency staff who own or manage the account. Each user signs in with Google (OAuth 2.0, scope https://www.googleapis.com/auth/adwords) and explicitly connects accounts they already have access to. Agencies may link client accounts through their own manager account. We never create Google Ads accounts, manage users, or touch billing.
>
> **API usage.**
> - Reporting (GoogleAdsService.SearchStream): search_term_view, campaign_search_term_view, campaign, ad_group, ad_group_ad, campaign_criterion, campaign_budget — daily, for the last 30 days.
> - Mutations: CampaignCriterionService and SharedSetService / SharedCriterionService / CampaignSharedSetService (negative keywords), CampaignBudgetService (budget amount), AdGroupAdService (pause losing ads).
> - Expected volume: under 50 accounts during the pilot, about 20–60 operations per account per day.
>
> **Safety.** Every change is first shown as a proposal; automatic mode is opt-in per account, with daily limits (e.g. max 20% budget change per step, max N negatives per day). Before adding a negative keyword the tool checks that it does not block an active keyword. All changes are logged with the user, time and previous value, and can be reverted in one click. Refresh tokens are encrypted at rest (AES-256-GCM) and deleted when the user disconnects.
>
> **Data.** Data is used only to provide the service to the connected user; it is not sold or shared with third parties. Privacy policy: https://devuz.studio/privacy.
>
> **Screens.** Accounts list → account overview (spend, conversions, alerts) → Negative keywords (proposals with reason, apply/reject) → Budgets (proposed moves) → Ad tests (winner, confidence) → Change log.

---

## Часть 2. Яндекс Директ API v5

### 2.1. Пошагово, что делает владелец

1. **Аккаунт в Директе разработчика** (логин студии). В веб-интерфейсе Директа (режим Pro) должна быть **хотя бы одна кампания** — без неё страница «Настройки API» не откроется; черновика объявления с одной фразой хватает ([регистрация v4](https://yandex.ru/dev/direct/doc/dg-v4/ru/concepts/register), [регистрация v5](https://yandex.ru/dev/direct/doc/ru/concepts/register)).
2. **Приложение в Яндекс ID**: oauth.yandex.ru → создать приложение → вариант «Для доступа к API или отладки»; название «DevUz Ads Autopilot», контактная почта; права **`direct:api`** («Использование API Яндекс Директа»; для входа организаций можно добавить `passport:business`). Redirect URI: `https://devuz.studio/api/ads/oauth/yandex/callback`. Сохранить ClientID и Client secret ([регистрация](https://yandex.ru/dev/direct/doc/ru/concepts/register)).
3. **Заявка на доступ**: Директ → «Настройки API» → вкладка «Мои заявки» → принять пользовательское соглашение при первом входе → «Новая заявка» → выбрать ClientID из шага 2, указать рабочую почту, заполнить сведения о приложении (текст ниже) → «Отправить» ([регистрация](https://yandex.ru/dev/direct/doc/ru/concepts/register), [заявка](https://yandex.com/dev/direct/doc/en/access-request.md)).
   - **Тестовый доступ** — только Песочница; **полный доступ** — реальные кампании клиентов и Песочница. Тестовую заявку потом можно преобразовать в полную ([регистрация v4](https://yandex.ru/dev/direct/doc/dg-v4/ru/concepts/register)). Учебный курс Яндекса советует одну заявку с аккаунта разработчика ([обучающий курс](https://yandex.ru/dev/direct/doc/start/index-docpage)) — **подаём сразу на полный доступ**.
   - Рассмотрение: по рабочим дням с 10 до 19 (мск), от часа до 3 рабочих дней, в пик — до 7 дней. При отказе причины видны в заявке, её можно исправить ([заявка](https://yandex.com/dev/direct/doc/en/access-request.md), [регистрация](https://yandex.ru/dev/direct/doc/ru/concepts/register)).
   - Если изменится почта разработчика или сильно вырастет число пользователей приложения — заявку надо отредактировать; до одобрения новой действуют старые параметры (там же).
4. **Песочница**: включается в настройках API Директа (`https://direct.yandex.ru/registered/main.pl?cmd=apiSandboxSettings`); те же баллы и ограничения, что в боевом API, данные живут месяц после последнего обращения; веб-интерфейса нет ([регистрация v4](https://yandex.ru/dev/direct/doc/dg-v4/ru/concepts/register), [песочница](https://yandex.ru/dev/direct/doc/concepts/sandbox.html)).
5. **Каждый пользователь сервиса** (рекламодатель или агентство) должен иметь аккаунт в Директе и принять соглашение на странице «Настройки API» своего аккаунта; клиенту агентства доступ должно разрешить агентство. Пользователь может ограничить API списком IP — тогда ему нужен IP нашего сервера ([доступ](https://yandex.ru/dev/direct/doc/ru/concepts/access)).

### 2.2. Текст заявки (на русском)

> **Название приложения:** DevUz Ads Autopilot
>
> **Разработчик:** DevUz Studio, Ташкент, Узбекистан, https://devuz.studio. Контакт: [имя владельца], [почта], [телефон].
>
> **Назначение:** веб-сервис для маркетологов и рекламных агентств Узбекистана и Центральной Азии, которые ведут кампании в Яндекс Директе. Сервис помогает не тратить бюджет впустую: находит нецелевые поисковые запросы и предлагает минус-фразы, делает кросс-минусовку групп, сообщает в Telegram о сбоях (остановилась кампания, вырос расход без конверсий, кончается бюджет), предлагает перераспределить дневные бюджеты между кампаниями одного клиента и подводит итоги тестов объявлений.
>
> **Кто пользуется:** рекламодатели и представители агентств, которые сами подключают свои аккаунты через OAuth (право direct:api). Для агентских аккаунтов используется заголовок Client-Login.
>
> **Какие сервисы API используем:** Reports (отчёт по поисковым запросам SEARCH_QUERY_PERFORMANCE_REPORT и отчёт по кампаниям — раз в сутки, офлайн-режим), Campaigns (get, update — минус-фразы и дневной бюджет), AdGroups (get, update — минус-фразы групп и наборы минус-фраз), NegativeKeywordSharedSets (get, add, update), Keywords (get — проверка конфликтов минус-фраз с ключевыми фразами), Ads (get, suspend — остановка проигравших объявлений).
>
> **Как вносим изменения:** по умолчанию сервис только предлагает изменения, применяет их пользователь кнопкой. Автоматический режим включается пользователем отдельно для каждого аккаунта, с дневными ограничениями. Все изменения записываются в журнал с возможностью отката. Ставки по ключевым фразам не меняем — их ведут автостратегии Директа.
>
> **Нагрузка:** на пилоте — до 50 аккаунтов, несколько десятков запросов на аккаунт в сутки; следим за заголовком Units и не выходим за суточный лимит баллов.
>
> **Безопасность:** токены хранятся в зашифрованном виде и удаляются при отключении аккаунта; данные используются только для работы сервиса и не передаются третьим лицам. Политика конфиденциальности: https://devuz.studio/privacy.

### 2.3. Как ходим в API

**Вход пользователя (OAuth Яндекс ID):** `https://oauth.yandex.ru/authorize?response_type=code&client_id=…&redirect_uri=https://devuz.studio/api/ads/oauth/yandex/callback&state=…` → обмен кода: `POST https://oauth.yandex.ru/token` (`grant_type=authorization_code`, `code`, `client_id`, `client_secret`) → access_token + refresh_token (стандартный протокол Яндекс ID — «проверить» срок жизни токена в документации Яндекс ID).

**Адреса:**
- Бой: `https://api.direct.yandex.com/json/v5/{service}` ([заголовки](https://yandex.ru/dev/direct/doc/ru/concepts/headers)).
- Песочница: `https://api-sandbox.direct.yandex.com/json/v5/{service}` («проверить» — адрес в просмотренных страницах документации не показан).
- Для ЕПК Яндекс документирует адреса `https://api.direct.yandex.com/json/v501/{service}` (например, `negativekeywordsharedsets`), структуры описаны в справочнике v5 ([переход на ЕПК](https://yandex.ru/dev/direct/doc/unified-campaign-update), [NegativeKeywordSharedSets](https://yandex.ru/dev/direct/doc/ru/negativekeywordsharedsets/negativekeywordsharedsets)). Кампании ТГО с 22 мая работают в режиме совместимости и создаются как ЕПК. **Решение: базовый путь — константа; начинаем с `v5`, для `UnifiedCampaign` переключаемся на `v501`** — «проверить» на Песочнице, видит ли `v5` кампании ЕПК.

**Заголовки запроса** ([заголовки](https://yandex.ru/dev/direct/doc/ru/concepts/headers)):
```
Authorization: Bearer OAUTH_TOKEN
Client-Login: login-klienta          # обязателен, если запрос идёт от агентства
Accept-Language: ru                  # ru | en | tr
Use-Operator-Units: true             # только агентство: списывать баллы агентства
Content-Type: application/json; charset=utf-8
```
**Заголовки ответа:** `RequestId`; `Units: 10/20828/64000` (потрачено / осталось / суточный лимит); `Units-Used-Login`.

**Баллы** ([баллы](https://yandex.ru/dev/direct/doc/ru/concepts/units)): суточный лимит у каждого рекламодателя и агентства свой (зависит от активности кампаний), делится на 24 часовых окна — в каждом начисляется 1/24 плюс остаток за прошлые 23 часа. Ошибка вызова — 20 баллов, ошибка в операции — 20 баллов за объект. Пример цен: `AdGroups.add` — 20 за вызов + 20 за объект, `Ads.get` — 15 за вызов + 1 за объект. Сервис читает `Units` после каждого ответа и останавливает очередь, если остаток < 10%.

**Общий вид тела:** `{"method": "get|add|update|delete|suspend|…", "params": {…}}`.

#### Campaigns.get — минус-фразы и бюджет
```
POST https://api.direct.yandex.com/json/v5/campaigns
{
  "method": "get",
  "params": {
    "SelectionCriteria": { "Ids": [123456], "States": ["ON", "SUSPENDED"] },
    "FieldNames": ["Id", "Name", "Type", "State", "Status", "NegativeKeywords", "DailyBudget", "Currency"]
  }
}
```
Ответ: `{"result":{"Campaigns":[{"Id":123456,"Name":"…","NegativeKeywords":{"Items":["бесплатно","скачать"]},"DailyBudget":{"Amount":5000000000,"Mode":"STANDARD"},…}]}}`. Имена полей и значения `States`/`Mode` — «проверить» в справочнике `campaigns.get`.

#### Campaigns.update — минус-фразы кампании ([campaigns.update](https://yandex.ru/dev/direct/doc/ru/campaigns/update))
```
POST https://api.direct.yandex.com/json/v5/campaigns
{
  "method": "update",
  "params": {
    "Campaigns": [{
      "Id": 123456,
      "NegativeKeywords": { "Items": ["бесплатно", "купить б/у", "скачать торрент"] }
    }]
  }
}
```
- Фразы — **без минуса перед первым словом**; ≤ 7 слов, слово ≤ 35 символов, всего ≤ **20 000 символов** (пробелы, дефисы, операторы не считаются).
- Не поддерживается для «Медийной кампании».
- Поле задаёт **весь список** — перед записью читать `get`, сливать, проверять лимит, писать целиком («проверить» поведение: передаётся массив целиком, а не добавка).
- В той же структуре можно менять `DailyBudget`, `Name`, `BlockedIps`, `ExcludedSites`, блоки `TextCampaign` / `UnifiedCampaign` (стратегии) — там же.

#### AdGroups.update — минус-фразы группы и наборы ([adgroups.update](https://yandex.ru/dev/direct/doc/ru/adgroups/update))
```
POST https://api.direct.yandex.com/json/v5/adgroups
{
  "method": "update",
  "params": {
    "AdGroups": [{
      "Id": 987654,
      "NegativeKeywords": { "Items": ["угловой", "детский"] },
      "NegativeKeywordSharedSetIds": { "Items": [111, 222] }
    }]
  }
}
```
Группа: ≤ 4 096 символов, наборов ≤ 3.

#### NegativeKeywordSharedSets.add ([add](https://yandex.ru/dev/direct/doc/ru/negativekeywordsharedsets/add))
```
POST https://api.direct.yandex.com/json/v501/negativekeywordsharedsets
{
  "method": "add",
  "params": {
    "NegativeKeywordSharedSets": [{ "Name": "DevUz — мусор", "NegativeKeywords": ["бесплатно", "вакансия"] }]
  }
}
```
≤ 30 наборов на пользователя, имя ≤ 255 символов, в наборе ≤ 4 096 символов. Методы: `add`, `update`, `delete`, `get`.

#### Keywords.get — для проверки конфликтов
```
POST https://api.direct.yandex.com/json/v5/keywords
{"method":"get","params":{"SelectionCriteria":{"CampaignIds":[123456]},"FieldNames":["Id","AdGroupId","Keyword","State"]}}
```
(«проверить» имена полей в справочнике `keywords.get`). Ставки (`keywordbids`, `bids`) не трогаем — их ведут автостратегии.

#### Reports — отчёт по поисковым запросам ([тело запроса](https://yandex.ru/dev/direct/doc/ru/spec.md), [заголовки](https://yandex.ru/dev/direct/doc/ru/headers.md), [режимы](https://yandex.ru/dev/direct/doc/ru/mode.md), [поля](https://yandex.ru/dev/direct/doc/ru/fields-list.md), [деньги](https://yandex.ru/dev/direct/doc/ru/money.md))
```
POST https://api.direct.yandex.com/json/v5/reports
Authorization: Bearer OAUTH_TOKEN
Client-Login: login-klienta
Accept-Language: ru
processingMode: offline          # SEARCH_QUERY_PERFORMANCE_REPORT строится только офлайн
returnMoneyInMicros: false       # суммы в валюте с 2 знаками; без заголовка — ×1 000 000
skipReportHeader: true
skipReportSummary: true

{
  "params": {
    "SelectionCriteria": {
      "Filter": [{ "Field": "Clicks", "Operator": "GREATER_THAN", "Values": ["0"] }]
    },
    "FieldNames": ["CampaignId", "AdGroupId", "Query", "Criterion", "CriterionType",
                   "MatchType", "Impressions", "Clicks", "Cost", "Conversions"],
    "ReportName": "devuz-sq-123456-2026-10-10",
    "ReportType": "SEARCH_QUERY_PERFORMANCE_REPORT",
    "DateRangeType": "LAST_30_DAYS",
    "Format": "TSV",
    "IncludeVAT": "NO"
  }
}
```
- Обязательные поля тела: `SelectionCriteria`, `FieldNames`, `ReportName`, `ReportType`, `DateRangeType`, `Format` (только `TSV`), `IncludeVAT`. `DateFrom`/`DateTo` — только при `CUSTOM_DATE`. Без `Page` — до 1 000 000 строк. Можно `Goals` (до 10 целей Метрики) и `AttributionModels` (`LC` по умолчанию).
- `ReportName` должен быть уникален для разных отчётов: повторный запрос с теми же параметрами — это проверка готовности (имя/оператор фильтра `GREATER_THAN` — «проверить» в справочнике).
- **Ответы:** `200` — отчёт готов, TSV в теле; `201` — поставлен в очередь; `202` — ещё строится, повторить через `retryIn` секунд; `400` — ошибка в параметрах или превышен лимит очереди; `500` — ошибка сервера, повторить один раз. В ответе офлайн-отчёта: `retryIn`, `reportsInQueue` (не больше **5** офлайн-отчётов в очереди на пользователя).
- Поля, доступные в этом отчёте: `Query`, `CampaignId`, `AdGroupId` (атрибуты), `Criterion`, `CriterionId` (только колонки, не фильтр), `CriterionType`, `MatchedKeyword`, `MatchType`, `Placement`, `Impressions`, `Clicks`, `Cost`, `Conversions`, `CostPerConversion`. Поле `Keyword` здесь недоступно.

---

## Часть 3. Секреты и настройки DevUz

| Переменная | Что это | Где взять |
|---|---|---|
| `GOOGLE_ADS_CLIENT_ID` | OAuth client ID (Web) | Cloud Console → Credentials |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth client secret | там же |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | **необязателен** с 09.2026 (сервер игнорирует); оставить пустым, если токена нет | API Center старого MCC, если был |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | (необязательно) ID MCC студии без дефисов, если клиенты привязаны под него | Google Ads |
| `YANDEX_DIRECT_CLIENT_ID` | ClientID приложения | oauth.yandex.ru |
| `YANDEX_DIRECT_CLIENT_SECRET` | Client secret | там же |
| `YANDEX_DIRECT_SANDBOX` | `1` — ходить в Песочницу | наша настройка |
| `ADS_TOKEN_KEY` | 32 байта (base64) для шифрования refresh-токенов AES-256-GCM | `openssl rand -base64 32` |

Все — в хранилище секретов, не в коде и не в `NEXT_PUBLIC_*`. Redirect URI зарегистрировать ровно такими: `https://devuz.studio/api/ads/oauth/google/callback`, `https://devuz.studio/api/ads/oauth/yandex/callback`.

**Страницы на сайте, которые нужны до подачи заявок:** `https://devuz.studio/ads` (что делает приложение, то же название, что в заявке), `https://devuz.studio/privacy` (какие данные берём из Google Ads и Директа, зачем, как удалить), `https://devuz.studio/terms`. Без них Google не пропустит brand verification.

## Чек-лист владельца (коротко)

1. [ ] Страницы `/ads`, `/privacy`, `/terms` на сайте; домен `devuz.studio` подтверждён в Search Console.
2. [ ] Google Cloud: проект, платный биллинг, Google Ads API включён.
3. [ ] Экран согласия: External, In production, брендинг, Verify Branding → Publish branding.
4. [ ] OAuth client (Web) с redirect URI → ключи в секреты.
5. [ ] Тестовый MCC и 1–2 тестовых аккаунта (ID — разработчику).
6. [ ] Overview → Explorer → потом Basic.
7. [ ] Директ: кампания-черновик в аккаунте студии.
8. [ ] oauth.yandex.ru: приложение с `direct:api` и redirect URI → ключи в секреты.
9. [ ] Директ → Настройки API → Мои заявки → «Новая заявка» (полный доступ, текст из 2.2).
10. [ ] Включить Песочницу.
