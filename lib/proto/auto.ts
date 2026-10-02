/**
 * Прототип заранее — для касания, без человека.
 *
 * Владелец, 02.10.2026: «Давай пункт 1, максимально автоматизируй его» —
 * компаниям из пула касаний с худшими сайтами заранее собирать прототипы и
 * отправлять в касании ссылку вместо обещания. Готовая страница со своим
 * бизнесом продаёт лучше любого текста: «соберём за 12 часов» человек
 * должен представить, а ссылку он открывает и видит.
 *
 * Зовётся из подготовки письма (prepareOutreach), то есть там же, где сайт
 * и так разбирают, — фоном для порции дня и потока и по кнопке «Связаться».
 * Собрался — ссылка ложится в касание (prospects.proto_url), и письмо даёт
 * её вместо обещания. Не собрался — письмо остаётся прежним: «соберём за 12
 * часов», и прототип собирает человек, как раньше (prototype-claim).
 *
 * Попытка одна на касание. Причина та же, что у писем порции: страница,
 * которая не сложилась с первого раза, не сложится и с десятого, а каждая
 * попытка — обход сайта и вызов модели. Кроме отказа самой модели (кончились
 * деньги, ключ, частота): это не страница, а состояние, и попытка
 * возвращается.
 *
 * Что попадает на страницу — по правилам proto-master: только то, что
 * компания сказала о себе сама. Название, описание, контакты, логотип и
 * снимки снимает наш аудитор (collectFacts), услуги выбирает модель, но
 * каждая сверяется со страницей дословно (lib/proto/services). Дальше —
 * та же проверка готовой страницы, что у прототипа из панели: с претензией
 * прототип остаётся черновиком и наружу не уходит.
 */
import type Anthropic from "@anthropic-ai/sdk";

import { protoNicheFor, type ProtoLocale } from "@/content/proto/models";
import { effortFor } from "@/lib/model-limits";
import type { AutoNote } from "@/lib/proto/auto-note";
import { anthropic } from "@/lib/model-road";
import { modelTrouble } from "@/lib/model-trouble";
import { collectFacts } from "@/lib/proto/collect";
import {
  AUTO_SERVICES_MIN,
  SERVICES_SYSTEM,
  SERVICES_TOOL,
  autoName,
  servicesPrompt,
  verifiedServices,
} from "@/lib/proto/services";
import { protoUrl, saveProto } from "@/lib/proto/store";
import { serviceClient } from "@/lib/supabase";

/** Своя переменная, как у писем: разбор страницы проще письма, и модель можно взять дешевле. */
const MODEL = process.env.PROTO_MODEL || process.env.OUTREACH_MODEL || "claude-sonnet-5";


export type AutoProto = { url: string } | { url: null; note: AutoNote | "tried" | "no_site" };

export async function autoPrototype(input: {
  prospect: {
    id: string;
    url: string | null;
    host: string | null;
    label: string | null;
    niche: string | null;
    proto_url?: string | null;
  };
  /** Ниша по разбору сайта — слаг классификатора. Точнее той, что пришла с карт. */
  siteNiche: string | null;
  /** Язык сайта по обходу. Прототип — на нём же; английский сайт получает русский. */
  lang: "ru" | "uz" | "en";
}): Promise<AutoProto> {
  const { prospect } = input;
  if (prospect.proto_url) return { url: prospect.proto_url };
  if (!prospect.url || !prospect.host) return { url: null, note: "no_site" };

  const db = serviceClient();
  if (!db) return { url: null, note: "failed" };

  // Попытка одна — и отметка первой, условно: фон и кнопка «Связаться» могут
  // взяться за одну компанию в одну минуту.
  const { data: claimed } = await db
    .from("prospects")
    .update({ proto_tried_at: new Date().toISOString() })
    .eq("id", prospect.id)
    .is("proto_tried_at", null)
    .select("id");
  if (!claimed?.length) return { url: null, note: "tried" };

  const done = async (note: AutoNote): Promise<AutoProto> => {
    await db.from("prospects").update({ proto_note: note }).eq("id", prospect.id);
    return { url: null, note };
  };

  const niche = protoNicheFor(input.siteNiche) ?? protoNicheFor(prospect.niche);
  if (!niche) return done("niche");

  const locale: ProtoLocale = input.lang === "uz" ? "uz" : "ru";
  const collected = await collectFacts({ url: prospect.url, niche: niche.key, locale });
  if ("error" in collected) return done("collect");

  let picked: { name: string | null; services: { name?: unknown; price?: unknown }[] };
  try {
    const response = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [{ type: "text" as const, text: SERVICES_SYSTEM, cache_control: { type: "ephemeral" as const } }],
      messages: [
        {
          role: "user" as const,
          content: servicesPrompt({ host: prospect.host, niche: niche.ru, text: collected.text, locale }),
        },
      ],
      tools: [SERVICES_TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: SERVICES_TOOL.name },
      ...effortFor(MODEL, "low"),
    });
    const block = response.content.find((b) => b.type === "tool_use");
    const raw = (block && block.type === "tool_use" ? block.input : {}) as { name?: unknown; services?: unknown };
    picked = {
      name: typeof raw.name === "string" ? raw.name : null,
      services: Array.isArray(raw.services) ? (raw.services as { name?: unknown; price?: unknown }[]) : [],
    };
  } catch (error) {
    if (modelTrouble(error)) {
      // Отказ модели на входе — не страница, а состояние: попытку
      // возвращаем, следующая подготовка письма попробует снова.
      await db.from("prospects").update({ proto_tried_at: null }).eq("id", prospect.id);
      return { url: null, note: "model" };
    }
    console.error("прототип заранее: модель не разобрала", prospect.host, error instanceof Error ? error.message : error);
    return done("model");
  }

  const services = verifiedServices(picked.services, collected.text);
  if (services.length < AUTO_SERVICES_MIN) return done("services");

  const name = autoName({ label: prospect.label, model: picked.name, title: collected.title, page: collected.text });
  if (!name) return done("name");

  const saved = await saveProto({
    facts: { ...collected.facts, name, services },
    prospectId: prospect.id,
    auto: true,
  });
  if (!saved.ok) return done(saved.why === "missing" ? "missing" : "failed");
  if (saved.problems.length) return done("draft");

  const url = protoUrl(saved.proto.token);
  await db.from("prospects").update({ proto_url: url, proto_note: null }).eq("id", prospect.id);
  return { url };
}
