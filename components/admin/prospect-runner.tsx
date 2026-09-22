"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { auditChunkAction, saveNoSiteAction, saveRunAction } from "@/app/admin/prospect/actions";
import { EMPTY_CONTACTS, hasAnyContact } from "@/lib/audit/contacts";
import type { PitchLocale } from "@/lib/audit/pitch";
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
  const router = useRouter();
  const [saveFailed, setSaveFailed] = useState(false);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  // Язык письма выбирается до прогона: заход строится один раз, на сервере,
  // вместе с подписью того, кто его отправит.
  const [locale, setLocale] = useState<PitchLocale>("ru");

  /**
   * Компания без сайта — половина малого бизнеса в Ташкенте.
   *
   * Разбирать у неё нечего, и прогон здесь не нужен вовсе: строки ложатся в
   * базу сразу, а письмо по каждой пишется потом — от ниши. Ниша одна на весь
   * список: менеджер добавляет их пачкой, найдя десяток салонов в инстаграме,
   * и десять раз вписывать «барбершоп» он не станет.
   */
  const [noSite, setNoSite] = useState(false);
  const [niche, setNiche] = useState("");
  const [added, setAdded] = useState<{ added: number; skipped: number } | null>(null);

  // Строки как есть: в этом режиме в них названия компаний, а не адреса, и
  // разбирать их на домен и подпись нечем и незачем.
  const names = noSite
    ? [...new Set(text.split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean))].slice(0, BATCH_CAP)
    : [];

  async function addNoSite() {
    if (!names.length || !niche.trim()) return;
    setRunning(true);
    setAdded(null);
    try {
      setAdded(await saveNoSiteAction(names, niche.trim()));
      setText("");
      router.refresh();
    } catch {
      setSaveFailed(true);
    } finally {
      setRunning(false);
    }
  }

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
        const part = await auditChunkAction(chunk, locale);
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
            contacts: EMPTY_CONTACTS,
          })),
        );
      }
      setRows([...collected]);
      setDone(Math.min(i + CHUNK, targets.length));
    }

    // Сохраняем сразу: до этого прогон жил в состоянии вкладки, и
    // обновление страницы стирало полсотни проверенных сайтов.
    try {
      await saveRunAction(collected);
      router.refresh();
    } catch {
      setSaveFailed(true);
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
    const head = ["Строка", "Адрес", "Компания", "Балл", "Телефоны", "Telegram", "Почта", "Instagram", "Находки", "Черновик", "Примечание"];
    const body = rows.map((r) =>
      [
        r.raw,
        r.url ?? "",
        r.label ?? "",
        r.score === null ? "" : String(r.score),
        [...r.contacts.phones, ...r.contacts.whatsapp.filter((w) => !r.contacts.phones.includes(w))].join(" "),
        r.contacts.telegram.join(" "),
        r.contacts.emails.join(" "),
        r.contacts.instagram.join(" "),
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
      {/* Галочка стоит над полем, а не под кнопкой: она меняет смысл того,
          что в поле вводят, и узнать об этом после ввода поздно. */}
      <label className="mb-3 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={noSite}
          onChange={(event) => {
            setNoSite(event.target.checked);
            setRows([]);
            setAdded(null);
          }}
          className="h-4 w-4 accent-green"
        />
        У компании нет сайта
      </label>

      {noSite ? (
        <label className="mb-3 block">
          <span className="text-xs uppercase tracking-wider text-faint">
            Ниша — от неё будет написано письмо
          </span>
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="барбершоп, доставка еды, стоматология"
            className={`${FIELD} mt-1 font-sans text-sm`}
          />
          <span className="mt-1 block text-xs text-faint">
            Одна на весь список. Разбирать нечего — письмо строится на том, что
            человек ищет «{niche.trim() || "ниша"} Ташкент» и находит конкурентов.
          </span>
        </label>
      ) : null}

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-faint">
          {noSite
            ? "Названия компаний — по одному в строке."
            : "Список сайтов — по одному в строке. Можно с названием компании рядом."}
        </span>
        <textarea
          id="prospect-list"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          spellCheck={false}
          placeholder={
            noSite
              ? "Barber House\nСалон «Ромашка»\nStudio 5"
              : "mebel-tashkent.uz\nООО «Ромашка» — romashka.uz\nhttps://example.uz/, Пример"
          }
          className={`${FIELD} mt-1`}
        />
      </label>

      {noSite && names.length ? (
        <p className="mt-2 text-xs text-faint">
          Компаний в списке: <span className="text-text">{names.length}</span>
        </p>
      ) : null}

      {added ? (
        <p className="mt-2 text-xs text-green">
          Добавлено: {added.added}
          {added.skipped ? (
            <span className="text-faint"> · пропущено как уже заведённые: {added.skipped}</span>
          ) : null}
        </p>
      ) : null}

      {!noSite && parsed.length ? (
        <p className="mt-2 text-xs text-faint">
          Распознано адресов: <span className="text-text">{good.length}</span>
          {bad.length ? <span className="text-gold"> · не разобрано строк: {bad.length}</span> : null}
          {parsed.length >= BATCH_CAP ? (
            <span className="text-gold"> · взял первые {BATCH_CAP}</span>
          ) : null}
        </p>
      ) : null}

      {!noSite && bad.length ? (
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
        {noSite ? (
          <button
            type="button"
            onClick={addNoSite}
            disabled={running || !names.length || !niche.trim()}
            className="rounded-lg border border-green/40 bg-green/10 px-4 py-2 text-sm text-green transition hover:bg-green/20 disabled:opacity-40"
          >
            {running ? "Добавляю…" : `Добавить ${names.length}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            disabled={running || !good.length}
            className="rounded-lg border border-green/40 bg-green/10 px-4 py-2 text-sm text-green transition hover:bg-green/20 disabled:opacity-40"
          >
            {running ? `Проверяю… ${done} из ${queue.length}` : `Проверить ${good.length}`}
          </button>
        )}

        {/* Выбора языка у компании без сайта нет: письмо там пишется от
            ниши, которую менеджер вписал по-русски, и английский вариант
            означал бы перевод ниши, а не письма. */}
        {noSite ? null : (
          <label className="flex items-center gap-2 text-xs text-faint">
            Язык письма
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value === "en" ? "en" : "ru")}
              disabled={running}
              className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs text-text"
            >
              <option value="ru">русский</option>
              <option value="en">английский</option>
            </select>
          </label>
        )}

        {rows.length ? (
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm text-muted transition hover:text-text"
          >
            Выгрузить CSV
          </button>
        ) : null}

        {saveFailed ? (
          <span className="text-xs text-gold">
            Результаты не сохранились — выгрузите их в файл, иначе они пропадут при обновлении.
          </span>
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
                      title={`${f.impact}\n\nЧто делаем: ${f.fix}`}
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        SEVERITY[f.severity] ?? SEVERITY.minor
                      }`}
                    >
                      {f.title}
                    </span>
                  ))}
                </div>
              ) : null}

              {hasAnyContact(row.contacts) ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-xs uppercase tracking-wider text-faint">Куда написать</span>
                  {row.contacts.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone}`} className="font-mono text-blue-soft hover:underline">
                      {phone}
                    </a>
                  ))}
                  {row.contacts.telegram.map((handle) => (
                    <a
                      key={handle}
                      href={`https://t.me/${handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-blue-soft hover:underline"
                    >
                      {handle}
                    </a>
                  ))}
                  {row.contacts.whatsapp
                    .filter((w) => !row.contacts.phones.includes(w))
                    .map((phone) => (
                      <a
                        key={`wa-${phone}`}
                        href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-mono text-blue-soft hover:underline"
                      >
                        {phone} <span className="text-faint">WhatsApp</span>
                      </a>
                    ))}
                  {row.contacts.emails.map((mail) => (
                    <a key={mail} href={`mailto:${mail}`} className="text-blue-soft hover:underline">
                      {mail}
                    </a>
                  ))}
                  {row.contacts.instagram.map((handle) => (
                    <a
                      key={handle}
                      href={`https://instagram.com/${handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-muted hover:underline"
                    >
                      {handle}
                    </a>
                  ))}
                  {row.contacts.contactsUrl ? (
                    <a
                      href={row.contacts.contactsUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs text-faint hover:text-muted"
                    >
                      страница контактов
                    </a>
                  ) : null}
                </div>
              ) : row.url ? (
                <p className="mt-2 text-xs text-faint">
                  Контактов на сайте не нашлось — ни телефона, ни почты, ни мессенджера. Для владельца
                  это отдельная беда, а для нас — повод написать через форму на сайте.
                </p>
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
