import type { Locale } from "@/lib/i18n";

/**
 * Что ассистент не говорит о себе.
 *
 * Владелец: «мне не нравится, что идёт утверждение „свою модель мы не
 * обучали“. Это не так — надстройки по использованию модели мы проектируем
 * с тобой сами. Не нужно говорить, что мы используем API, особенно когда до
 * этого заявляется про LLM: это подрывает доверие к нам».
 *
 * Правило стоит в системном промпте первым делом, и в девяти разговорах из
 * десяти этого хватает. Десятый — как раз тот, где клиент спросил трижды и
 * дожал; и именно он уходит клиенту, а не в лог. Поэтому здесь машина:
 * ответ проверяется перед отправкой, а не после.
 *
 * Запрещены обе стороны спора. Сказать «мы обучили свою модель» нельзя —
 * это ложь, и она проверяется одним вопросом. Сказать «мы работаем на
 * чужом API, своей модели у нас нет» тоже нельзя — это не ответ на вопрос
 * клиента про его сайт, а оправдание за то, в чём оправдываться не за что:
 * сценарий разговора, знание проектов, связка с панелью менеджеров —
 * наша работа. Поэтому тема не обсуждается ни в какую сторону.
 */

/**
 * Чужие имена. Назвать поставщика — единственный необратимый промах.
 *
 * Границы слова заданы через `\p{L}`, а не через `\b`. Это не
 * придирчивость: `\b` в JavaScript опирается на `\w`, то есть на
 * `[A-Za-z0-9_]`, и кириллица для него — не буква. Проверка `\bклод\b`
 * не срабатывает никогда, и её зелёный тест ловит только латиницу.
 */
const NAMES =
  /(?<!\p{L})(anthropic|claude|open\s?ai|chat\s?gpt|gpt[\s-]?\d?|gemini|llama|mistral|deep\s?seek|qwen|grok|yandex\s?gpt|gigachat|антропик|клод|опенэйай|чат\s?гпт|джипити|джемини)\p{L}{0,3}(?!\p{L})/iu;

/** Что студия делает с моделями — глаголами, какими об этом говорят. */
const CAN = "(?:делаем|разрабатываем|обуча\\p{L}*|создаём|создаем|пишем|умеем|можем|занимаемся)";

/** Модель, которая наша. Не «модель продаж» и не «модель подписки». */
const OURS =
  "(?:нейросет\\p{L}*|\\bllm\\b|\\brag\\b|(?:сво\\p{L}*|собственн\\p{L}*|ии|ai|язык\\p{L}*)[\\s-]+модел\\p{L}*|модел\\p{L}*\\s+(?:под\\s+)?(?:клиент\\p{L}*|задач\\p{L}*|ваш\\p{L}*))";

/**
 * Оправдания за «чужую» начинку — то, что и вызвало этот модуль.
 *
 * Везде `\p{L}` вместо `\w` и флаг `u` по той же причине: `внешн\w*` не
 * совпадает с «внешней», потому что «е» для `\w` не буква. Такой набор
 * правил выглядит рабочим, проходит проверку типов и не ловит ничего.
 */
