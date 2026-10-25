"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { replyBotAction } from "@/app/admin/inbox/actions";
import { sendFromCardAction } from "@/app/admin/leads/[id]/actions";
import { usePanelDict } from "@/components/admin/panel-locale";
import { inboxDict } from "@/content/admin-panel/inbox";
import { leadCardDict, leadResultDict } from "@/content/admin-panel/lead-card";

/**
 * Ответ из «Входящих» в строке, без перехода в карточку: касанию — тем же
 * sendFromCardAction, что поле под лентой карточки (свой разговор на
 * рабочем аккаунте), клиенту бота — replyBotAction. После ответа строка
 * пропадает при обновлении: входящее отвечено.
 */
export function InboxReply(
  props: { kind: "touch"; leadId: string; prospectId: string; limit: number } | { kind: "bot"; chatId: number; limit: number },
) {
  const t = usePanelDict(inboxDict);
  const card = usePanelDict(leadCardDict);
  const results = usePanelDict(leadResultDict);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const reason = (code: string): string => {
    if (code.startsWith("bot_") && Object.hasOwn(results, code)) return results[code as keyof typeof results] as string;
    const key = `re_${code}` as keyof typeof card;
    return Object.hasOwn(card, key) && typeof card[key] === "string" ? (card[key] as string) : t.failed;
  };

  const send = () => {
    const body = text.trim();
    if (!body || pending) return;
    start(async () => {
      const result =
        props.kind === "touch"
          ? await sendFromCardAction(props.leadId, "touch", body, props.prospectId)
          : await replyBotAction(props.chatId, body);
      if (!result.ok) {
        setNote({ ok: false, text: reason(result.reason) });
        return;
      }
      setText("");
      setNote({ ok: true, text: t.sent });
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-text transition hover:border-green/50 hover:text-green active:scale-[0.98]">
        {t.reply}
      </button>
    );
  }
  return (
    <div className="mt-2 w-full">
      <textarea
        value={text}
        autoFocus
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            send();
          }
        }}
        rows={3}
        maxLength={props.limit}
        placeholder={t.placeholder}
        className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-faint focus:border-green/60 focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={pending || !text.trim()}
          className="rounded-lg bg-green px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-green-dim disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t.sending : t.send}
        </button>
        <span className="text-xs text-faint">{props.kind === "touch" ? t.hintTouch : t.hintBot}</span>
        {note ? (
          <span role={note.ok ? "status" : "alert"} className={`text-xs ${note.ok ? "text-green" : "text-red-300"}`}>
            {note.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}
