import { routeNewLead } from "@/lib/admin/lead-queue-store";
import { salesRecipients } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { esc } from "@/lib/qualify/telegram";
import type { QualifyToolInput } from "@/lib/qualify/types";
import { tenderVerdict } from "@/lib/scout/tender-match";
import { SOURCE_LABEL, type TenderSource } from "@/lib/scout/tender-sources";
import { serviceClient } from "@/lib/supabase";

/**
 * Тендер — лид менеджеру.
 *
 * Владелец, 10.11.2026: «Информация должна приходить по заявкам в бота
 * нашего где менеджеры могут взять тот или иной тендер… Берутся как обычные
 * лиды менеджерами. Но с обязательным условием — предварительно связаться со
 * мной или Александром и запросить цену. Берем только сайты и все что делает
 * наша студия».
 *
 * Новый наш лот из `scout_tenders` становится лидом (источник «scout») и идёт
 * той же очередью тёплых лидов, что лид с сайта: днём — по очереди на
 * полчаса, ночью — утром. Условие про цену стоит в шапке карточки в боте и
 * первой строкой заметок — его видят и в боте, и в панели.
 */

/** Обязательное условие владельца — дословно одно на все места. */
export const PRICE_RULE = "Перед подачей заявки — связаться с Егором или Александром и запросить цену. Без согласованной цены не подаём.";

/** За один проход — не больше: десяток карточек разом очередь не читает. */
const PER_PASS = 8;
/** Старше — не продвигаем: лот, который неделю лежал, уже разобрали руками. */
const FRESH_DAYS = 3;

export type TenderLeadRow = {
  id: string;
  created_at: string;
  source: TenderSource;
  url: string;
  title: string;
  title_ru?: string | null;
  customer: string | null;
  region: string | null;
  kind: string | null;
  price: number | null;
  currency: string | null;
  deadline: string | null;
  topics: string[];
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  customer_inn: string | null;
};

/** Услуги по темам лота — теми же слагами, что у квалификации. */
export function servicesOfTopics(topics: string[]): string[] {
  const out = new Set<string>();
  for (const topic of topics) {
    if (topic === "приложение") out.add("mobile-apps");
    else if (["бот", "автоматизация", "ии", "система"].includes(topic)) out.add("integrations-automation");
    else out.add("web-development");
  }
  return out.size ? [...out] : ["web-development"];
}

function money(price: number | null, currency: string | null): string {
  if (!price) return "";
  return `${Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency ?? ""}`.trim();
}

