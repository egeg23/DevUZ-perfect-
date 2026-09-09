import { sendMessageToThread } from "@/app/admin/leads/[id]/actions";
import { when } from "@/components/admin/lead-table";
import { MAX_BODY, type LeadMessage } from "@/lib/admin/messages";
import type { Staff } from "@/lib/admin/session";

/**
 * Обсуждение лида.
 *
 * Видно всем сотрудникам, и об этом сказано прямо под полем ввода. Это не
 * предупреждение ради приличия: половина смысла ветки в том, что
 * договорённость о клиенте перестаёт быть тихой, — и человек должен знать
 * об этом до того, как напишет, а не после.
 */
export function LeadThread({
  leadId,
  messages,
  staff,
}: {
  leadId: string;
  messages: LeadMessage[];
  staff: Staff;
}) {
  return (
    <section id="thread" className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-faint">Обсуждение</p>

      {messages.length ? (
        <ul className="mt-3 space-y-3">
          {messages.map((message) => {
            const own = message.author_staff_id === staff.id;
            return (
              <li
                key={message.id}
                className={`rounded-lg border px-4 py-3 ${
                  own ? "border-green/20 bg-green/5" : "border-line-soft bg-surface-2"
                }`}
              >
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className={own ? "text-green" : "text-text"}>{message.author_name}</span>
                  {message.author_role === "admin" ? (
                    <span className="rounded bg-line px-1.5 py-0.5 text-[11px] text-faint">
                      админ
                    </span>
                  ) : null}
                  <span className="text-faint">{when(message.created_at)}</span>
                  {message.edited_at ? (
                    <span className="text-faint">· изменено</span>
                  ) : null}
                </p>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                  {message.body}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Пока пусто.</p>
      )}

      <form action={sendMessageToThread} className="mt-4">
        <input type="hidden" name="lead" value={leadId} />
        <textarea
          name="body"
          rows={3}
          maxLength={MAX_BODY}
          required
          placeholder="Что известно по этому клиенту"
          className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg border border-line bg-surface-2 px-4 py-1.5 text-xs transition hover:border-green/40 hover:text-green"
          >
            Отправить
          </button>
          <span className="text-xs text-faint">
            Видно всей команде. Владельцу лида придёт в Telegram.
          </span>
        </div>
      </form>
    </section>
  );
}
