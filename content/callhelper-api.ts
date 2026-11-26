/**
 * Описание API DevUz CallHelper для людей: страница /ru/callhelper/api.
 * Список адресов сверяет тест с разбором запросов (lib/callhelper/api.ts):
 * адрес, которого нет в коде, сюда не попадёт. Только по-русски.
 */
export const CALLHELPER_API_PATH = "callhelper/api";
export const CALLHELPER_API_BASE = "/api/callhelper/v1";

export type ApiDoc = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  what: string;
  body?: string;
  reply: string;
};

export const CALLHELPER_API_INTRO = {
  title: "API DevUz CallHelper",
  lead:
    "Подключите суфлёр к своей телефонии, сервису набора или CRM. Ваша программа передаёт нам реплики разговора или звук, а получает подсказку оператору и итог звонка: какие этапы сценария пройдены, какие возражения звучали, что оператор нарушил.",
  auth:
    "Каждый запрос идёт с ключом колл-центра в заголовке Authorization: Bearer chk_… Ключ выдаём мы, он один на колл-центр. Храните его на сервере или в расширении оператора, в открытый код страницы не кладите.",
  audio:
    "Кусок речи до 20 секунд, без сжатия, 16 кГц, 16 бит, один канал (PCM, little-endian). Голос оператора и голос клиента шлите отдельно, с пометкой who: так мы точно знаем, кто что сказал. Звук распознаётся в России и не хранится, разговор текстом тоже не хранится: после звонка остаётся только итог.",
  minutes:
    "Минуты считаются по времени звонка: от начала до завершения. Пробный период: 3 дня и 50 минут с первого звонка, один звонок разом, звонок до 5 минут.",
} as const;

