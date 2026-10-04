"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { usePanelDict, usePanelLocale } from "@/components/admin/panel-locale";
import { promoFailText, promoLocaleDict, promoUploadDict } from "@/content/admin-panel/partners";
import {
  PROMO_CHUNK_BYTES,
  PROMO_LOCALES,
  PROMO_MAX_BYTES,
  PROMO_MIME,
  promoKind,
} from "@/lib/partners/promo-rules";
import type { PromoFail, StartResult } from "@/lib/partners/promo";

/**
 * Загрузка промо-материала на наш сервер — кусками.
 *
 * Сервер заводит загрузку, браузер шлёт файл по 4 МБ (каждый кусок проходит
 * лимиты nginx и server action), сервер проверяет, что файл дошёл целиком и
 * внутри то, что в названии, и записывает материал. Кусок, на котором
 * оборвалась связь, досылается сам — до трёх раз. Полоса прогресса —
 * потому что ролик на 200 МБ с телефона грузится минуты, и без неё это
 * минуты на пустом экране с вопросом «оно вообще идёт?».
 */

type Meta = { width: number | null; height: number | null; duration: number | null };

type Phase =
  | { kind: "idle" }
  | { kind: "busy"; text: string; progress: number | null }
  | { kind: "done"; text: string }
  | { kind: "error"; text: string };

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";

const ACCEPT = Object.keys(PROMO_MIME).join(",");

/** Размер кадра и длительность — из самого файла, до загрузки. Не вышло — без них. */
export function readMeta(file: File): Promise<Meta> {
  const empty: Meta = { width: null, height: null, duration: null };
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const done = (meta: Meta) => {
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    const timer = window.setTimeout(() => done(empty), 8000);
    if (promoKind(file.type) === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        done({
          width: video.videoWidth || null,
          height: video.videoHeight || null,
          duration: Number.isFinite(video.duration) ? video.duration : null,
        });
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        done(empty);
      };
      video.src = url;
    } else {
      const image = new Image();
      image.onload = () => {
        window.clearTimeout(timer);
        done({ width: image.naturalWidth || null, height: image.naturalHeight || null, duration: null });
      };
      image.onerror = () => {
        window.clearTimeout(timer);
        done(empty);
      };
      image.src = url;
    }
  });
}

type ChunkResult = { ok: true; received: number } | PromoFail;

/** Файл кусками, по порядку; оборвавшийся кусок — ещё раз, с паузой. */
export async function sendChunks(
  file: File,
  uploadId: string,
  send: (formData: FormData) => Promise<ChunkResult>,
  onProgress: (share: number) => void,
): Promise<PromoFail | null> {
  let offset = 0;
  while (offset < file.size) {
    const piece = file.slice(offset, Math.min(offset + PROMO_CHUNK_BYTES, file.size));
    let result: ChunkResult | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const form = new FormData();
      form.set("upload", uploadId);
      form.set("offset", String(offset));
      form.set("chunk", piece);
      result = await send(form).catch(
        (error: Error): PromoFail => ({ ok: false, reason: "network", detail: error.message || undefined }),
      );
      if (result.ok) break;
      await new Promise((resolve) => window.setTimeout(resolve, 1500 * (attempt + 1)));
    }
    if (!result || !result.ok) return result ?? { ok: false, reason: "network" };
    offset = result.received;
    onProgress(offset / file.size);
  }
  return null;
}

