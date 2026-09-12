"use client";

import { useState } from "react";

import { auditChunkAction } from "@/app/admin/prospect/actions";
import {
  BATCH_CAP,
  CHUNK,
  parseTargets,
  type BatchTarget,
  type ProspectRow,
} from "@/lib/audit/batch";

/**
 * Прогон списка сайтов.
 *
 * Разбор списка делается здесь, в браузере, а не на сервере: человек должен
 * увидеть, что именно распозналось, ДО того как мы пойдём стучаться к
 * полусотне чужих сайтов. Строка, в которой адрес не нашёлся, — это чаще
 * всего опечатка, и узнавать о ней через две минуты ожидания незачем.
 *
 * Сервер при этом разбору браузера не верит: каждый адрес всё равно
 * проходит через нормализацию и защиту от обращений во внутреннюю сеть уже
 * на той стороне.
 */
const FIELD =
  "w-full rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-xs leading-relaxed text-text placeholder:text-faint focus:border-green/50 focus:outline-none";

const SEVERITY: Record<string, string> = {
  critical: "border-gold/40 bg-gold/10 text-gold",
  major: "border-blue-soft/40 bg-blue-soft/10 text-blue-soft",
  minor: "border-line bg-surface-2 text-faint",
};

export function ProspectRunner() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ProspectRow[]>([]);
  const [queue, setQueue] = useState<BatchTarget[]>([]);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const parsed = text.trim() ? parseTargets(text) : [];
  const good = parsed.filter((t) => t.url);
  const bad = parsed.filter((t) => !t.url);

  async function run() {
    const targets = parseTargets(text).filter((t) => t.url);
    if (!targets.length) return;

    setRunning(true);
    setRows([]);
    setDone(0);
    setQueue(targets);

    const collected: ProspectRow[] = [];
    for (let i = 0; i < targets.length; i += CHUNK) {
      const chunk = targets.slice(i, i + CHUNK);
      try {
        const part = await auditChunkAction(chunk);
        collected.push(...part);
      } catch {
        // Сорвавшаяся пачка не должна ронять весь прогон: остальные сайты
        // проверяются дальше, а по этим человек увидит, что ответа нет.
        collected.push(
          ...chunk.map((t) => ({
            raw: t.raw,
            url: t.url,
            label: t.label,
            score: null,
            findings: [],
            draft: null,
            note: "проверка сорвалась — попробуйте эти адреса ещё раз",
          })),
        );
      }
      setRows([...collected]);
      setDone(Math.min(i + CHUNK, targets.length));
    }

    setRunning(false);
  }

  function copy(row: ProspectRow) {
    if (!row.draft) return;
    navigator.clipboard?.writeText(row.draft).then(
      () => setCopied(row.raw),
      () => setCopied(null),
    );
  }

  function exportCsv() {
    // Точка с запятой, а не запятая: Excel в русской локали разбирает по ней,
    // а с запятой кладёт всю строку в первую ячейку.
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const head = ["Строка", "Адрес", "Компания", "Балл", "Находки", "Черновик", "Примечание"];
    const body = rows.map((r) =>
      [
        r.raw,
        r.url ?? "",
        r.label ?? "",
        r.score === null ? "" : String(r.score),
        r.findings.map((f) => f.title).join(" · "),
        r.draft ?? "",
        r.note ?? "",
      ]
        .map(esc)
        .join(";"),
    );

    // BOM: без него Excel открывает кириллицу как мусор.
    const blob = new Blob(["﻿" + [head.map(esc).join(";"), ...body].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospect.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const worth = rows.filter((r) => r.draft).length;

  return (
    <div className="mt-6">
      <label className="block">
        <span className="text-xs uppercase tracking-wider text-faint">
          Список сайтов — по одному в строке. Можно с названием компании рядом.
        </span>
        <textarea
          id="prospect-list"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={"mebel-tashkent.uz\nООО «Ромашка» — romashka.uz\nhttps://example.uz/, Пример"}
          className={`${FIELD} mt-1`}
        />
      </label>

      {parsed.length ? (
        <p className="mt-2 text-xs text-faint">
          Распознано адресов: <span className="text-text">{good.length}</span>
          {bad.length ? <span className="text-gold"> · не разобрано строк: {bad.length}</span> : null}
          {parsed.length >= BATCH_CAP ? (
            <span className="text-gold"> · взял первые {BATCH_CAP}</span>
          ) : null}
        </p>
      ) : null}

      {bad.length ? (
        <ul className="mt-2 space-y-0.5 text-xs text-gold">
          {bad.slice(0, 5).map((t) => (
            <li key={t.raw} className="font-mono">
              {t.raw} — {t.problem}
            </li>
          ))}
          {bad.length > 5 ? <li>…и ещё {bad.length - 5}</li> : null}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={running || !good.length}
          className="rounded-lg border border-green/40 bg-green/10 px-4 py-2 text-sm text-green transition hover:bg-green/20 disabled:opacity-40"
        >
          {running ? `Проверяю… ${done} из ${queue.length}` : `Проверить ${good.length}`}
        </button>

        {rows.length ? (
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm text-muted transition hover:text-text"
          >
            Выгрузить CSV
          </button>
        ) : null}

        {rows.length && !running ? (
          <span className="text-xs text-faint">
            есть о чём написать: <span className="text-green">{worth}</span> из {rows.length}
          </span>
        ) : null}
      </div>

      {rows.length ? (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.raw} className="rounded-xl border border-line bg-surface px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {row.label ? <span className="font-medium">{row.label}</span> : null}
                <a
                  href={row.url ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-xs text-blue-soft hover:underline"
                >
                  {row.url ?? row.raw}
                </a>
                {row.score !== null ? (
                  <span
                    className={`ml-auto font-mono text-sm ${
                      row.score < 60 ? "text-gold" : "text-muted"
                    }`}
                  >
                    {row.score}
                  </span>
                ) : null}
              </div>

              {row.findings.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.findings.map((f) => (
                    <span
                      key={f.code}
                      title={f.impact}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        SEVERITY[f.severity] ?? SEVERITY.minor
                      }`}
                    >
                      {f.title}
                    </span>
                  ))}
                </div>
              ) : null}

              {row.draft ? (
                <div className="mt-3">
                  <p className="whitespace-pre-line rounded-lg border border-line-soft bg-surface-2 px-4 py-3 text-sm leading-relaxed">
                    {row.draft}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(row)}
                    className="mt-2 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                  >
                    {copied === row.raw ? "Скопировано" : "Скопировать черновик"}
                  </button>
                </div>
              ) : null}

              {row.note ? <p className="mt-2 text-xs text-faint">{row.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
