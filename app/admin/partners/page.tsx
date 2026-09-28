import Link from "next/link";

import { addPartner, decide, decideAgencyAction, editPartner } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { money } from "@/lib/admin/finance";
import { requireAdmin } from "@/lib/admin/guard";
import { MIN_PAYOUT_USD, PARTNER_TIERS, PERK_TITLE, linkUrl, shortUrl } from "@/lib/partners/rules";
import { agenciesOf, listPartners, summarize } from "@/lib/partners/store";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Партнёры: кто привёл клиентов, что им начислено, кто просит выплату.
 *
 * Только владелец: это деньги посторонним людям. Начисления считаются на
 * лету из проектов и платежей, как у сотрудников; здесь — сводка по
 * каждому и заявки на выплату, которые нужно решить.
 */

const RESULT: Record<string, { text: string; tone: "ok" | "warn" }> = {
  ok: { text: "Готово.", tone: "ok" },
  created: { text: "Партнёр заведён. Ссылка у него в /ref, когда напишет боту, — или отдайте ему код.", tone: "ok" },
  paid: { text: "Отмечено как выплаченное, партнёр получил сообщение.", tone: "ok" },
  rejected: { text: "Заявка отклонена, сумма вернулась партнёру в доступное.", tone: "ok" },
  invalid: { text: "Не разобрал: код — латиница и цифры от 3 до 24, процент — целое от 0 до 100, Telegram id — число.", tone: "warn" },
  taken: { text: "Такой код или Telegram id уже есть.", tone: "warn" },
  gone: { text: "Такой записи уже нет — возможно, заявку уже решили.", tone: "warn" },
  forbidden: { text: "Это может только владелец.", tone: "warn" },
  failed: { text: "Не получилось. Попробуйте ещё раз.", tone: "warn" },
  agency_active: { text: "Агентство подключено: его заказы засчитываются партнёру. Партнёру ушло сообщение.", tone: "ok" },
  agency_rejected: { text: "Агентство отклонено. Партнёру ушло сообщение с причиной.", tone: "ok" },
  offline: { text: "База недоступна.", tone: "warn" },
};

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const SMALL =
  "rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";
