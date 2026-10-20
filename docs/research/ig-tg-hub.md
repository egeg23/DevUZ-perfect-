# Хаб «Instagram Direct → Telegram»: API, готовые решения, схема

Снято 20.10.2026: документация Meta и Telegram, GitHub, страницы тарифов
сервисов (WebFetch, веб-поиск, три запроса Firecrawl). Что не нашли в
первоисточнике, помечено «не подтверждено».

Задача: сообщения из Direct компании (и ответы на рекламу Click-to-Direct)
приходят в Telegram, менеджер отвечает там же, клиент получает ответ в
Instagram от аккаунта компании. Образец у другой компании: форум-группа, на
каждого клиента тема, первым постом карточка (имя, @username, IGSID, статус,
«окно ответа: осталось 23 ч 59 мин», «лид в Odoo: не создан», кнопки
«Взять» / «Создать лид» / «Закрыть»), строки «отправлено вручную из
Instagram», быстрые ответы ru/uz, медиа в обе стороны.

## 1. Сторона Instagram

### Какой API брать

| | Instagram API с входом через Instagram | Messenger Platform для Instagram (вход через Facebook) |
|---|---|---|
| Страница Facebook | не нужна | обязательна, связана с IG-аккаунтом |
| Разрешения | `instagram_business_basic`, `instagram_business_manage_messages` | `instagram_basic`, `instagram_manage_messages`, `pages_manage_metadata` |
| Вебхуки | на объект Instagram | на страницу (Page) |
| Источник | [messaging-api](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api) | [get-started](https://developers.facebook.com/docs/messenger-platform/instagram/get-started) |

Берём **вход через Instagram**. Причины: у малого бизнеса в Ташкенте часто
нет страницы Facebook или к ней нет доступа; Meta сама пишет, что без
привязанной страницы нужен именно этот путь
([get-started](https://developers.facebook.com/docs/messenger-platform/instagram/get-started));
таблица полей вебхуков для обмена сообщениями расписана под него
([fields](https://developers.facebook.com/documentation/instagram-platform/webhooks/fields)).
Вход через Facebook оставить запасным путём для клиента, у которого всё уже
заведено в Business Manager.

Профиль клиента для карточки: `GET /<IGSID>?fields=name,username,profile_pic,
follower_count,is_verified_user,is_user_follow_business` — только после того,
как клиент написал сам; `profile_pic` живёт несколько дней, картинку надо
сохранять себе ([user-profile](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/user-profile)).

### Вебхуки, которые нужны

Все требуют `instagram_business_basic` + `instagram_business_manage_messages`
([fields](https://developers.facebook.com/documentation/instagram-platform/webhooks/fields)),
примеры полей — [examples](https://developers.facebook.com/documentation/instagram-platform/webhooks/examples).

| Поле | Что приходит | Зачем хабу |
|---|---|---|
| `messages` | текст, вложения, `reply_to.story` (url, id) — ответ на сторис | основной поток в тему клиента |
| `message_echoes` | то же с `"is_echo": true` — ушло от аккаунта компании | строка «отправлено вручную из Instagram»; свои отправки отсеивать по `mid`, который вернул Send API. В таблице Meta у этого поля почему-то указано `instagram_business_manage_comments` — проверить в кабинете приложения |
| `message_reactions` | `action: react/unreact`, `reaction`, `emoji` | показать реакцию в теме |
| `messaging_postbacks` | `postback.title`, `payload` — нажатие кнопки или icebreaker | |
| `messaging_seen` | `read.mid` | галочка «прочитано» |
| `messaging_referral` | переход по ссылке ig.me / реклама, когда диалог уже был | |

**Что приходит с рекламы** — объект `referral` внутри `message`
([examples](https://developers.facebook.com/documentation/instagram-platform/webhooks/examples)):
`source: "ADS"`, `type: "OPEN_THREAD"`, `ad_id`, `ref` (если задан),
`ads_context_data.ad_title`, `ads_context_data.photo_url` (если нажали на
картинку) или `video_url` (превью видео). `post_id` в примере Meta стоит
закомментированным — **не подтверждено**, что он приходит. `product_id`
в примере нет. Вывод: в карточку кладём название объявления и превью; id
объявления — для связи с кабинетом рекламы.

### Окно ответа

- Обычное окно — 24 часа от действия клиента
  ([messaging-api](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)).
- **Click-to-Direct — до 7 дней.** В документации Meta сейчас стоит: «When
  the user action is a person sending their first message after clicking a
  Click-to-Direct ad, the window may last up to 7 days from that message»
  ([messaging-api](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)).
  Дата начала **28.09.2026 не подтверждена** первоисточником: её называет
  только блог Spur
  ([spurnow](https://www.spurnow.com/en/blogs/instagram-messenger-ads-7-day-messaging-window));
  в changelog Messenger Platform такой записи мы не нашли
  ([changelog](https://developers.facebook.com/docs/messenger-platform/changelog)).
  Таймер в карточке считать так: реклама → 7 дней от первого сообщения,
  остальное → 24 часа от последнего сообщения клиента.
- **HUMAN_AGENT** — отдельное окно 7 дней для ответа человеком
  ([messaging-api](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)).
  Нужна отдельная функция «Human Agent» в App Review — так пишут Phyllo и
  Chatwoot ([phyllo](https://www.getphyllo.com/post/instagram-api-permissions-scopes),
  [chatwoot](https://developers.chatwoot.com/self-hosted/instagram-app-review));
  в первоисточнике Meta требование не нашли — **не подтверждено**. Написание
  тега (`HUMAN_AGENT` или `human_agent`) сверить в справочнике Send API.
- Медиа наружу: картинки png/jpeg до 8 МБ; видео mp4/ogg/avi/mov/webm,
  аудио aac/m4a/wav/mp4, pdf — до 25 МБ
  ([messaging-api](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)).
  Всё, что больше, хаб должен сжимать или отдавать ссылкой.

### Доступ и проверка Meta

- **Standard Access** — хватает для аккаунтов, которыми владеет или управляет
  сам владелец приложения, или добавленных в приложение руками.
  **Advanced Access** — нужен, если хаб обслуживает чужие аккаунты
  ([messaging-api](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)).
  Наш случай (хаб студии для клиентов) — Advanced Access через App Review.
- Проверка бизнеса (Business Verification) и статус Tech Provider: Meta
  требует проверку доступа у приложений, работающих с данными других
  бизнесов ([блог Meta, 2022](https://developers.facebook.com/blog/post/2022/06/02/access-verification-process-for-tech-provider-apps/)).
  Входит ли туда `instagram_business_manage_messages` — **не подтверждено**.
  Срок App Review 2-4 недели — оценка Phyllo, **не подтверждено** Meta.
- Обход App Review: каждый клиент создаёт своё приложение Meta и даёт нам
  токен (Standard Access, аккаунт свой). Дольше на подключение, зато без
  проверки. Годится для пилота.

### Лимиты

Send API: 300 вызовов/с на аккаунт для текста, ссылок, реакций и стикеров,
10/с для аудио и видео, Conversations API — 2/с; слишком много сообщений в
один диалог тоже режется
([rate-limiting](https://developers.facebook.com/docs/messenger-platform/overview/rate-limiting)).
Сторонние источники пишут 100/с для входа через Instagram — **не
подтверждено**. Для хаба одной компании лимиты Instagram не узкое место;
узкое место — Telegram (ниже).

## 2. Сторона Telegram

Текущая версия Bot API — **10.3 от 24.08.2026**
([api-changelog](https://core.telegram.org/bots/api-changelog)). Темы в
версиях 9.5-10.3 не менялись.

**Темы в форум-группе** ([api](https://core.telegram.org/bots/api)):

- `createForumTopic(chat_id, name 1-128, icon_color, icon_custom_emoji_id)` —
  бот админ с правом `can_manage_topics`. Цвета: 0x6FB9F0, 0xFFD67E,
  0xCB86DB, 0x8EEE98, 0xFF93B2, 0xFB6F5F — задаются только при создании.
- `editForumTopic` — имя и значок-эмодзи (цвет не меняется). Статус удобно
  писать в имени: «🟢 Aziza · реклама».
- `closeForumTopic` / `reopenForumTopic` — **только в супергруппе**.
- Сообщения в тему — `message_thread_id` у `sendMessage`, `copyMessage`,
  `sendPhoto` и т. д.

**Темы в личке с ботом**
([api-changelog](https://core.telegram.org/bots/api-changelog)):

- 9.3 (31.12.2025): `User.has_topics_enabled`, `message_thread_id` и
  `is_topic_message` в личке, отправка в тему лички, `editForumTopic` и
  `deleteForumTopic` в личке.
- 9.4 (09.02.2026): `createForumTopic` в личке; запрет пользователю
  создавать и удалять темы — настройка в мини-приложении @BotFather;
  поле `allows_users_to_create_topics`. Там же цвет кнопок (`style`).
- Закрыть тему в личке нельзя (close/reopen — только супергруппа):
  «закрытый» клиент — переименование и значок или удаление темы.
- Как включается режим тем в личке (через @BotFather) и с какой версии
  приложения Telegram у менеджера видны темы в личке — **не подтверждено**.

**Лимиты** ([faq](https://core.telegram.org/bots/faq)): в один чат —
не больше ~1 сообщения в секунду; **в группу — не больше 20 сообщений в
минуту**; всего — около 30 в секунду. Важно: лимит группы общий на все темы
форума. 30 клиентов пишут одновременно → карточки, медиа и эхо в одной
группе упрутся в 20/мин, сообщения пойдут с задержкой.

## 3. Готовое

### GitHub

| Репозиторий | ★ | Последний push | Лицензия | Что взять |
|---|---|---|---|---|
| [nessshon/support-bot](https://github.com/nessshon/support-bot) | 134 | 19.10.2026 | MIT | aiogram, тема на пользователя в группе, шаблон репо; логика «тема ↔ пользователь» |
| [apkuzmin/telegram-support-bot](https://github.com/apkuzmin/telegram-support-bot) | 11 | 23.07.2026 | MIT | тема на клиента, медиа в обе стороны, правки, **HTTP-мост** для внешних каналов — ближе всего к нашему |
| [paipaiio/telegram-customer-service-bot](https://github.com/paipaiio/telegram-customer-service-bot) | 10 | 07.09.2026 | своя (Other) | Go; синхронизация ответ/правка/удаление, карта цитат. Лицензию читать до копирования |
| [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | 38 004 | 20.10.2026 | MIT (ядро; enterprise-часть отдельно — **не подтверждено**) | канал Instagram через официальный API, разбор вебхуков, гайд по App Review ([docs](https://developers.chatwoot.com/self-hosted/instagram-app-review)). Telegram там — канал для клиентов, не окно менеджера |
| [mautrix/meta](https://github.com/mautrix/meta) | 452 | 20.10.2026 | AGPL-3.0 | мост Instagram DM ↔ Matrix через личный вход, не официальный API. Риск бана аккаунта, AGPL — **не брать**, только смотреть разбор вложений |

Готового открытого моста «Instagram Direct (официальный API) → темы
Telegram» не нашли (поиск GitHub по «instagram telegram bridge» пуст).
Собираем сами: приёмник вебхуков Meta + логика тем из apkuzmin/nessshon.

### Сервисы в СНГ

Курс для пересчёта ~80 ₽ за $ — **оценка, не подтверждено**.

| Сервис | Что делает | Цена | Чего нет для нашей задачи |
|---|---|---|---|
| Wazzup | мессенджеры и Instagram в amoCRM/Битрикс24 | Instagram: Inbox 2 000 ₽ (~$25, только входящие, 500 диалогов), Max 4 000 ₽ (~$50) в месяц за канал ([toolfox](https://toolfox.ru/services/s/wazzup)); с сайта: «от 800 руб» ([wazzup24.ru](https://wazzup24.ru/pricing/)) | ответ из самого Telegram — **не подтверждено**, работа в CRM или их окне |
| Umnico | единое окно + CRM | Telegram-бот 650 ₽, оператор 2 275 ₽ в месяц, Instagram на русской странице нет ([umnico.com/ru/payment](https://umnico.com/ru/payment/)); в $: Instagram бесплатно, Telegram $6,50, оператор $29,25 ([eesel](https://www.eesel.ai/blog/umnico-pricing), сторонний) | то же |
| i2crm | Instagram и мессенджеры в CRM | 1 990 / 3 990 / 5 990 ₽ (~$25/50/75) за аккаунт в месяц ([toolfox](https://toolfox.ru/services/s/i2crm)) | то же |
| SaleBot | конструктор ботов, «единое окно» | 0 / 2 999 / 3 999 ₽ (~$0/37/50) ([toolfox](https://toolfox.ru/services/s/salebot)); Instagram в списке каналов там нет | Instagram под вопросом |
| Kommo | CRM с Instagram | $25 / $35 за пользователя в месяц, оплата от 6 месяцев ([kommo](https://www.kommo.com/pricing/)) | своё окно, не Telegram |
| Chatwoot Cloud | открытое окно поддержки | $19 / $39 / $99 за агента в месяц ([chatwoot](https://www.chatwoot.com/pricing/)) | своё окно, не Telegram |

Общее у всех: менеджер работает в CRM или в их приложении. Ответа прямо из
Telegram-темы, превью рекламы в карточке и раздельных тем по менеджерам у
них в найденном нет (по каждому — **не подтверждено**, демо не смотрели).
Это и есть наше отличие.

## 4. Схемы «ответ из одного окна»

| | A. Форум-группа, тема на клиента | B. «Новые заявки» → «Взять» → тема в личке менеджера | C. Лента без тем, ответ реплаем |
|---|---|---|---|
| Кто что видит | все всё | менеджер — свои; руководитель — всё в запасной группе A | все всё |
| Порядок | легко ответить в чужом диалоге | хозяин один, «Взять» кто первый | каша при 10+ клиентах |
| Лимит Telegram | 20 сообщений/мин на всю группу — узко | 1/с на каждую личку, 30/с всего — с запасом | 20/мин на группу |
| Сложность | низкая, есть готовый код | средняя: передача, повтор в группу руководителя | низкая |
| Риск | спор «кто отвечает», шум | темы в личке — новинка 9.3/9.4, у старых приложений может не быть; закрыть тему в личке нельзя; дубли в группу A съедают её лимит | ответ без реплая теряется; медиа-альбомы ломают привязку |

Про C: в обсуждении Make прямо говорят, что при потоке личка не годится и нужна супергруппа с ветками ([make](https://community.make.com/t/telegram-bot-instagram-direct/46123)).

**Рекомендация: B, а A — окно руководителя.**

- Новое сообщение → карточка в чат «Новые заявки» (имя, @username,
  реклама с превью, таймер окна) и кнопка «Взять». Первый нажавший —
  хозяин, у остальных кнопка гаснет.
- У хозяина в личке с ботом появляется тема клиента, вся переписка идёт
  туда. Ответ в теме → Send API → Instagram.
- Руководителю — форум-группа A, та же тема на клиента, но **сводкой**:
  без медиа целиком, пачкой раз в N секунд, чтобы не упереться в 20/мин.
  Из неё руководитель может «Забрать» и ответить сам.
- Нет тем в личке у менеджера (`has_topics_enabled`, старое приложение) —
  запасной вид: сообщения клиента с префиксом и ответ реплаем (схема C
  только для этого человека).
- Окно истекает — за 2 часа строка в тему; после — кнопка ответа
  неактивна, при включённом HUMAN_AGENT — ещё 7 дней.
- Эхо (`is_echo`), отправленное не хабом, → строка «отправлено вручную из
  Instagram» в теме хозяина.

Риски: Meta не выдаст Advanced Access или Human Agent (пилот на
Standard Access у одного клиента); темы в личке видны не всем (проверить на
телефонах команды до запуска); лимит 20/мин в группе руководителя.

## 5. Что нужно от клиента для запуска

1. Профессиональный аккаунт Instagram (бизнес или автор), пароль и
   двухфакторка у владельца. Страница Facebook — не нужна при входе через
   Instagram; нужна, только если идём через Messenger Platform.
2. В приложении Instagram: «Разрешить доступ к сообщениям» для подключённых
   инструментов — **не подтверждено** точное название настройки в 2026.
3. Доступ к Meta Business (Business Manager) с правом на рекламный кабинет —
   чтобы по `ad_id` видеть кампанию; документы для проверки бизнеса, если
   Meta её спросит.
4. Решение по пути: наше приложение с Advanced Access (ждём App Review) или
   приложение клиента со Standard Access (быстрее, клиент делает руками).
5. Telegram: список менеджеров (их Telegram-id), руководитель, супергруппа
   с темами, где бот админ с `can_manage_topics`; бот компании или наш.
6. CRM: ключ API (Odoo — адрес, база, пользователь, ключ), куда класть лид
   и какие поля обязательны.
7. Быстрые ответы на русском и узбекском, часы работы, кто отвечает ночью.
