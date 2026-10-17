import Link from "next/link";

import { HelpHint } from "@/components/admin/help-link";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { letterTextsDict, textProblemDict } from "@/content/admin-panel/letter-texts";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { SALES_NEW, abVerdict } from "@/lib/admin/sales-after-reply";
import { abCounts } from "@/lib/admin/sales-after-reply-store";
import { pick, type Picked } from "@/lib/admin/i18n";
import {
  AUTO_ARMS,
  EXAMPLE,
  MIN_SENT,
  SAMPLE,
  renderLetter,
  verdict,
  type ArmStats,
  type StoredText,
} from "@/lib/admin/letter-texts";
import { liveTexts, variantStats } from "@/lib/admin/letter-texts-store";
import { HELLO_TEXT } from "@/lib/admin/hello-first";
import { savedHello } from "@/lib/admin/hello-text-store";
import { effectiveHello } from "@/lib/admin/hello-text";
import { SECTIONS } from "@/lib/admin/roles";
import { activeStaff } from "@/lib/admin/team";

import { keepTextAction, makeCommonAction, removeTextAction, saveHelloAction, saveTextAction } from "./actions";

export const dynamic = "force-dynamic";

const BOX = "mt-4 rounded-xl border border-line px-5 py-4";
const AREA = "mt-1 block w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text";

/**
 * Тексты писем и A/B (lib/admin/letter-texts.ts).
 *
 * Владелец, 10.10.2026: менеджеры сами вписывают текст, который уходит с
 * рабочих аккаунтов, два текста — A/B по ответам и конверсиям; в автопрогоне
 * заходы из курсов продаж. Факты о сайте подставляются тезисами.
 */