const TH = "px-4 py-3 font-normal";
const TD = "px-4 py-3";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const admin = await requireAdmin();
  const { r } = await searchParams;
  const notice = r ? RESULT[r] : null;

  const summaries = await summarize(await listPartners());
  const agencies = await agenciesOf("all");
  const pendingAgencies = agencies.filter((a) => a.status === "pending");
  const partnerName = new Map(summaries.map((s) => [s.partner.id, s.partner.name]));
  const requests = summaries
    .flatMap((s) => s.payouts.filter((p) => p.status === "requested").map((p) => ({ ...p, partner: s.partner })))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const totals = {
    frozen: summaries.reduce((sum, s) => sum + s.balance.frozen, 0),
    earned: summaries.reduce((sum, s) => sum + s.balance.earned, 0),
    paid: summaries.reduce((sum, s) => sum + s.balance.paid, 0),
    due: summaries.reduce((sum, s) => sum + s.balance.available + s.balance.requested, 0),
  };

  return (
    <AdminShell staff={admin}>
      <h1 className="text-lg font-semibold">Партнёры</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Приводят клиентов — получают процент по модели, которую выбрали сами: от чистой прибыли
        проекта или с оборота. Ступень — по сумме проекта: {tiersLine()}. Модель меняется не чаще
        раза в неделю и закрепляется за клиентом в день заявки. Клиент засчитывается партнёру, если
        оставил заявку в течение 30 дней после перехода по ссылке; заказы подключённого агентства —
        всегда. Начисление ждёт полной оплаты проекта. Заявку на выплату партнёр подаёт в кабинете
        или в боте (/payout), решаете вы здесь.
      </p>

      {notice ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            notice.tone === "ok" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Партнёров"
          value={String(summaries.length)}
          note={`${summaries.filter((s) => s.paidProjects > 0).length} с оплаченными проектами`}
        />
        <Card label="Заморожено" value={money(totals.frozen)} note="ждёт полной оплаты проектов" />
        <Card label="Заработано" value={money(totals.earned)} note={`выплачено ${money(totals.paid)}`} />
        <Card label="К выплате" value={money(totals.due)} note={`в заявках ${money(requests.reduce((s, p) => s + p.amount_usd, 0))}`} warn={requests.length > 0} />
      </div>

      {/* ── Заявки на выплату ─────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">Заявки на выплату</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[820px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>Когда</th>
              <th className={TH}>Кто</th>
              <th className={TH}>Сумма</th>
              <th className={TH}>Куда</th>
              <th className={TH}>Решение</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((p) => (
              <tr key={p.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label="Когда" className={`${TD} text-xs text-muted`}>{when(p.created_at)}</td>
                <td data-label="Кто" className={TD}>
                  {p.partner.name}
                  {p.partner.username ? <span className="ml-2 text-xs text-faint">@{p.partner.username}</span> : null}
                </td>
                <td data-label="Сумма" className={`${TD} font-mono`}>{money(p.amount_usd)}</td>
                <td data-label="Куда" className={`${TD} break-all font-mono text-xs text-muted`}>{p.requisites}</td>
                <td data-label="Решение" className={TD}>
                  {/* Деньги уходят руками — кошелёк или карта, — и только потом
                      «Выплачено». Отклонение возвращает сумму в доступное. */}
                  <form action={decide} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="payout" value={p.id} />
                    <input name="note" maxLength={300} placeholder="заметка партнёру" className={`${SMALL} w-44`} />
                    <button type="submit" name="status" value="paid" className={BUTTON}>
                      Выплачено
                    </button>
                    <button type="submit" name="status" value="rejected" className="text-xs text-faint hover:text-gold">
                      отклонить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-muted">
                  Открытых заявок нет. Партнёр подаёт её командой /payout, когда доступно от {money(MIN_PAYOUT_USD)}.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Агентства ─────────────────────────────────────────────────── */}
      <h2 className="mt-8 flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
        Агентства партнёров
        {pendingAgencies.length ? <span className="text-gold">· ждут решения: {pendingAgencies.length}</span> : null}
      </h2>
      <p className="mt-1 max-w-2xl text-xs text-faint">
        Партнёр подключает агентство или компанию, откуда регулярно идут заказы на разработку: IT-компанию,
        веб-студию, маркетинговое агентство, интегратора, генподрядчика тендеров. Подтвердите — и все её
        заказы засчитываются партнёру без ограничения в 30 дней: заявки узнаются по контакту и названию
        компании, а проект, заведённый руками, привязывается в карточке проекта, блок «Партнёр».
        Отклоняйте, если компания уже работает с нами.
      </p>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[900px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>Агентство</th>
              <th className={TH}>Контакт</th>
              <th className={TH}>Партнёр</th>
              <th className={TH}>Статус</th>
              <th className={TH}>Решение</th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((a) => (
              <tr key={a.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label="Агентство" className={TD}>
                  {a.name}
                  {a.website ? <span className="block text-xs text-faint">{a.website}</span> : null}
                  {a.note ? <span className="block text-xs text-muted">{a.note}</span> : null}
                </td>
                <td data-label="Контакт" className={`${TD} font-mono text-xs`}>{a.contact ?? "—"}</td>
                <td data-label="Партнёр" className={TD}>{partnerName.get(a.partner_id) ?? "—"}</td>
                <td data-label="Статус" className={`${TD} text-xs`}>
                  {a.status === "active" ? (
                    <span className="text-green">подключено {a.decided_at ? when(a.decided_at) : ""}</span>
                  ) : a.status === "rejected" ? (
                    <span className="text-faint">отклонено{a.decision_note ? `: ${a.decision_note}` : ""}</span>
                  ) : (
                    <span className="text-gold">ждёт решения · {when(a.created_at)}</span>
                  )}
                </td>
                <td data-label="Решение" className={TD}>
                  <form action={decideAgencyAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="agency" value={a.id} />
                    {a.status !== "active" ? (
                      <button type="submit" name="decision" value="active" className={BUTTON}>
                        Подтвердить
                      </button>
                    ) : null}
                    {a.status !== "rejected" ? (
                      <>
                        <input name="note" maxLength={300} placeholder="причина — партнёру" className={`${SMALL} w-44`} />
                        <button type="submit" name="decision" value="rejected" className="text-xs text-faint hover:text-gold">
                          {a.status === "active" ? "отключить" : "отклонить"}
                        </button>
                      </>
                    ) : null}
                  </form>
                </td>
              </tr>
            ))}
            {agencies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-muted">
                  Агентств пока нет. Партнёр подключает их в кабинете на сайте.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Партнёры ──────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">Все партнёры</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[1280px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className={TH}>Кто</th>
              <th className={TH}>Ссылки</th>
              <th className={TH}>Ставка</th>
              <th className={TH}>Клиентов</th>
              <th className={TH}>Проектов</th>
              <th className={TH}>Заморожено</th>
              <th className={TH}>Заработано</th>
              <th className={TH}>Выплачено</th>
              <th className={TH}>Доступно</th>
              <th className={TH}>Правки</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(({ partner, links, balance, leads, projects, paidProjects }) => (
              <tr key={partner.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label="Кто" className={TD}>
                  {partner.name}
                  {partner.status === "blocked" ? <span className="ml-2 text-xs text-gold">заблокирован</span> : null}
                  <span className="block text-xs text-faint">
                    {partner.username ? `@${partner.username}` : partner.telegram_user_id ? `id ${partner.telegram_user_id}` : "без Telegram"}
                    {" · "}с {when(partner.created_at)}
                  </span>
                  {partner.note ? <span className="block text-xs text-muted">{partner.note}</span> : null}
                </td>
                <td data-label="Ссылки" className={`${TD} text-xs`}>
                  {links.map((l) => (
                    <span key={l.id} className="block">
                      <a
                        href={l.slug ? shortUrl(siteUrl, l.slug) : linkUrl(siteUrl, l.code)}
                        className="font-mono hover:text-green"
                        target="_blank"
                        rel="noreferrer noopener"
                        title={l.slug ? `devuz.studio/r/${l.slug}` : undefined}
                      >
                        {l.code}
                      </a>
                      {l.label && !l.is_default ? <span className="text-faint"> — {l.label}</span> : null}
                      <span className="text-faint"> · {l.clicks} / {l.leads}</span>
                      {l.perk !== "none" ? <span className="text-faint"> · {PERK_TITLE[l.perk]}</span> : null}
                    </span>
                  ))}
                </td>
                <td data-label="Ставка" className={`${TD} text-xs text-muted`}>
                  {partner.percent_override !== null
                    ? `${partner.percent_override} %`
                    : partner.payout_model === "turnover"
                      ? "с оборота"
                      : "от прибыли"}
                  <span className="block text-faint">
                    {partner.percent_override !== null
                      ? "персональная"
                      : partner.payout_model === "turnover"
                        ? `${PARTNER_TIERS[0].turnover}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].turnover} %`
                        : `${PARTNER_TIERS[0].profit}–${PARTNER_TIERS[PARTNER_TIERS.length - 1].profit} %`}
                    {partner.model_changed_at ? ` · сменил ${when(partner.model_changed_at)}` : ""}
                  </span>
                </td>
                <td data-label="Клиентов" className={`${TD} font-mono text-xs`}>{leads}</td>
                <td data-label="Проектов" className={`${TD} font-mono text-xs`}>
                  {paidProjects} / {projects.length}
                  <span className="block font-sans text-faint">оплачено / всего</span>
                </td>
                <td data-label="Заморожено" className={`${TD} font-mono text-xs text-muted`}>{money(balance.frozen)}</td>
                <td data-label="Заработано" className={`${TD} font-mono text-xs`}>{money(balance.earned)}</td>
                <td data-label="Выплачено" className={`${TD} font-mono text-xs text-muted`}>{money(balance.paid)}</td>
                <td data-label="Доступно" className={`${TD} font-mono text-xs ${balance.available > 0 ? "text-green" : ""}`}>
                  {money(balance.available)}
                  {balance.requested ? <span className="block font-sans text-faint">в заявке {money(balance.requested)}</span> : null}
                </td>
                <td data-label="Правки" className={TD}>
                  <form action={editPartner} className="flex flex-col gap-2">
                    <input type="hidden" name="partner" value={partner.id} />
                    <div className="flex items-center gap-2">
                      <input
                        name="percent"
                        inputMode="numeric"
                        placeholder="по ступени"
                        defaultValue={partner.percent_override ?? ""}
                        aria-label="Персональная ставка, %"
                        className={`${SMALL} w-24`}
                      />
                      <span className="text-xs text-faint">%</span>
                      <select name="status" defaultValue={partner.status} className={SMALL}>
                        <option value="active">активен</option>
                        <option value="blocked">заблокирован</option>
                      </select>
                    </div>
                    <input name="requisites" maxLength={200} placeholder="реквизиты" defaultValue={partner.requisites ?? ""} className={`${SMALL} w-full`} />
                    <input name="note" maxLength={1000} placeholder="заметка: условия, откуда" defaultValue={partner.note ?? ""} className={`${SMALL} w-full`} />
                    <button type="submit" className="self-start text-xs text-faint hover:text-green">
                      сохранить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-sm text-muted">
                  Партнёров пока нет. Любой, кто напишет боту /ref, станет партнёром сам — или заведите руками ниже.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Завести руками ───────────────────────────────────────────── */}
      <section className="mt-6 max-w-2xl rounded-xl border border-line bg-surface px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-faint">Завести партнёра руками</p>
        <p className="mt-1 text-xs text-faint">
          Для блогера или агентства, с кем договорились до того, как они написали боту. Telegram id
          необязателен: без него человек не получит уведомлений и не подаст заявку сам, но код и ссылка
          будут работать.
        </p>
        <form action={addPartner} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-faint">
            Имя
            <input name="name" required maxLength={120} className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            Код (пусто — придумаем)
            <input name="code" maxLength={24} placeholder="BLOG-IVAN" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            Telegram id
            <input name="telegram_id" inputMode="numeric" placeholder="необязательно" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="block text-xs text-faint">
            Заметка
            <input name="note" maxLength={1000} placeholder="условия, откуда" className={`mt-1 ${INPUT}`} />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={BUTTON}>
              Завести
            </button>
          </div>
        </form>
      </section>

      <div className="mt-8 max-w-2xl space-y-3 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">Как считается.</span> Процент — от чистой прибыли проекта (сумма
          − налог − себестоимость), по проектам клиентов, пришедших по ссылке партнёра. Процент по
          конкретному проекту можно задать на странице проекта. Не засчитывается, если партнёр привёл
          сам себя или клиент уже был у студии до ссылки — причина видна на проекте.
        </p>
        <p>
          <span className="text-muted">Выплаты.</span> Партнёр подаёт заявку в боте с первого рабочего дня
          месяца, минимум {money(MIN_PAYOUT_USD)}. Вы переводите деньги и нажимаете «Выплачено» — партнёр
          получает сообщение. Публичная страница программы:{" "}
          <Link href="/ru/partners" className="text-blue-soft hover:underline">
            /partners
          </Link>
          .
        </p>
      </div>
    </AdminShell>
  );
}

function Card({ label, value, note, warn = false }: { label: string; value: string; note?: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1 font-mono text-2xl ${warn ? "text-gold" : ""}`}>{value}</p>
      {note ? <p className={`mt-1 text-xs ${warn ? "text-gold" : "text-faint"}`}>{note}</p> : null}
    </div>
  );
}

/** «до 2 500 $ — 10 / 6 %, … дороже 30 000 $ — 30 / 20 %» — из той же таблицы, что считает. */
function tiersLine(): string {
  return PARTNER_TIERS.map((t, i) =>
    t.upTo === null
      ? `дороже ${money(PARTNER_TIERS[i - 1]?.upTo ?? 0)} — ${t.profit} / ${t.turnover} %`
      : `до ${money(t.upTo)} — ${t.profit} / ${t.turnover} %`,
  ).join(", ");
}
