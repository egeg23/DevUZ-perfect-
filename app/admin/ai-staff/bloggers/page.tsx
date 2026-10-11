import {
  addBlogger,
  connectStudioInstagram,
  holdAgent,
  findNow,
  makePartner,
  markDeclined,
  markReplied,
  markSent,
  reassess,
  restoreBlogger,
  saveBloggerSettings,
  skipBlogger,
  toggleAgent,
} from "@/app/admin/ai-staff/bloggers/actions";
import { AiStaffTabs } from "@/app/admin/ai-staff/tabs";
import { BloggerSend } from "@/components/admin/blogger-send";
import { HelpHint } from "@/components/admin/help-link";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { aiStaffDict } from "@/content/admin-panel/ai-staff";
import { bloggersDict } from "@/content/admin-panel/ai-staff-bloggers";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { PANEL_INTL, pick, type Picked } from "@/lib/admin/i18n";
import { studioIg } from "@/lib/bloggers/direct";
import { discoveryConfig } from "@/lib/bloggers/discovery";
import { directUrl, leftToday, mailtoUrl } from "@/lib/bloggers/rules";
import * as store from "@/lib/bloggers/store";
import { firecrawlKey } from "@/lib/firecrawl";
import { igConfig } from "@/lib/ai-staff/instagram";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const INPUT = "rounded-md border border-line bg-ink px-2 py-1 text-sm";
const BTN = "rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-text";

/**
 * «Блогеры» — внутренний ИИ-сотрудник студии (docs/ai-staff/bloggers.md):
 * кого агент нашёл и как оценил, кому пора отправить первое сообщение, кто
 * ответил и кого завести партнёром. Владельцу и руководителю.
 */
