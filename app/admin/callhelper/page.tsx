import { AdminShell } from "@/components/admin/shell";
import { CallHelperDesk } from "@/components/admin/callhelper-desk";
import { CallHelperKeys } from "@/components/admin/callhelper-keys";
import { CallHelperWaitlist } from "@/components/admin/callhelper-waitlist";
import { requireSection } from "@/lib/admin/guard";
import { sttState } from "@/lib/callhelper/stt-keys";
import { listWait } from "@/lib/callhelper/waitlist-store";

export const dynamic = "force-dynamic";

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
export default async function CallHelperPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const staff = await requireSection("/admin/callhelper");
  const { k } = await searchParams;
  const owner = staff.role === "admin";
  const [state, wait] = owner ? await Promise.all([sttState(), listWait()]) : [null, []];
  return (
    <AdminShell staff={staff}>
      <CallHelperDesk />
      {owner ? <CallHelperWaitlist locale={staff.panel_locale} rows={wait} /> : null}
      {owner && state ? <CallHelperKeys locale={staff.panel_locale} state={state} result={k && RESULTS.has(k) ? k : null} /> : null}
    </AdminShell>
  );
}
