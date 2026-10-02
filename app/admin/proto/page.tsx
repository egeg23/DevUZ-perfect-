import { after } from "next/server";

import { buildAction, sentAction } from "@/app/admin/proto/actions";
import { AdminShell } from "@/components/admin/shell";
import { CopyMessage } from "@/components/admin/copy-message";
import { protoDict, protoNichePl, protoResultDict, protoWhen } from "@/content/admin-panel/proto";
import { PROTO_NICHES, protoNicheByKey, type ProtoNiche } from "@/content/proto/models";
import { requireAdmin } from "@/lib/admin/guard";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import { protosList, upgradeAllProtos } from "@/lib/proto/store";
import { traceSite } from "@/lib/proto/trace-store";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";
const LABEL = "block text-xs text-faint";

/** Поля, которыми перебивают то, что нашёл аудитор: имя поля и ключ подписи. */
const OVERRIDES = [
  ["name", "fName"],
  ["city", "fCity"],
  ["hours", "fHours"],
  ["address", "fAddress"],
  ["phone", "fPhone"],
  ["telegram", "fTelegram"],
  ["whatsapp", "fWhatsapp"],
  ["wheel", "fWheel"],
  ["prospect", "fProspect"],
] as const;

const STATUS = { draft: "draft", ready: "ready", sent: "sent" } as const;

/** Ниша на языке панели: в каталоге — русский и узбекский, польский — здесь. */
function nicheName(niche: ProtoNiche, locale: PanelLocale): string {
  return locale === "pl" ? (protoNichePl[niche.key] ?? niche.key) : niche[locale];
}

/**
 * Прототипы: собрать и отправить.
 *
 * Собирает менеджер сразу после первички, пока разговор свежий. Половина
 * фактов приходит с сайта клиента сама — название, описание, телефон,
 * мессенджеры, логотип; список услуг менеджер вписывает руками, потому что
 * на живом сайте под заголовками лежит поисковый мусор, а в разговоре
 * услуги названы верно.
 *
 * Черновик наружу не уходит: ссылка на него отдаёт 404, пока машинная
 * проверка не пройдена. Это не перестраховка — прототип уходит владельцу
 * чужого бизнеса с его именем в шапке, и выдуманная в нём цифра будет
 * утверждением о его компании.
 */
