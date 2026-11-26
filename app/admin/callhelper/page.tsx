import { AdminShell } from "@/components/admin/shell";
import { CallHelperDesk } from "@/components/admin/callhelper-desk";
import { CallHelperKeys } from "@/components/admin/callhelper-keys";
import { CallHelperOrgs } from "@/components/admin/callhelper-orgs";
import { CallHelperWaitlist } from "@/components/admin/callhelper-waitlist";
import { requireSection } from "@/lib/admin/guard";
import { listOrgs } from "@/lib/callhelper/orgs-admin";
import { sttState } from "@/lib/callhelper/stt-keys";
import { listWait } from "@/lib/callhelper/waitlist-store";

export const dynamic = "force-dynamic";

const ORG_RESULTS = new Set(["saved", "bad", "failed"]);
const RESULTS = new Set(["ok", "bad-key", "bad-folder", "key", "folder", "down", "failed", "empty"]);

/**
 * DevUz CallHelper — суфлёр для операторов колл-центра.
 *
 * Владелец, 25.11.2026: «Давай сделаем ИИ суфлёра для колл-центров…», на
 * план — «Делаем, название: DevUz CallHelper». Первый шаг: суфлёр по тексту
 * разговора и сценарий звонка; голос, кабинет колл-центра и подписка —
 * следующими шагами (CLAUDE.md, «DevUz CallHelper»). Раздел пока только у
 * владельца; лист ожидания и ключ распознавания речи — блоками под суфлёром,
 * тоже только ему.
 */
export default async function CallHelperPage({ searchParams }: { searchParams: Promise<{ k?: string; o?: string }> }) {
  const staff = await requireSection("/admin/callhelper");
  const { k, o } = await searchParams;
  const owner = staff.role === "admin";
  const [state, wait, orgs] = owner ? await Promise.all([sttState(), listWait(), listOrgs()]) : [null, [], []];
  return (
    <AdminShell staff={staff}>
      <CallHelperDesk />
      {owner ? <CallHelperOrgs rows={orgs} result={o && ORG_RESULTS.has(o) ? o : null} docsHref="/ru/callhelper/api" /> : null}
      {owner ? <CallHelperWaitlist locale={staff.panel_locale} rows={wait} /> : null}
      {owner && state ? <CallHelperKeys locale={staff.panel_locale} state={state} result={k && RESULTS.has(k) ? k : null} /> : null}
    </AdminShell>
  );
}
