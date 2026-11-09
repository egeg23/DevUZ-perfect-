import { postizKeyOutsideAction, publishOutsideAction, publisherOutsideAction, skipOutsideAction } from "@/app/admin/outside/actions";
import { CopyRich } from "@/components/admin/copy-rich";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { outsideDict, platformDict } from "@/content/admin-panel/outside";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import type { AutoState } from "@/lib/outside/auto-store";
import { PLATFORM, toHtml, toPlain, type LinkState } from "@/lib/outside/posts";
import type { OutsidePost } from "@/lib/outside/store";

/** «07.11 15:40» по Ташкенту. */
function when(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const RESULTS = ["ok", "bad", "missing", "failed", "forbidden", "keyok", "keybad"] as const;
type Result = (typeof RESULTS)[number];

const STATE_TONE: Record<LinkState | "unchecked", string> = {
  follow: "text-green",
  nofollow: "text-blue-soft",
  missing: "text-gold",
  unreachable: "text-gold",
  unchecked: "text-faint",
};

/**
 * Раздел «Статьи на площадках» (lib/outside/). Черновики — с «Скопировать»,
 * полем для ссылки и «Пропустить»; опубликованные — со ссылкой и тем, что
 * нашла проверка; «Публикуется само» (Telegraph, ключ Postiz) и «Кто
 * публикует» — руководителю и владельцу.
 */
export function OutsideView({
  locale,
  posts,
  people,
  publisher,
  canChoose,
  auto,
  result,
  now,
}: {
  locale: PanelLocale;
  /** null — таблицы нет: миграцию ещё не применили. */
  posts: OutsidePost[] | null;
  /** Кому открыт раздел — для «Кто публикует» и подписи «кто опубликовал». */
  people: { id: string; name: string; opens: boolean }[];
  publisher: string | null;
  canChoose: boolean;
  /** Ключи и проверка Postiz — только тем, кто выбирает «Кто публикует». */
  auto: AutoState | null;
  result: string | undefined;
  now: number;
}) {
  const t = pick(outsideDict, locale);
  const pf = pick(platformDict, locale);
  const shown = RESULTS.includes(result as Result) ? (result as Result) : null;
  const name = (id: string | null) => people.find((p) => p.id === id)?.name ?? "—";

  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <HelpHint topic={helpAnchor("/admin/outside", "how")} />
    </div>
  );

  if (!posts) {
    return (
      <div className="space-y-4">
        {header}
        <p className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">{t.off}</p>
      </div>
    );
  }

  const ready = posts.filter((p) => p.status === "ready");
  const published = posts.filter((p) => p.status === "published");
  const sent = posts.filter((p) => p.status === "sent");
  const skipped = posts.filter((p) => p.status === "skipped").length;
  const month = published.filter((p) => p.published_at && now - Date.parse(p.published_at) < 30 * 86_400_000).length;
  const stateText: Record<LinkState | "unchecked", string> = {
    follow: t.linkFollow,
    nofollow: t.linkNofollow,
    missing: t.linkMissing,
    unreachable: t.linkUnreachable,
    unchecked: t.linkUnchecked,
  };

  return (
    <div className="space-y-6">
      {header}
      <p className="max-w-3xl text-sm text-muted">{t.lead}</p>

      {shown ? (
        <p
          data-result={shown === "ok" || shown === "keyok" ? "ok" : "warn"}
          className={`rounded-lg border px-3 py-2 text-sm ${shown === "ok" || shown === "keyok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"}`}
        >
          {t[`r_${shown}`]}
        </p>
      ) : null}

      <p className="text-xs text-faint">
        {t.count30(month)} · {t.skippedCount(skipped)}
      </p>

      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold">{t.readyTitle}</h2>
          <HelpHint topic={helpAnchor("/admin/outside", "publish")} />
        </div>
        {ready.length === 0 ? <p className="text-sm text-muted">{t.readyEmpty}</p> : null}
        {ready.map((post) => {
          const spec = PLATFORM[post.platform];
          const plain = toPlain(post.body, post.platform, post.topic_key);
          // Посты (Tenchat, ВКонтакте, Telegram) — простым текстом, HTML им ни к чему.
          const html = spec.headings[1] === 0 ? undefined : toHtml(post.body, post.platform, post.topic_key);
          return (
            <article key={post.id} className="space-y-3 rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                <span className="rounded-md border border-line px-2 py-0.5 font-semibold text-text">{pf[post.platform]}</span>
                <span>{t.query(post.query)}</span>
                <span>· {t.made(when(post.created_at))}</span>
              </div>
              <h3 className="text-base font-semibold leading-snug">{post.title}</h3>
              {post.publish_error ? (
                <p className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">{t.autoFailed(post.publish_error)}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <CopyRich text={post.title} label={t.copyTitle} done={t.copied} />
                <CopyRich text={plain} html={html} label={t.copy} done={t.copied} primary />
                {html ? <CopyRich text={plain} label={t.copyPlain} done={t.copied} /> : null}
                <a
                  href={spec.home}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-text"
                >
                  {t.openPlatform(pf[post.platform])} ↗
                </a>
              </div>
              <details className="rounded-lg border border-line/60 bg-surface-2/40 px-3 py-2">
                <summary className="cursor-pointer text-xs text-muted">{t.showText}</summary>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{plain}</div>
              </details>
              <div className="flex flex-wrap items-end gap-2">
                <form action={publishOutsideAction} className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                  <input type="hidden" name="post" value={post.id} />
                  <label className="min-w-0 flex-1 text-xs text-muted">
                    {t.urlLabel}
                    <input
                      name="url"
                      type="url"
                      required
                      inputMode="url"
                      placeholder={`https://${spec.hosts[0]}/…`}
                      className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
                    />
                  </label>
                  <SubmitButton base="rounded-lg px-3 py-2 text-xs font-semibold">{t.publish}</SubmitButton>
                </form>
                <form action={skipOutsideAction}>
                  <input type="hidden" name="post" value={post.id} />
                  <SubmitButton base="rounded-lg px-3 py-2 text-xs" tone="quiet">
                    {t.skip}
                  </SubmitButton>
                </form>
              </div>
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold">{t.publishedTitle}</h2>
          <HelpHint topic={helpAnchor("/admin/outside", "links")} />
        </div>
        {published.length === 0 && sent.length === 0 ? <p className="text-sm text-muted">{t.publishedEmpty}</p> : null}
        <ul className="space-y-2">
          {sent.map((post) => (
            <li key={post.id} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                <span className="rounded-md border border-line px-2 py-0.5 font-semibold text-text">{pf[post.platform]}</span>
                <span>{t.sentLine(when(post.sent_at))}</span>
              </div>
              <p className="mt-1 break-words font-medium">{post.title}</p>
            </li>
          ))}
          {published.map((post) => {
            const state = post.link_state ?? "unchecked";
            return (
              <li key={post.id} className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                  <span className="rounded-md border border-line px-2 py-0.5 font-semibold text-text">{pf[post.platform]}</span>
                  <span>{post.via ? t.publishedAuto(when(post.published_at)) : t.publishedBy(name(post.published_by), when(post.published_at))}</span>
                </div>
                <a
                  href={post.published_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-words font-medium text-blue-soft hover:underline"
                >
                  {post.title}
                </a>
                <p className={`mt-1 text-xs ${STATE_TONE[state]}`}>
                  {stateText[state]}
                  {post.link_checked_at ? ` · ${when(post.link_checked_at)}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {canChoose && auto ? (
        <section className="space-y-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold">{t.autoTitle}</h2>
            <HelpHint topic={helpAnchor("/admin/outside", "auto")} />
          </div>
          <p className="text-xs text-muted">{t.autoLead}</p>
          <p className="text-sm">{t.telegraph(auto.telegraphKey)}</p>
          <form action={postizKeyOutsideAction} className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 text-xs text-muted">
              {t.postizKey}: <span className={auto.postizKey ? "text-green" : "text-faint"}>{auto.postizKey ? t.keySet : t.keyEmpty}</span>
              <input
                name="key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={t.keyPlaceholder}
                className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
              />
            </label>
            <SubmitButton base="rounded-lg px-3 py-2 text-xs font-semibold">{t.saveCheck}</SubmitButton>
            <a
              href="https://platform.postiz.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:text-text"
            >
              {t.openPostiz} ↗
            </a>
          </form>
          <p className="text-xs text-faint">{t.postizHow}</p>
          {auto.check ? (
            <p className={`text-xs ${auto.check.ok && auto.check.ready.length ? "text-green" : "text-gold"}`}>
              {auto.check.ok
                ? t.checkOk(auto.check.channels.length, auto.check.ready.map((p) => pf[p]).join(", "), when(auto.check.at))
                : t.checkFail(auto.check.reason ?? "", when(auto.check.at))}
            </p>
          ) : null}
        </section>
      ) : null}

      {canChoose ? (
        <section className="space-y-2 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold">{t.publisherTitle}</h2>
            <HelpHint topic={helpAnchor("/admin/outside", "publisher")} />
          </div>
          <p className="text-xs text-muted">{t.publisherHint}</p>
          <form action={publisherOutsideAction} className="flex flex-wrap items-center gap-2">
            <select
              name="publisher"
              defaultValue={publisher ?? ""}
              className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text"
            >
              <option value="">{t.publisherNone}</option>
              {people
                .filter((p) => p.opens)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <SubmitButton base="rounded-lg px-3 py-2 text-xs font-semibold">{t.save}</SubmitButton>
          </form>
        </section>
      ) : null}
    </div>
  );
}
