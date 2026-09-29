import { sendMessageToThread } from "@/app/admin/leads/[id]/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { cardWhen, leadThreadDict } from "@/content/admin-panel/lead-card";
import { pick, tr } from "@/lib/admin/i18n";
import { ROLE_BADGE } from "@/lib/admin/roles";
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
  const locale = staff.panel_locale;
  const t = pick(leadThreadDict, locale);
  return (
    <section id="thread" className="mt-4 rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-faint">{t.title}</p>

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
                      {tr(ROLE_BADGE.admin, locale)}
                    </span>
                  ) : null}
                  <span className="text-faint">{cardWhen(message.created_at, locale)}</span>
                  {message.edited_at ? (
                    <span className="text-faint">{t.edited}</span>
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
        <p className="mt-3 text-sm text-muted">{t.empty}</p>
      )}

      <form action={sendMessageToThread} className="mt-4">
        <input type="hidden" name="lead" value={leadId} />
        <textarea
          name="body"
          rows={3}
          maxLength={MAX_BODY}
          required
          placeholder={t.placeholder}
          className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {/* Пока сообщение уходит, кнопка серая и не нажимается: без этого
              нетерпеливое нажатие записывало одно и то же десяток раз. */}
          <SubmitButton pendingLabel={t.sending} base="rounded-lg px-4 py-1.5 text-xs" tone="quiet">
            {t.send}
          </SubmitButton>
          <span className="text-xs text-faint">
            {t.visibility}
          </span>
        </div>
      </form>
    </section>
  );
}
