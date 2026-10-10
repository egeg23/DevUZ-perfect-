"use client";

import { useRef, useState } from "react";

/**
 * Живое демо на странице сервиса — тот же путь, что у виджета на сайте
 * клиента (/api/ai-staff/widget), только встроенный в страницу: плавающая
 * кнопка в углу уже занята чатом студии.
 */
export function DemoChat(props: { widgetKey: string; labels: { ph: string; send: string; fail: string; hello: string } }) {
  const [lines, setLines] = useState<Array<{ mine: boolean; text: string }>>([{ mine: false, text: props.labels.hello }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const visitor = useRef<string>("");
  const list = useRef<HTMLDivElement>(null);

  const scroll = () => requestAnimationFrame(() => list.current?.scrollTo({ top: list.current.scrollHeight }));

  async function send() {
    const value = text.trim();
    if (!value || busy) return;
    if (!visitor.current) {
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      visitor.current = `d${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
    }
    setText("");
    setBusy(true);
    setLines((l) => [...l, { mine: true, text: value }]);
    scroll();
    try {
      const response = await fetch("/api/ai-staff/widget", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: props.widgetKey, visitor: visitor.current, text: value }),
      });
      const data = (await response.json()) as { reply?: string | null; error?: string };
      setLines((l) => [...l, { mine: false, text: data.reply ?? props.labels.fail }]);
    } catch {
      setLines((l) => [...l, { mine: false, text: props.labels.fail }]);
    } finally {
      setBusy(false);
      scroll();
    }
  }

  return (
    <div className="flex h-[440px] flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div ref={list} className="flex-1 space-y-2 overflow-y-auto p-4">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${line.mine ? "ml-auto bg-green-dim text-ink" : "border border-line bg-ink"}`}
          >
            {line.text}
          </div>
        ))}
        {busy ? <div className="text-sm text-muted">…</div> : null}
      </div>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={props.labels.ph}
          maxLength={500}
          className="flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-green-dim px-4 py-2 text-sm font-medium text-ink disabled:opacity-50" disabled={busy}>
          {props.labels.send}
        </button>
      </form>
    </div>
  );
}