export default async function BloggersPage({ searchParams }: { searchParams: Promise<{ n?: string; j?: string; a?: string; d?: string }> }) {
  const staff = await requireSection("/admin/ai-staff");
  const t = pick(bloggersDict, staff.panel_locale);
  const title = pick(aiStaffDict, staff.panel_locale).title;
  const q = await searchParams;
  const now = new Date();
  const [settings, sent, used, counts, ready, found, waiting, talking, partners, skipped, fcKey, discovery, ig, studio] = await Promise.all([
    store.loadSettings(),
    store.sentToday(now),
    store.firecrawlUsedToday(now),
    store.statusCounts(),
    store.bloggersByStatus(["ready", "queued"], 60),
    store.bloggersByStatus(["found"], 20),
    store.bloggersByStatus(["contacted"], 60),
    store.bloggersByStatus(["replied", "stats", "agreed"], 60),
    store.bloggersByStatus(["partner"], 30),
    store.bloggersByStatus(["skipped", "unreachable"], 30),
    firecrawlKey(),
    discoveryConfig(),
    igConfig(),
    studioIg(),
  ]);
  const manualLeft = leftToday(settings.directDaily, sent.manual);
  // Менеджер по галочке владельца отправляет тексты и отмечает ответы;
  // настройки, поиск, оценка и партнёр — владельцу и руководителю.
  const desk = staff.role === "admin" || staff.role === "head";
  const intl = PANEL_INTL[staff.panel_locale];

  return (
    <AdminShell staff={staff}>
      <div className="space-y-5">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">{title}</h1>
          <AiStaffTabs role={staff.role} locale={staff.panel_locale} current="bloggers" />
          <p className="text-sm text-muted">{t.intro}</p>
        </div>
        {q.n === "found" ? <p className="text-sm text-green">{t.found(Number(q.j) || 0, Number(q.a) || 0)}</p> : null}
        {q.n === "saved" ? <p className="text-sm text-green">{t.saved}</p> : null}
        {q.n === "bad" ? <p className="text-sm text-gold">{t.addBad}</p> : null}
        {q.n === "partner_fail" ? <p className="text-sm text-gold">{t.partnerFail}: {q.d}</p> : null}
        {q.n === "ig_ok" ? <p className="text-sm text-green">{t.igOk}</p> : null}
        {q.n === "ig_fail" ? <p className="text-sm text-gold">{t.igFail}</p> : null}
        {q.n === "ig_off" ? <p className="text-sm text-gold">{t.igOff}</p> : null}

        <section className={`${CARD} space-y-3`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={H2}>{t.agent}</span>
            <span className={settings.enabled ? "text-green" : "text-gold"}>{settings.enabled ? t.agentOn : t.agentOff}</span>
            {desk ? (
              <>
                <form action={toggleAgent}>
                  <input type="hidden" name="on" value={settings.enabled ? "off" : "on"} />
                  <button className={BTN}>{settings.enabled ? t.turnOff : t.turnOn}</button>
                </form>
                <form action={findNow}>
                  <SubmitButton pendingLabel={t.searching} tone="quiet" base="rounded-md px-2.5 py-1 text-xs">
                    {t.findNow}
                  </SubmitButton>
                </form>
              </>
            ) : null}
            <HelpHint topic={helpAnchor("/admin/ai-staff", "bloggers-agent")} />
          </div>
          <div className="grid gap-1 text-sm sm:grid-cols-2">
            <span>
              {t.firecrawl}: {fcKey ? t.firecrawlToday(used.bloggers, settings.firecrawlDaily) : <span className="text-gold">{t.noFirecrawl}</span>}
            </span>
            <span>
              {t.discovery}: <span className={discovery ? "text-green" : "text-gold"}>{discovery ? t.connected : t.notConnected}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              {t.direct}:{" "}
              <span className={studio ? "text-green" : "text-gold"}>{studio ? `${t.connected} · @${studio.username}` : t.notConnected}</span>
              {ig && desk ? (
                <form action={connectStudioInstagram}>
                  <button className={BTN}>{t.connectIg}</button>
                </form>
              ) : null}
            </span>
            <span>
              {t.quotaTg(sent.telegram, settings.tgDaily)} · {t.quotaManual(sent.manual, settings.directDaily)}
            </span>
          </div>
          {desk ? (
          <details>
            <summary className="cursor-pointer text-sm text-muted">{t.settings}</summary>
            <form action={saveBloggerSettings} className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                {t.tgDaily}
                <input name="tgDaily" type="number" min={0} max={10} defaultValue={settings.tgDaily} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1">
                {t.directDaily}
                <input name="directDaily" type="number" min={0} max={50} defaultValue={settings.directDaily} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1">
                {t.firecrawlDaily}
                <input name="firecrawlDaily" type="number" min={0} max={20} defaultValue={settings.firecrawlDaily} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1">
                {t.minFollowers}
                <input name="minFollowers" type="number" min={500} defaultValue={settings.minFollowers} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1">
                {t.maxFollowers}
                <input name="maxFollowers" type="number" min={1000} defaultValue={settings.maxFollowers} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1">
                {t.minScore}
                <input name="minScore" type="number" min={0} max={100} defaultValue={settings.minScore} className={INPUT} />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-3">
                {t.queries}
                <textarea name="queries" rows={5} defaultValue={settings.queries.join("\n")} className={INPUT} />
              </label>
              <div>
                <button className={BTN}>{t.save}</button>
              </div>
            </form>
          </details>
          ) : null}
          {desk ? (
          <form action={addBlogger} className="flex flex-wrap items-center gap-2">
            <input name="handle" required placeholder={t.addPlaceholder} aria-label={t.add} className={`${INPUT} w-56`} />
            <input name="note" placeholder={t.addNote} aria-label={t.addNote} className={`${INPUT} w-56`} />
            <SubmitButton pendingLabel={t.searching} tone="quiet" base="rounded-md px-2.5 py-1 text-xs">
              {t.add}
            </SubmitButton>
          </form>
          ) : null}
        </section>

        <section className={CARD}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className={H2}>
              {t.toSend} · {ready.length}
            </h2>
            <HelpHint topic={helpAnchor("/admin/ai-staff", "bloggers-send")} />
          </div>
          {ready.length === 0 ? <p className="text-sm text-muted">{t.toSendNone}</p> : null}
          {manualLeft === 0 && ready.some((b) => b.channel !== "telegram") ? <p className="mb-2 text-sm text-gold">{t.quotaDone}</p> : null}
          <div className="space-y-3">
            {ready.map((b) => (
              <BloggerCard key={b.id} b={b} t={t} intl={intl}>
                {b.pitch ? <pre className="mt-2 whitespace-pre-wrap rounded-md bg-ink p-2 text-xs text-muted">{b.pitch}</pre> : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {b.channel === "telegram" ? (
                    <span className="text-xs text-muted">{b.status === "queued" ? t.queuedTg : t.viaTelegram}</span>
                  ) : manualLeft > 0 && b.pitch ? (
                    <>
                      <BloggerSend
                        text={b.pitch}
                        url={b.channel === "email" && b.email ? mailtoUrl(b.email, b.pitch_lang ?? "ru", b.pitch) : directUrl(b.handle)}
                        label={b.channel === "email" ? t.openMail : t.openDirect}
                      />
                      <Act action={markSent} id={b.id} label={t.sent} />
                    </>
                  ) : null}
                  <Act action={skipBlogger} id={b.id} label={t.skip} />
                  {desk ? <Act action={reassess} id={b.id} label={t.reassess} /> : null}
                </div>
              </BloggerCard>
            ))}
          </div>
        </section>

        {talking.length ? (
          <section className={CARD}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className={H2}>
                {t.talking} · {talking.length}
              </h2>
              <HelpHint topic={helpAnchor("/admin/ai-staff", "bloggers-partner")} />
            </div>
            <div className="space-y-3">
              {talking.map((b) => (
                <BloggerCard key={b.id} b={b} t={t} intl={intl}>
                  {b.human_until && Date.parse(b.human_until) > now.getTime() ? <p className="mt-1 text-xs text-gold">{t.humanLeads}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {desk ? <Act action={makePartner} id={b.id} label={t.makePartner} /> : null}
                    <Act action={markDeclined} id={b.id} label={t.declined} />
                    <form action={holdAgent}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="on" value={b.human_until && Date.parse(b.human_until) > now.getTime() ? "off" : "on"} />
                      <button className={BTN}>{b.human_until && Date.parse(b.human_until) > now.getTime() ? t.holdOff : t.holdOn}</button>
                    </form>
                  </div>
                </BloggerCard>
              ))}
            </div>
          </section>
        ) : null}

        {waiting.length ? (
          <section className={CARD}>
            <h2 className={`${H2} mb-3`}>
              {t.waiting} · {waiting.length}
            </h2>
            <div className="space-y-3">
              {waiting.map((b) => (
                <BloggerCard key={b.id} b={b} t={t} intl={intl}>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Act action={markReplied} id={b.id} label={t.replied} />
                    {desk ? <Act action={makePartner} id={b.id} label={t.makePartner} /> : null}
                    <Act action={markDeclined} id={b.id} label={t.declined} />
                  </div>
                </BloggerCard>
              ))}
            </div>
          </section>
        ) : null}

        {found.length ? (
          <section className={CARD}>
            <h2 className={`${H2} mb-2`}>
              {t.pending} · {counts.found}
            </h2>
            <p className="text-sm text-muted">{found.map((b) => `@${b.handle}`).join(", ")}</p>
          </section>
        ) : null}

        {partners.length ? (
          <section className={CARD}>
            <h2 className={`${H2} mb-2`}>
              {t.partners} · {counts.partner}
            </h2>
            <p className="text-sm">
              {partners.map((b) => (
                <a key={b.id} href="/admin/partners" className="mr-3 text-green hover:underline">
                  @{b.handle}
                </a>
              ))}
            </p>
          </section>
        ) : null}

        {skipped.length ? (
          <details className={CARD}>
            <summary className={`${H2} cursor-pointer`}>
              {t.skipped} · {counts.skipped + counts.unreachable}
            </summary>
            <div className="mt-3 space-y-3">
              {skipped.map((b) => (
                <BloggerCard key={b.id} b={b} t={t} intl={intl}>
                  <div className="mt-2 flex gap-2">
                    <Act action={restoreBlogger} id={b.id} label={t.restore} />
                    {desk ? <Act action={reassess} id={b.id} label={t.reassess} /> : null}
                  </div>
                </BloggerCard>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </AdminShell>
  );
}

function Act({ action, id, label }: { action: (form: FormData) => Promise<void>; id: string; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className={BTN}>{label}</button>
    </form>
  );
}

function BloggerCard({ b, t, intl, children }: { b: store.Blogger; t: Picked<typeof bloggersDict>; intl: string; children?: React.ReactNode }) {
  const n = (v: number | null) => (v === null ? "?" : v.toLocaleString(intl));
  return (
    <div className="rounded-lg border border-line-soft p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-medium">
          <a href={`https://www.instagram.com/${b.handle}/`} target="_blank" rel="noopener noreferrer" className="hover:underline">
            @{b.handle}
          </a>{" "}
          <span className="text-sm text-muted">{b.name}</span>
        </div>
        <div className="text-sm">
          {b.score === null ? <span className="text-muted">{t.notChecked}</span> : <span className={b.score >= 70 ? "text-green" : ""}>{b.score} {t.score}</span>}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          {n(b.followers)} {t.followers}
        </span>
        {b.engagement !== null ? (
          <span>
            {t.er} {b.engagement}%
          </span>
        ) : null}
        {b.posts_per_week !== null ? (
          <span>
            {b.posts_per_week} {t.perWeek}
          </span>
        ) : null}
        {b.metrics_from ? <span>{b.metrics_from === "ig" ? t.fromIg : t.fromSearch}</span> : null}
        {b.city ? <span>{b.city}</span> : null}
        {b.topics.length ? <span>{b.topics.join(", ")}</span> : null}
        {b.telegram ? <span>t.me/{b.telegram}</span> : null}
        {b.email ? <span>{b.email}</span> : null}
      </div>
      {b.why ? <p className="mt-1 text-sm">{b.why}</p> : null}
      {b.score_notes ? <p className="mt-1 text-xs text-gold">{b.score_notes}</p> : null}
      {b.audience_notes ? (
        <p className="mt-1 text-xs">
          {t.audience}: {b.audience_notes}
        </p>
      ) : null}
      {b.note ? <p className="mt-1 text-xs text-muted">{b.note}</p> : null}
      {b.tg_account && b.contacted_at ? <p className="mt-1 text-xs text-muted">{t.sentFrom(b.tg_account)}</p> : null}
      {b.messages.length ? (
        <div className="mt-2 space-y-1 border-l border-line pl-2 text-xs">
          {b.messages.slice(-4).map((m, i) => (
            <p key={i} className={m.role === "blogger" ? "text-text" : "text-muted"}>
              <span className="text-faint">{m.role === "blogger" ? t.them : t.us}:</span> {m.text.length > 300 ? `${m.text.slice(0, 300)}…` : m.text}
            </p>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}
