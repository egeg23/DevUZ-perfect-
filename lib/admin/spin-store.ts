import { serviceClient } from "@/lib/supabase";
import { SPIN_FROM, spinHalf, type SpinCounts } from "@/lib/admin/spin";

/**
 * Счёт половин A/B «SPIN в переписке» (lib/admin/spin.ts): разговоры, где
 * модель ответила с SPIN_FROM, по половинам spinHalf, сколько из них дошли
 * до «+» и до отправленного макета. Лимиты — чтобы страница не висела.
 */
export async function spinCounts(): Promise<[SpinCounts, SpinCounts] | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data: replies, error } = await db
    .from("outreach_messages")
    .select("prospect_id")
    .eq("direction", "out")
    .eq("author", "ai")
    .gte("created_at", `${SPIN_FROM}T00:00:00+05:00`)
    .limit(20000);
  if (error) return null;
  const ids = [...new Set((replies ?? []).map((r) => String(r.prospect_id)).filter(Boolean))];

  const plus = new Set<string>();
  const mocked = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const part = ids.slice(i, i + 200);
    const [{ data: ps }, { data: offers }] = await Promise.all([
      db.from("prospects").select("id").in("id", part).not("proto_requested_at", "is", null),
      db.from("mockup_offers").select("prospect_id").in("prospect_id", part).limit(5000),
    ]);
    for (const p of ps ?? []) plus.add(String(p.id));
    for (const o of offers ?? []) mocked.add(String(o.prospect_id));
  }

  const on: SpinCounts = { spin: true, talks: 0, plus: 0, mockup: 0 };
  const off: SpinCounts = { spin: false, talks: 0, plus: 0, mockup: 0 };
  for (const id of ids) {
    const c = spinHalf(id) ? on : off;
    c.talks += 1;
    if (plus.has(id)) c.plus += 1;
    if (mocked.has(id)) c.mockup += 1;
  }
  return [on, off];
}