export function PromoUpload({
  start,
  chunk,
  discard,
  register,
  captionHint,
}: {
  start: (input: { mime: string; bytes: number }) => Promise<StartResult>;
  chunk: (formData: FormData) => Promise<ChunkResult>;
  discard: (uploadId: string) => Promise<void>;
  register: (input: {
    uploadId: string;
    title: string;
    locale: string;
    caption: string;
    width: number | null;
    height: number | null;
    duration: number | null;
    notify: boolean;
  }) => Promise<{ ok: true } | PromoFail>;
  /** Подпись по умолчанию — чтобы было видно, что получит партнёр, если оставить поле пустым. */
  captionHint: string;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const locale = usePanelLocale();
  const t = usePanelDict(promoUploadDict);
  const busy = phase.kind === "busy";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) return setPhase({ kind: "error", text: t.chooseFile });
    if (!PROMO_MIME[file.type]) {
      return setPhase({ kind: "error", text: t.wrongType });
    }
    if (file.size > PROMO_MAX_BYTES) {
      return setPhase({ kind: "error", text: t.tooBig });
    }

    setPhase({ kind: "busy", text: t.reading, progress: null });
    const meta = await readMeta(file);

    setPhase({ kind: "busy", text: t.preparing, progress: null });
    const slot = await start({ mime: file.type, bytes: file.size });
    if (!slot.ok) return setPhase({ kind: "error", text: promoFailText(slot, locale) });

    setPhase({ kind: "busy", text: t.uploading, progress: 0 });
    const failed = await sendChunks(file, slot.uploadId, chunk, (share) =>
      setPhase({ kind: "busy", text: t.uploading, progress: share }),
    );
    if (failed) {
      await discard(slot.uploadId).catch(() => undefined);
      return setPhase({ kind: "error", text: t.notUploaded(promoFailText(failed, locale)) });
    }

    setPhase({ kind: "busy", text: t.writing, progress: 1 });
    const notify = data.get("notify") === "on";
    const saved = await register({
      uploadId: slot.uploadId,
      title: String(data.get("title") ?? ""),
      locale: String(data.get("locale") ?? "all"),
      caption: String(data.get("caption") ?? ""),
      ...meta,
      notify,
    });
    if (!saved.ok) return setPhase({ kind: "error", text: promoFailText(saved, locale) });

    form.current?.reset();
    setPhase({
      kind: "done",
      text: notify ? t.doneNotify : t.done,
    });
    router.refresh();
  }

  return (
    <form ref={form} onSubmit={submit} className="mt-2 grid gap-3 rounded-xl border border-line bg-surface px-5 py-4 sm:grid-cols-2">
      <label className="block text-xs text-faint sm:col-span-2">
        {t.fileLabel}
        <input name="file" type="file" accept={ACCEPT} required disabled={busy} className={`mt-1 ${INPUT}`} />
      </label>
      <label className="block text-xs text-faint">
        {t.titleLabel}
        <input name="title" required minLength={2} maxLength={120} disabled={busy} placeholder={t.titlePh} className={`mt-1 ${INPUT}`} />
      </label>
      <label className="block text-xs text-faint">
        {t.langLabel}
        <select name="locale" defaultValue="ru" disabled={busy} className={`mt-1 ${INPUT}`}>
          {PROMO_LOCALES.map((lang) => (
            <option key={lang} value={lang}>
              {promoLocaleDict[lang][locale]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-faint sm:col-span-2">
        {t.captionLabel}
        <textarea name="caption" rows={3} maxLength={1000} disabled={busy} placeholder={captionHint} className={`mt-1 ${INPUT}`} />
      </label>
      <label className="flex items-center gap-2 text-xs text-muted sm:col-span-2">
        <input name="notify" type="checkbox" defaultChecked disabled={busy} />
        {t.notify}
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            busy ? "cursor-progress border border-line bg-line/60 text-muted" : "bg-green/90 text-ink hover:bg-green"
          }`}
        >
          {busy ? t.busy : t.upload}
        </button>
        {phase.kind === "busy" ? (
          <span className="flex min-w-[12rem] flex-1 items-center gap-3 text-xs text-muted">
            {phase.text}
            {phase.progress !== null ? (
              <>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span className="block h-full bg-green transition-[width]" style={{ width: `${Math.round(phase.progress * 100)}%` }} />
                </span>
                <span className="font-mono">{Math.round(phase.progress * 100)}%</span>
              </>
            ) : null}
          </span>
        ) : null}
        {phase.kind === "done" ? <span className="text-xs text-green">{phase.text}</span> : null}
        {phase.kind === "error" ? <span className="text-xs text-gold">{phase.text}</span> : null}
      </div>
    </form>
  );
}