const EXCUSES: RegExp[] = [
  /\bllm[\s-]*api\b/iu,
  /на\s+(?:базе|основе)\s+(?:внешн|чуж|сторонн)\p{L}*/iu,
  /(?:внешн|чуж|сторонн)\p{L}*\s+(?:языков\p{L}*\s+)?модел/iu,
  /(?:внешн|чуж|сторонн)\p{L}*\s+(?:llm|нейросет\p{L}*)/iu,
  /(?:своей|собственной)\s+модели[^.!?]{0,24}нет(?!\p{L})/iu,
  /нет[^.!?]{0,24}(?:своей|собственной)\s+модели/iu,
  /\bwe\s+(?:did\s*n[o']t|do\s*n[o']t|have\s*n[o']t)\s+train/iu,
  /\b(?:third[\s-]?party|external)\s+(?:llm|language\s+model|model\s+api)/iu,
  // Принижение студии. Владелец: «мы же студия, которая может делать свои
  // модели, свои RAG. Категорически нельзя говорить этого». Ассистент,
  // рассказывающий, чего мы не умеем, закрывает продажу той самой услуги,
  // ради которой разговор и идёт.
  //
  // Слово «модель» само по себе сюда не годится: в деловом разговоре это
  // чаще модель продаж, подписки или монетизации, и правило на голое
  // «модель» обрывало бы обычную реплику про бизнес клиента. Поэтому
  // ловим только ту модель, которая наша: своя, языковая, нейросеть, RAG
  // или «под клиента».
  new RegExp(`не\\s+${CAN}[^.!?]{0,30}${OURS}`, "iu"),
  new RegExp(`${OURS}[^.!?]{0,40}не\\s+${CAN}`, "iu"),
  /(?:просто|всего\s+лишь|лишь)\s+(?:обёртк|обертк|надстройк|прослойк|оболочк)/iu,
];

/**
 * Сколько символов держим, прежде чем отдать их клиенту.
 *
 * Поток приходит мелкими кусками, и запрещённая фраза приезжает разрезанной
 * на три-четыре части. Проверять каждый кусок отдельно бессмысленно: ни в
 * одном из них целой фразы нет. Поэтому хвост длиной с самую длинную фразу
 * придерживается — к моменту, когда фраза дособралась, она целиком лежит в
 * этом хвосте и наружу не ушла.
 */
export const HOLD_CHARS = 90;

export type SelfTalk = {
  /** Что именно сработало — для лога. */
  what: string;
  /** С какого символа началась запрещённая фраза. */
  index: number;
};

/**
 * Найти запрещённое в тексте.
 *
 * Позиция нужна не для отчёта: по ней отрезается ровно та фраза, которая
 * не должна прозвучать, а всё сказанное до неё — про цену, сроки, состав
 * работ — доходит до клиента. Выбрасывать заодно и это значит наказывать
 * клиента за промах ассистента.
 */
export function findSelfTalk(text: string): SelfTalk | null {
  const name = text.match(NAMES);
  if (name) return { what: `имя модели: ${name[0]}`, index: name.index ?? 0 };
  for (const rule of EXCUSES) {
    const hit = text.match(rule);
    if (hit) return { what: `оправдание: ${hit[0].slice(0, 60)}`, index: hit.index ?? 0 };
  }
  return null;
}

/** Коротко: чисто или нет. */
export function selfTalkHit(text: string): string | null {
  return findSelfTalk(text)?.what ?? null;
}

/**
 * Чем ответ продолжается вместо запрещённого.
 *
 * Не «я не могу об этом говорить»: отказ без содержания читается как уход
 * от неудобного. И не рассказ про начинку — её тут и вырезали. Вместо
 * этого одна фраза о том, что студия умеет делать клиенту: ассистенты на
 * его данных и поиск по его базе — это наша услуга, а не чужая заслуга.
 * Вопрос «что у тебя под капотом» так превращается в разговор о заказе.
 */
const REDIRECT: Record<Locale, string> = {
  ru: "Ассистент — наша разработка, технический стек мы не раскрываем. Такие решения мы делаем и на заказ: ассистент на ваших данных, поиск по вашей базе, дообучение под задачу. Вернёмся к делу: чем занимается ваша компания?",
  en: "The assistant is our own build; we don't disclose the technical stack. We build these to order as well: an assistant on your data, search across your knowledge base, tuning for your task. Back to business: what does your company do?",
  uz: "Assistent — bizning ishlanmamiz, texnik stekni oshkor qilmaymiz. Bunday yechimlarni buyurtmaga ham qilamiz: sizning ma'lumotlaringiz asosidagi assistent, bazangiz bo'ylab qidiruv, vazifangizga moslash. Ishga qaytaylik: kompaniyangiz nima bilan shug'ullanadi?",
  zh: "这个助手是我们自己的成果，技术栈我们不对外透露。这类方案我们也承接定制：基于贵方数据的助手、面向贵方知识库的检索、针对具体任务的调优。回到正事：贵公司是做什么的？",
};

export function redirectLine(locale: Locale): string {
  return REDIRECT[locale] ?? REDIRECT.ru;
}

/**
 * Фильтр на потоке ответа.
 *
 * Отдаёт клиенту всё, кроме последних HOLD_CHARS символов; сработало —
 * хвост выбрасывается целиком и дописывается возврат к делу. Уже
 * показанный кусок обрывается многоточием: человек видит, что мысль
 * сменилась, а не подвисла.
 */
export class ReplyGuard {
  private held = "";
  private shown = "";
  private tripped = false;

  // Поля объявлены отдельно от конструктора не для красоты: сокращённая
  // запись `constructor(private readonly locale: Locale)` — это TypeScript,
  // который нельзя просто стереть, и Node, запускающий тесты стиранием
  // типов, такой файл не загружает вовсе.
  private readonly locale: Locale;
  private readonly out: (value: string) => void;
  private readonly onTrip?: (what: string) => void;

  constructor(locale: Locale, out: (value: string) => void, onTrip?: (what: string) => void) {
    this.locale = locale;
    this.out = out;
    this.onTrip = onTrip;
  }

  push(chunk: string): void {
    if (this.tripped || !chunk) return;
    this.held += chunk;

    const found = findSelfTalk(this.held);
    if (found) return this.trip(found);

    if (this.held.length > HOLD_CHARS) {
      const ready = this.held.slice(0, this.held.length - HOLD_CHARS);
      this.held = this.held.slice(this.held.length - HOLD_CHARS);
      this.say(ready);
    }
  }

  /** Конец потока: отдать придержанное. Вызывать обязательно. */
  end(): void {
    if (this.tripped) return;
    const found = findSelfTalk(this.held);
    if (found) return this.trip(found);
    this.say(this.held);
    this.held = "";
  }

  private say(value: string): void {
    if (!value) return;
    this.shown += value;
    this.out(value);
  }

  private trip(found: SelfTalk): void {
    this.tripped = true;
    console.error("чат: ассистент заговорил о своей начинке —", found.what);
    this.onTrip?.(found.what);

    // Всё, что успело сказаться до запрещённой фразы, — по границу
    // последнего законченного предложения. Обрывок фразы клиенту не
    // показываем: «Про начинку: я работ» читается как сбой.
    const head = this.held.slice(0, found.index);
    const whole = head.match(/^[\s\S]*[.!?…](?=\s|$)/);
    this.held = "";
    if (whole) this.say(whole[0]);

    const tail = this.shown.trimEnd();
    if (tail && !/[.!?…:]$/.test(tail)) this.say("…");
    this.say(`${this.shown.trim() ? "\n\n" : ""}${redirectLine(this.locale)}`);
  }
}
