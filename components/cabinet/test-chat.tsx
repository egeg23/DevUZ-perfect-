"use client";

import { useState, useTransition } from "react";

import { testReset, testSend } from "@/app/cabinet/actions";

type Line = { mine: boolean; text: string };

/**
 * «Проверить на себе»: владелец пишет как покупатель, ответ идёт тем же
 * путём, что у настоящих покупателей (lib/ai-staff/service.ts, вид
 * разговора «test»). Ключ разговора живёт в этой вкладке: «Начать заново»
 * стирает разговор на сервере и берёт новый ключ.
 */
export function TestChat(props: { initialKey: string; labels: { ph: string; send: string; reset: string; thinking: string; failed: string } }) {
  const [key, setKey] = useState(props.initialKey);
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  const send = () => {
    const value = text.trim();
    if (!value || pending) return;
    setText("");
    setLines((l) => [...l, { mine: true, text: value }]);
    start(async () => {
      try {
        const out = await testSend(value, key);
        setLines((l) => [...l, { mine: false, text: out.reply ?? "…" }]);
      } catch {
        setLines((l) => [...l, { mine: false, text: props.labels.failed }]);
      }
    });
  };

  return (
    <div className="flex h-[520px] flex-col rounded-xl border border-line bg-surface">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${line.mine ? "ml-auto bg-green-dim text-ink" : "border border-line bg-ink"}`}
          >
            {line.text}
          </div>
        ))}
        {pending ? <div className="text-sm text-muted">{props.labels.thinking}</div> : null}
      </div>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={props.labels.ph}
          maxLength={2000}
          className="flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-green-dim px-4 py-2 text-sm font-medium text-ink" disabled={pending}>
          {props.labels.send}
        </button>
        <button
          type="button"
          className="rounded-md border border-line px-3 py-2 text-sm text-muted"
          onClick={() =>
            start(async () => {
              setKey(await testReset(key));
              setLines([]);
            })
          }
        >
          {props.labels.reset}
        </button>
      </form>
    </div>
  );
}
