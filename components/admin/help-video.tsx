"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { helpVideoChunkAction, helpVideoDiscardAction, helpVideoRemoveAction, helpVideoSaveAction, helpVideoStartAction } from "@/app/admin/help/actions";
import { usePanelLocale } from "@/components/admin/panel-locale";
import { readMeta, sendChunks } from "@/components/admin/promo-upload";
import { HELP_LOCALE_NAME, type HelpLocale, type HelpVideoCopy } from "@/content/admin-help";
import { promoFailText } from "@/content/admin-panel/partners";
import { HELP_VIDEO_LOCALES, HELP_VIDEO_MIME } from "@/lib/admin/help-video-rules";
import { PROMO_MAX_BYTES } from "@/lib/partners/promo-rules";

/**
 * Загрузка видео к разделу инструкции — владельцу и руководителю.
 *
 * Свёрнуто под описанием раздела: команда читает инструкцию, а не форму.
 * Файл едет кусками, как промо-материалы (components/admin/promo-upload.tsx),
 * и докачивается сам, если связь мигнула. На раздел и язык — одно видео:
 * новое заменяет старое.
 */

type Phase =
  | { kind: "idle" }
  | { kind: "busy"; progress: number | null }
  | { kind: "done" }
  | { kind: "error"; text: string };

const INPUT = "w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";

export function HelpVideoManager({
  section,
  title,
  lang,
  copy,
  have,
}: {
  section: string;
  /** «Видео к разделу» или «Вводное видео». */
  title: string;
  lang: HelpLocale;
  copy: HelpVideoCopy;
  /** Уже загруженные видео этого раздела: язык и id. */
  have: readonly { id: string; locale: string }[];
}) {
  const router = useRouter();
  const panelLocale = usePanelLocale();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [videoLang, setVideoLang] = useState<string>(lang);
  const busy = phase.kind === "busy";
  const replacing = have.some((video) => video.locale === videoLang);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Форму — сразу: после первого await React уже обнулит currentTarget.
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || !file.size) return setPhase({ kind: "error", text: copy.chooseFile });
    if (!HELP_VIDEO_MIME.includes(file.type)) return setPhase({ kind: "error", text: copy.wrongType });
    if (file.size > PROMO_MAX_BYTES) return setPhase({ kind: "error", text: copy.tooBig });

    setPhase({ kind: "busy", progress: null });
    const meta = await readMeta(file);
    const slot = await helpVideoStartAction({ mime: file.type, bytes: file.size });
    if (!slot.ok) return setPhase({ kind: "error", text: promoFailText(slot, panelLocale) });

    setPhase({ kind: "busy", progress: 0 });
    const failed = await sendChunks(file, slot.uploadId, helpVideoChunkAction, (share) =>
      setPhase({ kind: "busy", progress: share }),
    );
    if (failed) {
      await helpVideoDiscardAction(slot.uploadId).catch(() => undefined);
      return setPhase({ kind: "error", text: promoFailText(failed, panelLocale) });
    }

    setPhase({ kind: "busy", progress: 1 });
    const saved = await helpVideoSaveAction({ uploadId: slot.uploadId, section, locale: videoLang, ...meta });
    if (!saved.ok) return setPhase({ kind: "error", text: promoFailText(saved, panelLocale) });
    form.reset();
    setPhase({ kind: "done" });
    router.refresh();
  }

  async function remove(id: string, locale: string) {
    if (!window.confirm(copy.removeConfirm.replace("{lang}", HELP_LOCALE_NAME[locale as HelpLocale] ?? locale))) return;
    const removed = await helpVideoRemoveAction(id).catch(() => false);
    if (removed) router.refresh();
    else setPhase({ kind: "error", text: copy.removeFailed });
  }

  return (
    <details className="mt-3 max-w-3xl rounded-lg border border-line-soft px-4 py-2 text-sm" data-help-video-manager>
      <summary className="cursor-pointer text-xs text-faint hover:text-text">{title}</summary>
      {have.length ? (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="text-faint">{copy.have}</li>
          {have.map((video) => (
            <li key={video.id} className="flex items-center gap-2">
              {HELP_LOCALE_NAME[video.locale as HelpLocale] ?? video.locale}
              <button type="button" onClick={() => remove(video.id, video.locale)} className="text-faint underline-offset-2 hover:text-gold hover:underline">
                {copy.remove}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={submit} className="mt-3 grid gap-3 pb-2 sm:grid-cols-[10rem_1fr]">
        <label className="block text-xs text-faint">
          {copy.language}
          <select name="locale" value={videoLang} onChange={(e) => setVideoLang(e.target.value)} disabled={busy} className={`mt-1 ${INPUT}`}>
            {HELP_VIDEO_LOCALES.map((code) => (
              <option key={code} value={code}>
                {HELP_LOCALE_NAME[code]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-faint">
          {copy.file}
          <input name="file" type="file" accept={HELP_VIDEO_MIME.join(",")} required disabled={busy} className={`mt-1 ${INPUT}`} />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border border-green/40 px-4 py-2 text-sm text-green transition hover:bg-green/10 disabled:cursor-progress disabled:opacity-50"
          >
            {busy ? copy.busy : copy.upload}
          </button>
          {replacing && !busy ? <span className="text-xs text-faint">{copy.replaceNote}</span> : null}
          {phase.kind === "busy" && phase.progress !== null ? (
            <span className="flex min-w-[10rem] flex-1 items-center gap-3 text-xs text-muted">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full bg-green transition-[width]" style={{ width: `${Math.round(phase.progress * 100)}%` }} />
              </span>
              <span className="font-mono">{Math.round(phase.progress * 100)}%</span>
            </span>
          ) : null}
          {phase.kind === "done" ? <span className="text-xs text-green">{copy.done}</span> : null}
          {phase.kind === "error" ? <span className="text-xs text-gold">{phase.text}</span> : null}
        </div>
      </form>
    </details>
  );
}