export default async function ProtoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const staff = await requireAdmin();
  const query = await searchParams;
  const { r, d } = query;
  const locale = staff.panel_locale;
  const t = pick(protoDict, locale);
  const results = pick(protoResultDict, locale);
  const notice = r ? (Object.hasOwn(results, r) ? results[r as keyof typeof results](d ?? "") : r) : null;
  const rows = await protosList();
  // Прототипы, собранные до отпечатков и ссылки на условия, перерисовываются
  // фоном — правило владельца для всех макетов, и сделанных раньше тоже.
  after(() => upgradeAllProtos(50).catch(() => 0));
  const check = (query.check ?? "").trim();
  const traced = check ? await traceSite(check) : null;

  /*
   * Поля можно заполнить ссылкой: /admin/proto?url=tirex.uz&services=...
   *
   * Нужно там, где данные уже собраны в другом месте, — например, первичка
   * закончилась, и менеджеру остаётся нажать одну кнопку вместо того, чтобы
   * перепечатывать в форму то, что он только что услышал. Ничего не
   * сохраняется и никуда не уходит: это ровно значения по умолчанию.
   */
  const prefill = (name: string): string | undefined => query[name] || undefined;

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro1}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro2}</p>

      {r && r !== "ok" ? (
        <p className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">{notice}</p>
      ) : null}
      {r === "ok" ? (
        <p className="mt-4 rounded-lg border border-green/40 bg-green/10 px-4 py-3 text-sm text-green">
          {notice}
        </p>
      ) : null}

      {/* Проверка чужого сайта на наш макет — по скрытому отпечатку
          (lib/proto/stamp, lib/proto/trace). Форма GET: результат — по
          адресу, его можно сохранить для претензии. */}
      <section className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-sm font-semibold">{t.checkTitle}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{t.checkIntro}</p>
        <form method="get" className="mt-3 flex flex-wrap gap-2">
          <input name="check" defaultValue={check} placeholder="https://example.uz" className={`${INPUT} max-w-md`} />
          <button className={BUTTON}>{t.checkButton}</button>
        </form>
        {traced ? (
          traced.ok ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-xs text-faint">
                {traced.url} · {t.checkStats(traced.cssFiles, traced.signals)}
              </p>
              {traced.hits.length ? (
                <>
                  {traced.hits.map((hit) => (
                    <div key={hit.id} className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                      <p>
                        <span className={hit.match.level === "strong" ? "font-semibold text-red-300" : "font-semibold text-gold"}>
                          {hit.match.level === "strong" ? t.checkStrong : t.checkLikely}
                        </span>
                        {" · "}
                        {hit.name} · {hit.source} · {protoWhen(hit.created_at, locale)}
                      </p>
                      <p className="mt-1 text-xs text-muted">{t.checkMatch(hit.match.matched, hit.match.total)}</p>
                      {traced.attributed === hit.id ? <p className="mt-1 text-xs text-text">{t.checkClient}</p> : null}
                      {hit.views.length ? (
                        <p className="mt-1 text-xs text-faint">
                          {t.checkViews} {hit.views.map((v) => `${protoWhen(v.at, locale)}${v.ip ? ` (${v.ip})` : ""}`).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                  {traced.attributed ? null : <p className="text-xs text-muted">{t.checkAmbiguous}</p>}
                  <p className="text-xs leading-relaxed text-muted">{t.checkEvidence}</p>
                </>
              ) : (
                <p className="text-muted">{t.checkNone}</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gold">{t.checkError(traced.error)}</p>
          )
        ) : null}
      </section>

      <form action={buildAction} className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={LABEL}>{t.site}</span>
            <input
              name="url"
              required
              placeholder="tirex.uz"
              defaultValue={prefill("url")}
              className={`${INPUT} mt-1`}
            />
          </label>

          <label>
            <span className={LABEL}>{t.niche}</span>
            <select name="niche" className={`${INPUT} mt-1`} defaultValue={prefill("niche") ?? PROTO_NICHES[0].key}>
              {PROTO_NICHES.map((niche) => (
                <option key={niche.key} value={niche.key}>
                  {nicheName(niche, locale)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={LABEL}>{t.pageLang}</span>
            <select name="locale" className={`${INPUT} mt-1`} defaultValue={prefill("locale") ?? "ru"}>
              <option value="ru">{t.langRu}</option>
              <option value="uz">{t.langUz}</option>
            </select>
          </label>

          <label className="sm:col-span-2">
            <span className={LABEL}>{t.services}</span>
            <textarea
              name="services"
              required
              rows={6}
              defaultValue={prefill("services")}
              placeholder={t.servicesPh}
              className={`${INPUT} mt-1 font-mono text-xs leading-relaxed`}
            />
          </label>
        </div>

        {/* Раскрыт, если перебивки пришли ссылкой: иначе человек нажмёт
            «Собрать», не увидев подставленного за него. */}
        <details className="mt-4" open={OVERRIDES.some(([name]) => prefill(name))}>
          <summary className="cursor-pointer text-xs text-faint">{t.overrides}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {OVERRIDES.map(([name, label]) => (
              <label key={name}>
                <span className={LABEL}>{t[label]}</span>
                <input name={name} defaultValue={prefill(name)} className={`${INPUT} mt-1`} />
              </label>
            ))}
            <label className="sm:col-span-2">
              <span className={LABEL}>{t.fAbout}</span>
              <input name="about" defaultValue={prefill("about")} className={`${INPUT} mt-1`} />
            </label>
          </div>
        </details>

        <button
          type="submit"
          className="mt-4 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-green-dim"
        >
          {t.build}
        </button>
      </form>

      {rows.length ? (
        <ul className="mt-6 space-y-3">
          {rows.map((proto) => {
            const link = absoluteUrl(`proto/${proto.token}`);
            const niche = protoNicheByKey(proto.niche);
            return (
              <li key={proto.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">{proto.name}</span>
                  <span className="text-xs text-faint">
                    {niche ? nicheName(niche, locale) : proto.niche} · {proto.source} · {protoWhen(proto.created_at, locale)}
                    {proto.auto ? ` · ${t.auto}` : ""}
                  </span>
                  <span
                    className={`ml-auto rounded px-2 py-0.5 font-mono text-[11px] ${
                      proto.status === "draft" ? "bg-gold/15 text-gold" : "bg-surface-2 text-faint"
                    }`}
                  >
                    {proto.status in STATUS ? t[STATUS[proto.status as keyof typeof STATUS]] : proto.status}
                  </span>
                </div>

                {proto.problems.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-gold">
                    {proto.problems.map((problem, index) => (
                      <li key={index}>{problem.text}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-faint">
                  {proto.status === "draft" ? (
                    <span>{t.draftNote}</span>
                  ) : (
                    <>
                      <code className="rounded bg-ink px-2 py-1 font-mono text-[11px] text-muted">{link}</code>
                      <CopyMessage text={link} label={t.copyLink} />
                      {proto.status === "ready" ? (
                        <form action={sentAction}>
                          <input type="hidden" name="proto" value={proto.id} />
                          <button type="submit" className={BUTTON}>
                            {t.markSent}
                          </button>
                        </form>
                      ) : null}
                      {/* Открыл и вернулся второй раз — звонить сегодня. Не открыл
                          за два дня — прототип не дошёл, и дело не в прототипе. */}
                      <span>
                        {proto.opened_at ? t.opened(protoWhen(proto.opened_at, locale), proto.opens) : t.notOpened}
                      </span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-faint">{t.empty}</p>
      )}
    </AdminShell>
  );
}
