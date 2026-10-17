"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { circleChunkAction, circleDiscardAction, circleSaveAction, circleStartAction } from "@/app/admin/accounts/actions";
import { usePanelDict, usePanelLocale } from "@/components/admin/panel-locale";
import { readMeta, sendChunks } from "@/components/admin/promo-upload";
import { circleNicheDict, circleNicheNames, circleUploadDict } from "@/content/admin-panel/accounts";
import { promoFailText } from "@/content/admin-panel/partners";
import { CIRCLE_MIME, circleProblem } from "@/lib/admin/circle-rules";
import { CIRCLE_NICHES } from "@/lib/admin/sales-after-reply";

/**
 * «Кружок для касаний» в «Аккаунтах» — владельцу и руководителю.
 *
 * Файл проверяется ещё в браузере (MP4, квадрат, до минуты): медленная
 * загрузка, после которой сервер скажет «не квадрат», — потерянные минуты.
 * Дальше — кусками, как видео к инструкциям, и докачивается сам, если связь
 * мигнула. Скаут кладёт загруженный кружок в «Избранное» каждого аккаунта.
 * Форм две — для русского и для узбекского кружка (`lang`). Третья — кружок
 * ниши (`chooser`): язык и ниша выбираются в самой форме.
 */

type Phase =
  | { kind: "idle" }
  | { kind: "busy"; progress: number | null }
  | { kind: "done" }
  | { kind: "error"; text: string };

const INPUT = "w-full min-w-0 rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";

export function CircleUpload({ have, lang, chooser = false }: { have: boolean; lang: "ru" | "uz"; chooser?: boolean }) {
  const router = useRouter();
  const locale = usePanelLocale();
  const t = usePanelDict(circleUploadDict);
  const n = usePanelDict(circleNicheDict);
  const names = usePanelDict(circleNicheNames);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const busy = phase.kind === "busy";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Форму — сразу: после первого await React уже обнулит currentTarget.
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    const pickedLang = chooser && data.get("lang") === "uz" ? "uz" : chooser ? "ru" : lang;
    const niche = chooser ? String(data.get("niche") ?? "general") : "general";
    if (!(file instanceof File) || !file.size) return setPhase({ kind: "error", text: t.chooseFile });

    setPhase({ kind: "busy", progress: null });
    const meta = await readMeta(file);
    const problem = circleProblem({ mime: file.type, bytes: file.size, ...meta });
    if (problem) return setPhase({ kind: "error", text: t[`bad_${problem}`] });

    const slot = await circleStartAction({ mime: file.type, bytes: file.size });
    if (!slot.ok) return setPhase({ kind: "error", text: promoFailText(slot, locale) });

    setPhase({ kind: "busy", progress: 0 });
    const failed = await sendChunks(file, slot.uploadId, circleChunkAction, (share) => setPhase({ kind: "busy", progress: share }));
    if (failed) {
      await circleDiscardAction(slot.uploadId).catch(() => undefined);
      return setPhase({ kind: "error", text: promoFailText(failed, locale) });
    }

    setPhase({ kind: "busy", progress: 1 });
    const saved = await circleSaveAction({ uploadId: slot.uploadId, ...meta, lang: pickedLang, niche });
    if (!saved.ok) return setPhase({ kind: "error", text: promoFailText(saved, locale) });
    form.reset();
    setPhase({ kind: "done" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2" data-circle-upload={chooser ? "niche" : lang}>
      {chooser ? (
        <div className="flex flex-wrap gap-3">
          <label className="block min-w-[9rem] flex-1 text-xs text-faint">
            {n.pickNiche}
            <select name="niche" disabled={busy} className={`mt-1 ${INPUT}`} defaultValue={CIRCLE_NICHES[1]}>
              {CIRCLE_NICHES.filter((x) => x !== "general").map((x) => (
                <option key={x} value={x}>
                  {names[x]}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-[9rem] flex-1 text-xs text-faint">
            {n.pickLang}
            <select name="lang" disabled={busy} className={`mt-1 ${INPUT}`} defaultValue="ru">
              <option value="ru">{n.langRu}</option>
              <option value="uz">{n.langUz}</option>
            </select>
          </label>
        </div>
      ) : null}
      <label className="block text-xs text-faint">
        {t.file}
        <input name="file" type="file" accept={CIRCLE_MIME.join(",")} required disabled={busy} className={`mt-1 ${INPUT}`} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-green/40 px-4 py-2 text-sm text-green transition hover:bg-green/10 disabled:cursor-progress disabled:opacity-50"
        >
          {busy ? t.busy : chooser ? n.upload : t.upload}
        </button>
        {have && !busy ? <span className="text-xs text-faint">{t.replaceNote}</span> : null}
        {phase.kind === "busy" && phase.progress !== null ? (
          <span className="flex min-w-[10rem] flex-1 items-center gap-3 text-xs text-muted">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <span className="block h-full bg-green transition-[width]" style={{ width: `${Math.round(phase.progress * 100)}%` }} />
            </span>
            <span className="font-mono">{Math.round(phase.progress * 100)}%</span>
          </span>
        ) : null}
      </div>
      {phase.kind === "done" ? <p className="text-xs text-green">{t.done}</p> : null}
      {phase.kind === "error" ? <p className="text-xs text-gold">{phase.text}</p> : null}
    </form>
  );
}