export default async function LetterTextsPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; he?: string; saved?: string; hsaved?: string; removed?: string; failed?: string }>;
}) {
  const staff = await requireSection("/admin/prospect");
  const { e, he, saved, hsaved, removed, failed } = await searchParams;
  const t = pick(letterTextsDict, staff.panel_locale);
  const tp = pick(textProblemDict, staff.panel_locale);
  const lead = staff.role === "admin" || staff.role === "head";
  // Подстановки в примере — теми именами, что в списке над ним: в русской
  // панели {кто}, в узбекской и польской {kim}.
  const example = staff.panel_locale === "ru" ? EXAMPLE.ru : EXAMPLE.latin;

  const [texts, stats, people, hello, ab] = await Promise.all([
    liveTexts(),
    variantStats(),
    lead ? activeStaff() : Promise.resolve([]),
    savedHello(),
    abCounts().catch(() => null),
  ]);
  const helloNow = effectiveHello(hello);
  const helloErrors = parseProblems(he).map((p) => problemText(p, tp));
  const own = texts.filter((x) => x.owner === staff.id);
  const common = texts.filter((x) => x.owner === null);
  const others = texts.filter((x) => x.owner !== null && x.owner !== staff.id);
  const nameOf = new Map(people.map((p) => [p.id, p.display_name]));
  const statOf = (id: string): ArmStats => stats.get(id) ?? { id, sent: 0, replied: 0, wanted: 0, deals: 0 };
  const errors = parseProblems(e).map((p) => problemText(p, tp));

  const slotName = (slot: "a" | "b") => (slot === "a" ? t.slotA : t.slotB);
  const verdictLine = (pair: readonly StoredText[]) => {
    const v = verdict(pair.map((x) => statOf(`text:${x.id}`)));
    if (v.kind === "early") return t.early(MIN_SENT);
    if (v.kind === "even") return t.even;
    const winner = pair.find((x) => `text:${x.id}` === v.id);
    return winner ? t.leader(slotName(winner.slot), Math.round(v.chance * 100)) : t.even;
  };

  return (
    <AdminShell staff={staff}>
      <p className="text-xs">
        <Link href="/admin/prospect" className="text-muted hover:text-green">
          ← {SECTIONS.find((x) => x.href === "/admin/prospect")?.label[staff.panel_locale]}
        </Link>
      </p>
      <h1 className="mt-2 flex items-center gap-2 text-lg font-semibold">
        {t.title}
        <HelpHint topic={helpAnchor("/admin/prospect", "texts")} />
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>

      <div className="mt-4 max-w-2xl rounded-xl border border-line px-5 py-4 text-xs leading-relaxed text-muted">
        <p className="text-text">{t.placeholders}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{t.phTheses}</li>
          <li>{t.phSite}</li>
          <li>{t.phCompany}</li>
          <li>{t.phName}</li>
          <li>{t.phWho}</li>
          <li>{t.phPrototype}</li>
        </ul>
        <p className="mt-2">{t.rules}</p>

        <p className="mt-4 text-text">{t.exampleWrite}</p>
        <Example text={example.text} />
        <p className="mt-3 text-text">{t.exampleGet}</p>
        <p className="mt-1 whitespace-pre-line rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text">
          {renderLetter(example.text, { ...example.ctx, sender: staff.display_name }, example.lang)}
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-text">{t.exampleUz}</summary>
          <Example text={EXAMPLE.uz.text} />
          <p className="mt-2 whitespace-pre-line rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed text-text">
            {renderLetter(EXAMPLE.uz.text, { ...EXAMPLE.uz.ctx, sender: staff.display_name }, "uz")}
          </p>
        </details>
        <p className="mt-2">{t.exampleNote}</p>
      </div>

      {errors.length ? (
        <p className="mt-4 max-w-2xl rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-300">{errors.join(" ")}</p>
      ) : saved ? (
        <p className="mt-4 text-sm text-green">{t.saved}</p>
      ) : removed ? (
        <p className="mt-4 text-sm text-green">{t.removed}</p>
      ) : failed ? (
        <p className="mt-4 text-sm text-red-300">{t.failed}</p>
      ) : null}

      {/* Своё «Здравствуйте» (lib/admin/hello-text.ts): менять — руководитель и
          владелец, менеджер видит, что уходит первым. */}
      <section id="hello" className={BOX}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {t.helloTitle}
          <HelpHint topic={helpAnchor("/admin/prospect", "hello-text")} />
        </h2>
        {lead ? (
          <form action={saveHelloAction} className="mt-2">
            <p className="text-xs leading-relaxed text-faint">{t.helloIntro}</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="text-xs text-faint">
                {t.helloRu}
                <input name="hello_ru" defaultValue={hello.ru ?? ""} maxLength={80} placeholder={HELLO_TEXT.ru} className={AREA} />
                <span className="mt-1 block">{t.helloDefault(HELLO_TEXT.ru)}</span>
              </label>
              <label className="text-xs text-faint">
                {t.helloUz}
                <input name="hello_uz" defaultValue={hello.uz ?? ""} maxLength={80} placeholder={HELLO_TEXT.uz} className={AREA} />
                <span className="mt-1 block">{t.helloDefault(HELLO_TEXT.uz)}</span>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <SubmitButton pendingLabel={t.saving} base="rounded-lg px-3 py-1.5 text-xs">
                {t.helloSave}
              </SubmitButton>
              {helloErrors.length ? (
                <span className="text-xs text-red-300">{helloErrors.join(" ")}</span>
              ) : hsaved ? (
                <span className="text-xs text-green">{t.helloSaved}</span>
              ) : null}
            </div>
          </form>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-muted">{t.helloNow(helloNow.ru, helloNow.uz)}</p>
        )}
      </section>

      <section id="mine" className={BOX}>
        <h2 className="text-sm font-semibold">{t.mine}</h2>
        {own.length ? null : <p className="mt-1 text-xs text-faint">{t.mineEmpty}</p>}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {(["a", "b"] as const).map((slot) => (
            <TextSlot
              key={slot}
              t={t}
              owner="self"
              slot={slot}
              text={own.find((x) => x.slot === slot) ?? null}
              stats={statOf(`text:${own.find((x) => x.slot === slot)?.id ?? ""}`)}
              sender={staff.display_name}
              canEdit
              canKeep={own.length === 2}
            />
          ))}
        </div>
        {own.length === 2 ? <p className="mt-3 text-xs text-muted">{verdictLine(own)}</p> : null}
      </section>

      <section id="common" className={BOX}>
        <h2 className="text-sm font-semibold">{t.common}</h2>
        <p className="mt-1 text-xs text-faint">{t.commonNote}</p>
        {!lead && !common.length ? <p className="mt-2 text-xs text-faint">{t.commonEmpty}</p> : null}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {(["a", "b"] as const).map((slot) => {
            const text = common.find((x) => x.slot === slot) ?? null;
            if (!lead && !text) return null;
            return (
              <TextSlot
                key={slot}
                t={t}
                owner="common"
                slot={slot}
                text={text}
                stats={statOf(`text:${text?.id ?? ""}`)}
                sender={staff.display_name}
                canEdit={lead}
                canKeep={lead && common.length === 2}
              />
            );
          })}
        </div>
        {common.length === 2 ? <p className="mt-3 text-xs text-muted">{verdictLine(common)}</p> : null}
      </section>

      {lead ? (
        <section className={BOX}>
          <h2 className="text-sm font-semibold">{t.managers}</h2>
          {others.length ? null : <p className="mt-1 text-xs text-faint">{t.managersEmpty}</p>}
          <ul className="mt-3 flex flex-col gap-4">
            {others.map((x) => {
              const s = statOf(`text:${x.id}`);
              return (
                <li key={x.id} className="rounded-lg border border-line px-4 py-3">
                  <p className="text-xs text-muted">
                    {nameOf.get(x.owner ?? "") ?? "—"} · {slotName(x.slot)}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{x.body}</p>
                  <p className="mt-2 text-xs text-faint">{t.stats(s.sent, s.replied, s.wanted, s.deals)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["a", "b"] as const).map((slot) => (
                      <form key={slot} action={makeCommonAction}>
                        <input type="hidden" name="text" value={x.id} />
                        <input type="hidden" name="slot" value={slot} />
                        <SubmitButton pendingLabel={t.saving} base="rounded-lg px-3 py-1.5 text-xs" tone="quiet">
                          {slot === "a" ? t.makeCommonA : t.makeCommonB}
                        </SubmitButton>
                      </form>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* A/B «Новый заход после ответа» (lib/admin/sales-after-reply.ts): по
          половинам, победитель — не раньше 100 «Здравствуйте» на каждую. */}
      <section id="sales-ab" className={BOX}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {t.abTitle}
          <HelpHint topic={helpAnchor("/admin/prospect", "sales-ab")} />
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-faint">{t.abIntro}</p>
        {!SALES_NEW ? <p className="mt-2 text-xs text-gold">{t.abOff}</p> : null}
        {ab && ab.some((a) => a.hello > 0) ? (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-faint">
                  <tr>
                    <th className="py-1 pr-3 font-normal" />
                    <th className="py-1 pr-3 font-normal">{t.abOld}</th>
                    <th className="py-1 font-normal">{t.abNew}</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-text">
                  {(
                    [
                      [t.abHello, "hello"],
                      [t.abLive, "live"],
                      [t.abAfterCircle, "afterCircle"],
                      [t.abPlus, "plus"],
                      [t.abMockup, "mockup"],
                      [t.abPaid, "paid"],
                    ] as const
                  ).map(([label, key]) => (
                    <tr key={key} className="border-t border-line/60">
                      <td className="py-1 pr-3 font-sans text-muted">{label}</td>
                      <td className="py-1 pr-3">{ab[0][key]}</td>
                      <td className="py-1">{ab[1][key]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              {(() => {
                const v = abVerdict(ab[0], ab[1]);
                if (v.kind === "early") return t.abEarly(v.need);
                if (v.kind === "even") return t.abEven;
                return t.abLeader(v.arm === "new" ? t.abNew : t.abOld, Math.round(v.chance * 100));
              })()}
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs text-faint">{t.abNone}</p>
        )}
      </section>

      {lead ? (
        <section className={BOX}>
          <h2 className="text-sm font-semibold">{t.auto}</h2>
          <p className="mt-1 text-xs text-faint">{t.autoNote}</p>
          <ul className="mt-3 flex flex-col gap-4">
            {AUTO_ARMS.map((arm) => {
              const s = statOf(`auto:${arm.key}`);
              const name = arm.key === "pain" ? t.armPain : arm.key === "question" ? t.armQuestion : t.armRival;
              const how = arm.key === "pain" ? t.armPainHow : arm.key === "question" ? t.armQuestionHow : t.armRivalHow;
              return (
                <li key={arm.key} className="rounded-lg border border-line px-4 py-3">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-faint">{how}</p>
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed">
                    {renderLetter(arm.body, { ...SAMPLE, sender: staff.display_name })}
                  </p>
                  <p className="mt-2 text-xs text-faint">{t.stats(s.sent, s.replied, s.wanted, s.deals)}</p>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            {(() => {
              const v = verdict(AUTO_ARMS.map((a) => statOf(`auto:${a.key}`)));
              if (v.kind === "early") return t.early(MIN_SENT);
              if (v.kind === "even") return t.even;
              const key = v.id.slice(5);
              const name = key === "pain" ? t.armPain : key === "question" ? t.armQuestion : t.armRival;
              return t.leader(name, Math.round(v.chance * 100));
            })()}
          </p>
        </section>
      ) : null}
    </AdminShell>
  );
}

function TextSlot({
  t,
  owner,
  slot,
  text,
  stats,
  sender,
  canEdit,
  canKeep,
}: {
  t: Picked<typeof letterTextsDict>;
  owner: "self" | "common";
  slot: "a" | "b";
  text: StoredText | null;
  stats: ArmStats;
  sender: string;
  canEdit: boolean;
  canKeep: boolean;
}) {
  const name = slot === "a" ? t.slotA : t.slotB;
  return (
    <div className="rounded-lg border border-line px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{name}</p>
      {canEdit ? (
        <form action={saveTextAction} className="mt-2">
          <input type="hidden" name="owner" value={owner} />
          <input type="hidden" name="slot" value={slot} />
          <label className="text-xs text-faint">
            {t.bodyLabel}
            <textarea name="body" defaultValue={text?.body ?? ""} rows={6} className={AREA} required minLength={20} maxLength={1500} />
          </label>
          <details className="mt-2" open={Boolean(text?.body_uz)}>
            <summary className="cursor-pointer text-xs text-faint">{t.uzLabel}</summary>
            <textarea name="body_uz" defaultValue={text?.body_uz ?? ""} rows={5} className={AREA} maxLength={1500} />
          </details>
          <div className="mt-2">
            <SubmitButton pendingLabel={t.saving} base="rounded-lg px-3 py-1.5 text-xs">
              {t.save}
            </SubmitButton>
          </div>
        </form>
      ) : text ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{text.body}</p>
      ) : (
        <p className="mt-2 text-xs text-faint">{t.slotEmpty}</p>
      )}

      {text ? (
        <>
          <p className="mt-3 text-xs text-faint">{t.preview}</p>
          <p className="mt-1 whitespace-pre-line rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed">
            {renderLetter(text.body, { ...SAMPLE, sender })}
          </p>
          <p className="mt-2 text-xs text-faint">{t.stats(stats.sent, stats.replied, stats.wanted, stats.deals)}</p>
          {canEdit ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {canKeep ? (
                <form action={keepTextAction}>
                  <input type="hidden" name="owner" value={owner} />
                  <input type="hidden" name="slot" value={slot} />
                  <SubmitButton pendingLabel={t.saving} base="rounded-lg px-3 py-1.5 text-xs" tone="quiet">
                    {t.keep}
                  </SubmitButton>
                </form>
              ) : null}
              <form action={removeTextAction}>
                <input type="hidden" name="owner" value={owner} />
                <input type="hidden" name="slot" value={slot} />
                <SubmitButton pendingLabel={t.saving} base="rounded-lg px-3 py-1.5 text-xs" tone="quiet">
                  {t.remove}
                </SubmitButton>
              </form>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** `?e=[["short",12],["jargon","сервер"]]` — коды проверки с подстановками. */
function parseProblems(raw: string | undefined): { code: string; args: (string | number)[] }[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return list
      .filter((x): x is [string, ...(string | number)[]] => Array.isArray(x) && typeof x[0] === "string")
      .map(([code, ...args]) => ({ code, args }));
  } catch {
    return [];
  }
}

function problemText(p: { code: string; args: (string | number)[] }, t: Picked<typeof textProblemDict>): string {
  const a = p.args[0];
  switch (p.code) {
    case "short":
      return t.short(Number(a ?? 12));
    case "long":
      return t.long(Number(a ?? 100));
    case "greeting":
      return t.greeting;
    case "invented":
      return t.invented(String(a ?? ""));
    case "foreign_script":
      return t.foreign_script(String(a ?? ""));
    case "jargon":
      return t.jargon(String(a ?? ""));
    case "greets_sender":
      return t.greets_sender(String(a ?? ""));
    case "banned":
      return t.banned;
    case "foreign_reference":
      return t.foreign_reference(String(a ?? ""));
    case "unknown_placeholder":
      return t.unknown_placeholder(String(a ?? ""));
    case "no_theses":
      return t.no_theses;
    case "hello_long":
      return t.hello_long(Number(a ?? 8));
    case "hello_not_greeting":
      return t.hello_not_greeting;
    case "hello_link":
      return t.hello_link;
    case "hello_digits":
      return t.hello_digits;
    case "hello_jargon":
      return t.hello_jargon(String(a ?? ""));
    case "hello_banned":
      return t.hello_banned;
    case "hello_script":
      return t.hello_script;
    default:
      return t.unknown;
  }
}

/** Текст примера: подстановки — зелёным, чтобы было видно, что заменится. */
function Example({ text }: { text: string }) {
  return (
    <p className="mt-1 whitespace-pre-line rounded-lg border border-dashed border-line px-3 py-2 text-sm leading-relaxed text-text">
      {text.split(/(\{[^{}]+\})/).map((part, i) =>
        /^\{[^{}]+\}$/.test(part) ? (
          <span key={i} className="font-medium text-green">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}
