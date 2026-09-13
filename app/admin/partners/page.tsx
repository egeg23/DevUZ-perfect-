import Link from "next/link";

import { addPartner, decide, editPartner } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { money } from "@/lib/admin/finance";
import { requireAdmin } from "@/lib/admin/guard";
import {
  MIN_PAYOUT_USD,
  PARTNER_PERCENT,
  PERK_TITLE,
  PROVEN_MIN_PAID_PROJECTS,
  PROVEN_PERCENT,
  linkUrl,
  partnerPercent,
} from "@/lib/partners/rules";
import { listPartners, summarize } from "@/lib/partners/store";
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
        Приводят клиентов — получают {PARTNER_PERCENT} % чистой прибыли их проектов, после{" "}
        {PROVEN_MIN_PAID_PROJECTS} оплаченных проектов — {PROVEN_PERCENT} %. Начисление ждёт полной оплаты
        проекта, как у сотрудников. Заявку на выплату партнёр подаёт в боте (/payout), решаете вы здесь.
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
        <Card label="Партнёров" value={String(summaries.length)} note={`${summaries.filter((s) => s.proven).length} прокачанных`} />
        <Card label="Заморожено" value={money(totals.frozen)} note="ждёт полной оплаты проектов" />
        <Card label="Заработано" value={money(totals.earned)} note={`выплачено ${money(totals.paid)}`} />
        <Card label="К выплате" value={money(totals.due)} note={`в заявках ${money(requests.reduce((s, p) => s + p.amount_usd, 0))}`} warn={requests.length > 0} />
      </div>

      {/* ── Заявки на выплату ─────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">Заявки на выплату</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[820px] text-sm">
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
                <td className={`${TD} text-xs text-muted`}>{when(p.created_at)}</td>
                <td className={TD}>
                  {p.partner.name}
                  {p.partner.username ? <span className="ml-2 text-xs text-faint">@{p.partner.username}</span> : null}
                </td>
                <td className={`${TD} font-mono`}>{money(p.amount_usd)}</td>
                <td className={`${TD} break-all font-mono text-xs text-muted`}>{p.requisites}</td>
                <td className={TD}>
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

      {/* ── Партнёры ──────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">Все партнёры</h2>
      <section className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[1280px] text-sm">
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
            {summaries.map(({ partner, links, balance, leads, projects, paidProjects, proven }) => (
              <tr key={partner.id} className="border-b border-line-soft last:border-0 align-top">
                <td className={TD}>
                  {partner.name}
                  {partner.status === "blocked" ? <span className="ml-2 text-xs text-gold">заблокирован</span> : null}
                  <span className="block text-xs text-faint">
                    {partner.username ? `@${partner.username}` : partner.telegram_user_id ? `id ${partner.telegram_user_id}` : "без Telegram"}
                    {" · "}с {when(partner.created_at)}
                  </span>
                  {partner.note ? <span className="block text-xs text-muted">{partner.note}</span> : null}
                </td>
                <td className={`${TD} text-xs`}>
                  {links.map((l) => (
                    <span key={l.id} className="block">
                      <a href={linkUrl(siteUrl, l.code)} className="font-mono hover:text-green" target="_blank" rel="noreferrer noopener">
                        {l.code}
                      </a>
                      {l.label && !l.is_default ? <span className="text-faint"> — {l.label}</span> : null}
                      <span className="text-faint"> · {l.clicks} / {l.leads}</span>
                      {l.perk !== "none" ? <span className="text-faint"> · {PERK_TITLE[l.perk]}</span> : null}
                    </span>
                  ))}
                </td>
                <td className={`${TD} text-xs text-muted`}>
                  {partnerPercent({ projectPercent: null, partnerOverride: partner.percent_override, proven })} %
                  <span className="block text-faint">
                    {partner.percent_override !== null ? "персональная" : proven ? "прокачанный" : "база"}
                  </span>
                </td>
                <td className={`${TD} font-mono text-xs`}>{leads}</td>
                <td className={`${TD} font-mono text-xs`}>
                  {paidProjects} / {projects.length}
                  <span className="block font-sans text-faint">оплачено / всего</span>
                </td>
                <td className={`${TD} font-mono text-xs text-muted`}>{money(balance.frozen)}</td>
                <td className={`${TD} font-mono text-xs`}>{money(balance.earned)}</td>
                <td className={`${TD} font-mono text-xs text-muted`}>{money(balance.paid)}</td>
                <td className={`${TD} font-mono text-xs ${balance.available > 0 ? "text-green" : ""}`}>
                  {money(balance.available)}
                  {balance.requested ? <span className="block font-sans text-faint">в заявке {money(balance.requested)}</span> : null}
                </td>
                <td className={TD}>
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
