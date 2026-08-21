"use client";

import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";

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
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: dict.chat.greeting },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<null | "error" | "disabled" | "qualified">(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Приветствие сгенерировано на клиенте и модели не принадлежит —
        // отправляем историю без него, иначе она увидит свою «реплику»,
        // которой не писала.
        body: JSON.stringify({ messages: next.slice(1), locale }),
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
          let event: { type: string; value?: string };
          try {
            event = JSON.parse(part.slice(6));
          } catch {
            continue;
          }

          if (event.type === "text" && event.value) {
            const chunk = event.value;
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              copy[copy.length - 1] = { ...last, content: last.content + chunk };
              return copy;
            });
          } else if (event.type === "qualified") {
            setStatus("qualified");
          } else if (event.type === "error" || event.type === "refusal") {
            setStatus("error");
          }
        }
      }
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const notice =
    status === "disabled"
      ? dict.chat.disabled
      : status === "error"
        ? dict.chat.error
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
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.65rem] text-green">
          <span className="h-1.5 w-1.5 rounded-full bg-green" />
          {dict.chat.online}
        </span>
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
          <p
            className={cn(
              "rounded-xl border px-4 py-3 text-[0.83rem] leading-relaxed",
              status === "qualified"
                ? "border-green/30 bg-green/10 text-green"
                : "border-gold/30 bg-gold/10 text-gold",
            )}
          >
            {notice}
          </p>
        ) : null}
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-ink px-3 py-2 focus-within:border-green/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
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
            className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-[0.9rem] text-text outline-none placeholder:text-faint disabled:opacity-50"
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
