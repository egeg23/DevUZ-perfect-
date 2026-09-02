"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import { PROMISE_SECONDS } from "@/lib/promise-terms";

type Message = { role: "user" | "assistant"; content: string };

/**
 * Чат с AI-менеджером.
 *
 * Ответ приходит потоком, поэтому текст проявляется по мере генерации, а не
 * возникает целиком через несколько секунд. Для первой линии продаж это не
 * украшение: ожидание пустого экрана читается как «бот завис», и человек
 * закрывает вкладку раньше, чем получает ответ.
 */
export function ChatPanel({
  locale,
  dict,
  className,
  compact = false,
  prefill,
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
  compact?: boolean;
  /** Готовый текст из калькулятора, подставляемый в поле ввода. */
  prefill?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: dict.chat.greeting },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Диалог, по которому бриф уже отправлен. Сервер по этому флагу не создаст
  // второй, даже если модель снова вызовет инструмент.
  const [qualified, setQualified] = useState(false);
  const [status, setStatus] = useState<
    null | "error" | "disabled" | "qualified" | "undelivered"
  >(null);
  /** Номер заявки, назначенный при передаче менеджеру. */
  const [requestNo, setRequestNo] = useState<string | null>(null);
  /**
   * Гарантия не сработала — скидка подтверждена.
   *
   * Считаем на клиенте, от момента нажатия «Отправить»: обещаны двадцать
   * секунд ожидания, которые видит человек, а не двадцать секунд работы
   * сервера. Медленная сеть — тоже наше ожидание, и прятаться за неё нечестно.
   */
  const [discount, setDiscount] = useState(false);
  /** Момент отправки первой реплики: с него идёт отсчёт. */
  const [waitStart, setWaitStart] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(PROMISE_SECONDS);
  /**
   * Готовая ссылка на продолжение разговора в Telegram.
   *
   * Готовится заранее, а не по нажатию. Раньше кнопка сначала ходила на
   * сервер за токеном и только потом вызывала window.open — а окно, открытое
   * после await, браузер считает всплывающим и блокирует. Человек нажимал,
   * не происходило ничего, он открывал бота руками, и тот здоровался с ним
   * как с незнакомцем: токена-то не было. Теперь это обычная ссылка в
   * разметке, и клик по ней блокировать нечему.
   */
  const [tgUrl, setTgUrl] = useState<string | null>(null);
  /** Токен этого разговора: по нему обновляем переписку, а не плодим новые. */
  const tgToken = useRef<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Поле ввода растёт под текст.
   *
   * Расчёт из калькулятора приходит на несколько строк, и в поле высотой в
   * одну строку человек видит только начало — то есть не может проверить,
   * что именно уйдёт менеджеру. Высота сбрасывается в auto перед замером,
   * иначе scrollHeight запомнит предыдущее, большее значение и поле уже
   * никогда не уменьшится.
   */
  const autoGrow = useCallback(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  /**
   * Обратный отсчёт до конца гарантии.
   *
   * Тикает только пока ждём самый первый ответ. Дальше обещание считается
   * выполненным: оно про скорость первого касания, а не про каждую реплику.
   */
  useEffect(() => {
    if (waitStart === null) return;

    const tick = () => {
      const left = Math.ceil((PROMISE_SECONDS * 1000 - (Date.now() - waitStart)) / 1000);
      if (left <= 0) {
        setRemaining(0);
        setDiscount(true);
        setWaitStart(null);
        return;
      }
      setRemaining(left);
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [waitStart]);

  /**
   * Держим ссылку на бота готовой и свежей.
   *
   * Перезапрашиваем после каждой законченной реплики: в токене лежит
   * переписка, и ссылка, выданная в начале разговора, привела бы человека
   * в бота с половиной контекста.
   */
  useEffect(() => {
    if (busy) return;
    if (!messages.some((m) => m.role === "user")) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages.slice(1),
            locale,
            qualified,
            requestNo,
            discount,
            token: tgToken.current,
          }),
        });
        const data = (await response.json()) as { url?: string; token?: string };
        if (cancelled || !data.url) return;
        tgToken.current = data.token ?? null;
        setTgUrl(data.url);
      } catch {
        // Не получилось — ссылка останется прежней или её не будет вовсе.
        // Прямой путь к нам у человека в любом случае есть: контакт студии
        // указан в подвале и на странице контактов.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [messages, busy, locale, qualified, requestNo, discount]);

  useEffect(() => {
    if (!prefill) return;
    // Расчёт из калькулятора не отправляем сразу: человек должен успеть
    // дописать детали, ради которых он и пришёл в чат.
    setInput(prefill);
    requestAnimationFrame(() => {
      autoGrow();
      // preventScroll обязателен: без него браузер подтягивает страницу к
      // полю ввода, и вместо открывшегося виджета человек видит рывок вниз.
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.setSelectionRange(prefill.length, prefill.length);
    });
  }, [prefill, autoGrow]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    // Отсчёт запускается только на первой реплике: гарантия про то, как
    // быстро студия отзовётся, а не про темп переписки.
    const firstTurn = !messages.some((m) => m.role === "user");

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setBusy(true);
    setStatus(null);
    if (firstTurn && !discount) {
      setRemaining(PROMISE_SECONDS);
      setWaitStart(Date.now());
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Приветствие сгенерировано на клиенте и модели не принадлежит —
        // отправляем историю без него, иначе она увидит свою «реплику»,
        // которой не писала.
        body: JSON.stringify({ messages: next.slice(1), locale, qualified, discount }),
      });

      if (response.status === 503) {
        setStatus("disabled");
        setBusy(false);
        return;
      }
      if (!response.ok || !response.body) {
        setStatus("error");
        setBusy(false);
        return;
      }

      // Пустая реплика ассистента, в которую дописываются приходящие куски.
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        // Последний фрагмент может быть обрезан посередине — оставляем его
        // в буфере до следующей порции.
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          let event: {
            type: string;
            value?: string;
            delivered?: boolean;
            requestNo?: string;
          };
          try {
            event = JSON.parse(part.slice(6));
          } catch {
            continue;
          }

          if (event.type === "text" && event.value) {
            const chunk = event.value;
            // Ответ пошёл — гарантия выполнена. Останавливаем отсчёт именно
            // на первом куске текста, а не на закрытии потока: человек видит
            // ответ с первой буквы, и с этого момента он уже не ждёт.
            if (chunk.trim()) setWaitStart(null);
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + chunk };
              return copy;
            });
          } else if (event.type === "qualified") {
            setQualified(true);
            if (typeof event.requestNo === "string") setRequestNo(event.requestNo);
            // Доставка могла не удаться: в этом случае показываем прямой
            // канал, иначе человек уйдёт уверенным, что им уже занимаются.
            setStatus(event.delivered === false ? "undelivered" : "qualified");
          } else if (event.type === "closing_failed") {
            // Заявка уже у менеджера, не доиграла лишь прощальная фраза.
            setStatus((prev) => (prev === "undelivered" ? prev : "qualified"));
          } else if (event.type === "error" || event.type === "refusal") {
            // Успешную передачу заявки ошибка перебить не может: иначе
            // человек, чей лид уже лежит у менеджера, видит «всё сломалось»
            // и уходит, решив, что писать надо заново.
            setStatus((prev) =>
              prev === "qualified" || prev === "undelivered" ? prev : "error",
            );
          }
        }
      }
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
      setWaitStart(null);
      inputRef.current?.focus();
    }
  }

  const notice =
    status === "disabled"
      ? dict.chat.disabled
      : status === "error"
        ? dict.chat.error
        : status === "undelivered"
          ? dict.chat.undelivered
          : status === "qualified"
            ? dict.chat.handoff
            : null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-line bg-surface",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green to-blue font-display text-[0.95rem] font-extrabold text-ink">
          D
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.92rem] font-semibold">{dict.chat.title}</p>
          <p className="truncate text-[0.75rem] text-faint">{dict.chat.subtitle}</p>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[0.65rem] text-green">
          <span className="h-1.5 w-1.5 rounded-full bg-green" />
          {dict.chat.online}
        </span>
      </div>

      {/* Полоса гарантии.
          Пока ждём первый ответ, здесь тикает счётчик: обещание, которое не
          видно, не работает как обещание — человек должен видеть, что время
          идёт и что оно чем-то обеспечено. */}
      <div
        className={cn(
          // Переносим по строкам, а не сжимаем: виджет всегда узкий, около
          // 384 px, и медиазапросы тут не помогают — ширина не зависит от
          // экрана. Обещание и его цена должны читаться целиком.
          "flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b px-5 py-2.5 text-[0.7rem]",
          discount
            ? "border-gold/30 bg-gold/10 text-gold"
            : "border-line bg-green/[0.06] text-green",
        )}
        aria-live="polite"
      >
        {discount ? (
          <>
            <span aria-hidden="true">🎁</span>
            <span className="leading-snug">{dict.chat.discountWon}</span>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-[0.8rem]">⚡️</span>
            <span className="whitespace-nowrap font-medium">
              {waitStart !== null
                ? dict.chat.counting.replace("{n}", String(remaining))
                : dict.chat.promise}
            </span>
            <span className="ml-auto whitespace-nowrap text-faint">{dict.chat.promiseNote}</span>
          </>
        )}
      </div>

      <div
        ref={scrollRef}
        className={cn(
          "flex flex-col gap-3 overflow-y-auto px-5 py-5",
          compact ? "h-[22rem]" : "h-[26rem]",
        )}
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[0.9rem] leading-relaxed",
              message.role === "user"
                ? "self-end rounded-tr-sm border border-green/30 bg-green/12"
                : "self-start rounded-tl-sm border border-line bg-surface-2",
            )}
          >
            {message.content || (
              <span className="text-faint">{dict.chat.thinking}</span>
            )}
          </div>
        ))}

        {busy && messages[messages.length - 1]?.role === "user" ? (
          <div className="self-start rounded-2xl rounded-tl-sm border border-line bg-surface-2 px-4 py-3 text-[0.9rem] text-faint">
            {dict.chat.thinking}
          </div>
        ) : null}

        {notice ? (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-[0.83rem] leading-relaxed",
              status === "qualified"
                ? "border-green/30 bg-green/10 text-green"
                : "border-gold/30 bg-gold/10 text-gold",
            )}
          >
            {requestNo && status === "qualified" ? (
              // Номер заявки — то, за что человек держится после разговора:
              // он видит, что запрос стал объектом с именем, а не растворился
              // в чате. Менеджер найдёт его по тому же номеру.
              <p className="mb-1.5 font-mono text-[0.78rem] font-semibold tracking-wide">
                {dict.chat.requestLabel} {requestNo}
              </p>
            ) : null}
            <p>{notice}</p>
          </div>
        ) : null}

        {/* Переезд в Telegram. Показываем после первого обмена репликами:
            до него переносить нечего, а кнопка «уйти отсюда» рядом с пустым
            чатом читается как предложение закрыть вкладку.

            Именно ссылка, а не кнопка со скриптом: переход по <a> браузер не
            блокирует никогда, а окно, открытое из обработчика после запроса к
            серверу, блокирует почти всегда. Пока адрес не готов, ссылки нет —
            показывать неработающую хуже, чем не показывать вовсе. */}
        {tgUrl && messages.some((m) => m.role === "user") && !busy ? (
          <div className="rounded-xl border border-line bg-surface-2/60 px-4 py-3">
            <a
              href={tgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-soft/40 bg-blue/10 px-4 py-2.5 text-[0.83rem] font-medium text-blue-soft transition-colors hover:border-blue-soft hover:bg-blue/20"
            >
              <span aria-hidden="true">✈</span>
              {dict.chat.toTelegram}
            </a>
            <p className="mt-2 text-center text-[0.7rem] leading-snug text-faint">
              {dict.chat.toTelegramNote}
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-ink px-3 py-2 focus-within:border-green/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              autoGrow();
            }}
            onKeyDown={(event) => {
              // Enter отправляет, Shift+Enter переносит строку — как в любом
              // мессенджере, из которого сюда приходит человек.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            maxLength={2000}
            disabled={busy || status === "disabled"}
            placeholder={dict.chat.placeholder}
            aria-label={dict.chat.placeholder}
            className="flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-[0.9rem] text-text outline-none placeholder:text-faint disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !input.trim() || status === "disabled"}
            aria-label={dict.chat.send}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green text-ink transition-opacity disabled:opacity-30"
          >
            ↑
          </button>
        </div>
        <p className="mt-2.5 px-1 text-[0.68rem] leading-snug text-faint">
          {dict.chat.consent}
        </p>
      </div>
    </div>
  );
}