export const CALLHELPER_API_DOCS: readonly ApiDoc[] = [
  {
    method: "GET",
    path: "/me",
    title: "Проверить ключ",
    what: "Кто вы, какой тариф, сколько минут осталось и работает ли доступ.",
    reply: `{ "org": { "name": "…", "plan": "trial" }, "access": { "ok": true, "minutes_left": 50 }, "used_minutes": 0 }`,
  },
  {
    method: "GET",
    path: "/scripts",
    title: "Сценарии звонка",
    what: "Все ваши сценарии: этапы разговора, ответы на возражения, обязательные фразы и запрещённые слова.",
    reply: `{ "scripts": [ { "id": "…", "name": "Запись на замер", "script": { … } } ] }`,
  },
  {
    method: "PUT",
    path: "/scripts",
    title: "Создать сценарий",
    what: "Новый сценарий. Чтобы поправить существующий, шлите на /scripts/{id}.",
    body: `{ "name": "Запись на замер", "script": { "product": "Кухни на заказ", "goal": "Записать на бесплатный замер", "stages": [ { "name": "Представиться", "say": "Здравствуйте, это студия кухонь…", "words": ["студия кухонь"] } ], "objections": [ { "name": "Дорого", "words": ["дорого"], "answer": "Понимаю. Давайте посчитаем точно…" } ], "must": ["разговор записывается"], "banned": ["гарантирую"] } }`,
    reply: `{ "script": { "id": "…", "name": "…", "script": { … } } }`,
  },
  {
    method: "DELETE",
    path: "/scripts/{id}",
    title: "Удалить сценарий",
    what: "Убирает сценарий. Звонки, которые по нему прошли, остаются.",
    reply: `{ "ok": true }`,
  },
  {
    method: "POST",
    path: "/calls",
    title: "Начать звонок",
    what: "Заводит звонок и возвращает его номер. external_id: номер звонка в вашей системе, по нему вы потом найдёте итог.",
    body: `{ "script_id": "…", "operator": "Анна", "external_id": "call-48213", "source": "my-dialer" }`,
    reply: `{ "call": { "id": "…", "started_at": "…" } }`,
  },
  {
    method: "POST",
    path: "/calls/{id}/stt?who=client",
    title: "Распознать кусок речи",
    what: "Тело запроса: сам звук (см. «Звук» выше). who: client или operator. В ответ текст этого куска.",
    reply: `{ "who": "client", "text": "а сколько это стоит" }`,
  },
  {
    method: "POST",
    path: "/calls/{id}/hint",
    title: "Получить подсказку",
    what: "Шлёте реплики разговора по порядку (до 60 последних), получаете, что сказать оператору сейчас. Если текст разговора у вас уже есть, распознавание не нужно: шлите сразу сюда.",
    body: `{ "lines": [ { "who": "operator", "text": "Здравствуйте, это студия кухонь" }, { "who": "client", "text": "Это дорого, наверное" } ] }`,
    reply: `{ "phrase": "Понимаю. Давайте посчитаем точно…", "hint": { "objection": { "name": "Дорого" }, "stages": [ … ], "banned": [], "missingMust": [ … ] } }`,
  },
  {
    method: "POST",
    path: "/calls/{id}/end",
    title: "Завершить звонок",
    what: "Шлёте весь разговор текстом (до 400 реплик), получаете итог. Сам разговор мы не сохраняем.",
    body: `{ "lines": [ … ] }`,
    reply: `{ "call": { "seconds": 184, "summary": { "stagesDone": 4, "stages": [ … ], "objections": ["Дорого"], "banned": [], "missingMust": [], "recordNotice": true } } }`,
  },
  {
    method: "GET",
    path: "/calls?since=2026-12-14T00:00:00Z&limit=50",
    title: "Итоги звонков",
    what: "Последние звонки с итогами, новые первыми. Забирайте их в свою CRM или отчёт.",
    reply: `{ "calls": [ { "id": "…", "external_id": "call-48213", "operator": "Анна", "seconds": 184, "summary": { … } } ] }`,
  },
  {
    method: "POST",
    path: "/stt?who=client",
    title: "Распознать кусок до начала звонка",
    what: "Для работы сменой, когда звонки идут подряд: узнать, заговорил ли клиент, и только тогда начать звонок. Тишина и гудки возвращают пустой текст. Минуты за это не считаются, но не чаще 30 раз в минуту на оператора.",
    body: "Тот же звук, что у звонка: 16 кГц, 16 бит, моно, до 20 секунд.",
    reply: `{ "who": "client", "text": "алло, слушаю" }`,
  },
  {
    method: "GET",
    path: "/calls/{id}",
    title: "Один звонок",
    what: "Звонок по нашему номеру: время, оператор, итог.",
    reply: `{ "call": { "id": "…", "ended_at": "…", "summary": { … } } }`,
  },
];

/** Что значит ответ с ошибкой: код в поле error. */
export const CALLHELPER_API_ERRORS: readonly { code: string; status: number; what: string }[] = [
  { code: "unauthorized", status: 401, what: "Ключа нет или он неверный." },
  { code: "trial_over", status: 402, what: "Пробный период кончился: дни или минуты." },
  { code: "unpaid", status: 402, what: "Оплаченный срок кончился." },
  { code: "inactive", status: 402, what: "Доступ колл-центра выключен." },
  { code: "call_limit", status: 402, what: "Звонок длиннее, чем разрешает тариф (на пробном 5 минут)." },
  { code: "scripts_limit", status: 402, what: "Сценариев больше, чем разрешает тариф (на пробном один)." },
  { code: "seats", status: 409, what: "Одновременных звонков больше, чем оплачено операторов." },
  { code: "ended", status: 409, what: "Звонок уже завершён." },
  { code: "script", status: 400, what: "Сценарий заполнен с ошибками, список в поле problems." },
  { code: "audio", status: 400, what: "Звук не того вида или короче 0,2 секунды." },
  { code: "too_big", status: 413, what: "Кусок звука длиннее 20 секунд или запрос слишком большой." },
  { code: "rate", status: 429, what: "Слишком часто. Подождите минуту." },
  { code: "stt_down", status: 503, what: "Распознавание сейчас не ответило. Повторите этот кусок." },
  { code: "not_found", status: 404, what: "Такого адреса, сценария или звонка нет." },
];
