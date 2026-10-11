import { addBloggerByHandle, reassessBlogger, saveBloggersBrief, searchBloggers, setBloggerStatus } from "@/app/cabinet/actions";
import { CopyOpen } from "@/components/cabinet/copy-open";
import { CabinetShell, Card, Notice, button, ghost, input } from "@/components/cabinet/shell";
import type { CabKey } from "@/content/ai-staff/cabinet";
import { assessLeft, briefFrom, searchesToday, SEARCHES_PER_DAY } from "@/lib/ai-staff/bloggers";
import { cabinetPage } from "@/lib/ai-staff/page";
import * as store from "@/lib/ai-staff/store";
import { directUrl } from "@/lib/bloggers/rules";

export const dynamic = "force-dynamic";

const NEXT: Record<store.TenantBlogger["status"], ReadonlyArray<"ready" | "skipped" | "contacted" | "replied" | "deal" | "declined">> = {
  new: ["skipped"],
  ready: ["contacted", "skipped"],
  skipped: ["ready"],
  contacted: ["replied", "declined"],
  replied: ["deal", "declined"],
  deal: [],
  declined: ["ready"],
};

/**
 * ИИ-менеджер по блогерам в кабинете клиента (lib/ai-staff/bloggers.ts):
 * бриф бренда, поиск и оценка блогеров, первое сообщение — в Direct
 * руками в одно касание.
 */