/** «17.11, 16:13» по Ташкенту. */
function tashkent(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(new Date(iso).getTime() + 5 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** Студия это делает? Тот же разбор, что при чтении площадок, — на случай лотов, сохранённых до сужения. */
export function studioTender(title: string): boolean {
  return tenderVerdict(title, "", true).ours;
}

/** Лид из тендера. Квалификации не было — неизвестное не выдумывается. */
export function leadFromTender(row: TenderLeadRow): QualifyToolInput {
  const where = SOURCE_LABEL[row.source];
  const contactName = row.contact_person || row.customer || "заказчик тендера";
  const handle = row.phone || row.email || row.url;
  const kind = row.phone ? "phone" : row.email ? "email" : "none";
  const unknown = "не выяснено — открытый тендер, разговора ещё не было";
  const deadline = tashkent(row.deadline);
  const price = money(row.price, row.currency);
  const ru = row.title_ru && row.title_ru !== row.title ? row.title_ru : null;
  return {
    contact_name: contactName.slice(0, 200),
    company: (row.customer ?? "").slice(0, 400),
    contact_handle: handle,
    contact_kind: kind,
    niche: "госзакупки и тендеры",
    niche_tier: 1,
    expertise: "medium",
    services: servicesOfTopics(row.topics),
    budget: row.price ? "B1" : "B2",
    authority: "A2",
    need: "N1",
    timing: "T1",
    intent: "interested",
    summary: {
      client: row.customer ?? contactName,
      request: `Тендер: ${ru ?? row.title}`.slice(0, 400),
      niche: "госзакупки и тендеры",
      expertise: unknown,
      budget: price ? `стартовая цена лота ${price}` : unknown,
      authority: "заказчик сам объявил закупку",
      need: `открытый тендер на ${where}${row.kind ? ` (${row.kind})` : ""}`,
      timing: deadline ? `приём заявок до ${deadline} по Ташкенту` : unknown,
    },
    notes: [
      `⚠️ ${PRICE_RULE}`,
      ru ? `Название на площадке: ${row.title.slice(0, 300)}` : "",
      `Лот: ${row.url}`,
      `Площадка: ${where}${row.kind ? ` · ${row.kind}` : ""}`,
      price ? `Стартовая цена: ${price}` : "",
      deadline ? `Приём заявок до: ${deadline} (Ташкент)` : "",
      row.region ? `Регион: ${row.region}` : "",
      row.customer_inn ? `ИНН заказчика: ${row.customer_inn}` : "",
      row.contact_person ? `Ответственный: ${row.contact_person}` : "",
      row.phone ? `Телефон: ${row.phone}` : "",
      row.email ? `Почта: ${row.email}` : "",
      row.phone || row.email ? "" : "Контакта в карточке лота нет — звонить в организацию по ИНН или смотреть документы лота.",
      "Заявку подают на самой площадке, с ЭЦП компании.",
    ]
      .filter(Boolean)
      .join("\n"),
    opening_line:
      `Здравствуйте! Это студия DevUz. Увидели ваш лот «${row.title.slice(0, 120)}» на ${where} и готовим участие. ` +
      "Подскажите, к кому можно обратиться с вопросами по техническому заданию?",
    already_told: [],
    avoid_asking: [],
  };
}

/** Шапка карточки в боте: что это за лид и обязательное условие. */
export function tenderHeading(row: TenderLeadRow): string {
  return [
    `🏛 <b>Тендер</b> · ${esc(SOURCE_LABEL[row.source])}${row.kind ? ` · ${esc(row.kind)}` : ""}`,
    row.title_ru && row.title_ru !== row.title ? `🇷🇺 Что хотят: ${esc(row.title_ru)}` : "",
    `⚠️ <b>${esc(PRICE_RULE)}</b>`,
    row.deadline ? `Приём заявок до: ${esc(tashkent(row.deadline))} (Ташкент)` : "",
    `Лот: ${esc(row.url)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type TenderLeadReport = { leads: number; skipped: number; errors: string[] };

/**
 * Проход: свежие наши тендеры без лида — в лиды. Лот забирается условным
 * обновлением `lead_at` до записи лида: два прохода подряд не заведут два лида.
 */
export async function promoteTenders(now: Date = new Date()): Promise<TenderLeadReport> {
  const report: TenderLeadReport = { leads: 0, skipped: 0, errors: [] };
  const db = serviceClient();
  if (!db) return report;

  const since = new Date(now.getTime() - FRESH_DAYS * 86_400_000).toISOString();
  const { data, error } = await db
    .from("scout_tenders")
    .select("id, created_at, source, url, title, title_ru, customer, region, kind, price, currency, deadline, topics, phone, email, contact_person, customer_inn")
    .is("lead_at", null)
    .eq("status", "new")
    .gte("created_at", since)
    .or(`deadline.is.null,deadline.gt.${now.toISOString()}`)
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(PER_PASS * 3);
  if (error) {
    // Миграции 0185 ещё нет — лидов нет, лента работает как раньше.
    report.errors.push(`тендеры в лиды: ${error.message}`);
    return report;
  }

  for (const raw of data ?? []) {
    if (report.leads >= PER_PASS) break;
    const row = raw as TenderLeadRow;
    const { data: claimed } = await db
      .from("scout_tenders")
      .update({ lead_at: now.toISOString() })
      .eq("id", row.id)
      .is("lead_at", null)
      .select("id");
    if (!claimed?.length) continue;
    if (!studioTender(row.title)) {
      report.skipped += 1;
      continue;
    }

    try {
      const lead = scoreLead(leadFromTender(row), "ru");
      const requestNo = newRequestNo(now);
      const leadId = await saveLead(lead, [], "scout", { requestNo, origin: { source: "scout" } });
      if (!leadId) throw new Error("лид не записался");
      await db.from("scout_tenders").update({ lead_id: leadId }).eq("id", row.id);
      await routeNewLead({
        leadId,
        lead,
        requestNo,
        heading: tenderHeading(row),
        origin: { source: "scout" },
        fallback: await salesRecipients(),
      });
      report.leads += 1;
    } catch (err) {
      // Лид не записался — лот вернётся в следующий проход.
      await db.from("scout_tenders").update({ lead_at: null }).eq("id", row.id).is("lead_id", null);
      report.errors.push(`${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return report;
}