export default async function CabinetBloggers({ searchParams }: { searchParams: Promise<{ n?: string; a?: string }> }) {
  const cab = await cabinetPage();
  const { tenant, t, locale } = cab;
  const { n, a } = await searchParams;
  const raw = await store.bloggersBrief(tenant.id);
  const shell = (children: React.ReactNode) => (
    <CabinetShell t={t} locale={locale} company={tenant.name} current="/cabinet/bloggers" configure={cab.configure} support={cab.role === "support"}>
      {children}
    </CabinetShell>
  );
  const brief = briefFrom(raw);
  const briefForm = (
    <form action={saveBloggersBrief} className="space-y-4">
      <label className="block text-sm">
        {t("blBrand")}
        <input name="brand" defaultValue={brief.brand} required maxLength={600} placeholder={t("blBrandPh")} className={`${input} mt-1`} />
      </label>
      <label className="block text-sm">
        {t("blAudience")}
        <input name="audience" defaultValue={brief.audience} maxLength={600} placeholder={t("blAudiencePh")} className={`${input} mt-1`} />
      </label>
      <label className="block text-sm">
        {t("blOffer")}
        <input name="offer" defaultValue={brief.offer} maxLength={600} placeholder={t("blOfferPh")} className={`${input} mt-1`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          {t("blMin")}
          <input name="minFollowers" type="number" min={100} defaultValue={brief.minFollowers} className={`${input} mt-1`} />
        </label>
        <label className="block text-sm">
          {t("blMax")}
          <input name="maxFollowers" type="number" min={1000} defaultValue={brief.maxFollowers} className={`${input} mt-1`} />
        </label>
      </div>
      <button className={button}>{raw ? t("blSave") : t("blEnable")}</button>
    </form>
  );

  if (!raw) {
    return shell(
      <Card title={t("blTitle")}>
        <p className="mb-4 text-sm text-muted">{t("blIntro")}</p>
        {cab.configure ? briefForm : <p className="text-sm text-gold">{t("blOff")}</p>}
      </Card>,
    );
  }

  const [list, left, searched] = await Promise.all([store.tenantBloggers(tenant.id), assessLeft(tenant.id), searchesToday(tenant.id)]);
  const ready = list.filter((b) => b.status === "ready");
  const rest = list.filter((b) => b.status !== "ready");
  const notices: Partial<Record<string, CabKey>> = { limit: "blLimit", no_budget: "blNoBudget", failed: "blNoBudget", no_left: "blNoLeft", bad: "blBad", empty: "blBad" };
  const fmt = (v: number | null) => (v === null ? "?" : v.toLocaleString(locale === "uz" ? "uz-Latn-UZ" : "ru-RU"));

  const card = (b: store.TenantBlogger, withPitch: boolean) => (
    <div key={b.id} className="rounded-lg border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <a href={`https://www.instagram.com/${b.handle}/`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
          @{b.handle} <span className="text-sm font-normal text-muted">{b.name}</span>
        </a>
        <span className="text-sm">{b.score === null ? "" : `${b.score} ${t("blScore")}`}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted">
        <span>
          {fmt(b.followers)} {t("blFollowers")}
        </span>
        {b.engagement !== null ? (
          <span>
            {t("blEr")} {b.engagement}%
          </span>
        ) : null}
        {b.city ? <span>{b.city}</span> : null}
        {b.topics.length ? <span>{b.topics.join(", ")}</span> : null}
      </div>
      {b.why ? <p className="mt-1 text-sm">{b.why}</p> : null}
      {b.score_notes ? <p className="mt-1 text-xs text-gold">{b.score_notes}</p> : null}
      {withPitch && b.pitch ? <pre className="mt-2 whitespace-pre-wrap rounded-md bg-ink p-3 text-sm text-muted">{b.pitch}</pre> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {withPitch && b.pitch ? <CopyOpen text={b.pitch} url={directUrl(b.handle)} label={t("blOpenDirect")} done={t("blCopied")} /> : null}
        {NEXT[b.status].map((s) => (
          <form key={s} action={setBloggerStatus}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="status" value={s} />
            <button className={ghost}>{t(`bl_${s}` as CabKey)}</button>
          </form>
        ))}
        {b.score === null || b.status === "skipped" ? (
          <form action={reassessBlogger}>
            <input type="hidden" name="id" value={b.id} />
            <button className={ghost}>{t("blReassess")}</button>
          </form>
        ) : null}
      </div>
    </div>
  );

  return shell(
    <>
      {n === "found" ? <Notice text={`${t("blFound")}: ${Number(a) || 0}`} /> : null}
      {n && notices[n] ? <Notice tone="warn" text={t(notices[n] as CabKey)} /> : null}
      <Card title={t("blTitle")} hint={`${t("blLeft")}: ${left}`}>
        <p className="mb-4 text-sm text-muted">{t("blIntro")}</p>
        {!brief.brand ? <p className="mb-4 text-sm text-gold">{t("blBriefFirst")}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <form action={searchBloggers} className="space-y-2">
            <input name="query" required maxLength={120} placeholder={t("blSearchPh")} aria-label={t("blSearch")} className={input} disabled={searched >= SEARCHES_PER_DAY} />
            <button className={button} disabled={searched >= SEARCHES_PER_DAY || left <= 0}>
              {t("blSearch")}
            </button>
            <p className="text-xs text-faint">{searched >= SEARCHES_PER_DAY ? t("blLimit") : t("blSearchNote")}</p>
          </form>
          <form action={addBloggerByHandle} className="space-y-2">
            <input name="handle" required maxLength={200} placeholder={t("blAddPh")} aria-label={t("blAdd")} className={input} />
            <button className={button} disabled={left <= 0}>
              {t("blAdd")}
            </button>
          </form>
        </div>
      </Card>
      {cab.configure ? (
        <Card title={t("blBrief")}>
          <details>
            <summary className="cursor-pointer text-sm text-muted">{brief.brand || t("blBrand")}</summary>
            <div className="mt-4">{briefForm}</div>
          </details>
        </Card>
      ) : null}
      <Card title={`${t("blReady")} · ${ready.length}`}>
        {list.length === 0 ? <p className="text-sm text-muted">{t("blEmpty")}</p> : null}
        <div className="space-y-3">{ready.map((b) => card(b, true))}</div>
      </Card>
      {rest.length ? (
        <Card title={`${t("blOther")} · ${rest.length}`}>
          <div className="space-y-3">{rest.map((b) => card(b, false))}</div>
        </Card>
      ) : null}
    </>,
  );
}
