import { clientIp, rateLimit } from "@/lib/qualify/limiter";
import { isLocale, type Locale } from "@/lib/i18n";
import { saveLead } from "@/lib/qualify/store";
import { detectContactKind, sendLead } from "@/lib/qualify/telegram";
import { newRequestNo } from "@/lib/qualify/engine";
import { scoreLead } from "@/lib/qualify/scoring";
import type { QualifyToolInput } from "@/lib/qualify/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Обычная форма — запасной путь, когда чат недоступен или человек просто не
 * хочет разговаривать с ботом.
 *
 * Квалификации здесь нет и не должно быть: выдумывать грейды по трём полям
 * формы значит отправить менеджеру уверенную ложь. Поэтому все категории
 * выставлены в худшие, а в резюме прямо написано, что лид пришёл формой и
 * не квалифицирован.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`lead:${clientIp(request)}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Ловушка для ботов: поле скрыто в разметке, человек его не заполнит.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true });
  }

  const text = (value: unknown, max = 500) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const name = text(body.name, 120);
  const contact = text(body.contact, 200);
  const message = text(body.message, 1500);
  const locale: Locale = isLocale(body.locale as string) ? (body.locale as Locale) : "ru";

  if (!contact) {
    return Response.json({ error: "contact_required" }, { status: 400 });
  }

  const unqualified = "не выяснено — лид пришёл через форму, без диалога";

  /**
   * Заготовка первого сообщения для лида из формы.
   *
   * Диалога не было, поэтому она короткая и без предположений о задаче:
   * менеджеру нужно с чего-то начать, но выдуманный контекст в первой же
   * фразе хуже, чем его отсутствие. Текст — на языке, на котором посетитель
   * смотрел сайт: писать ему на другом значит начать с неудобства.
   */
  const openers: Record<Locale, string> = {
    ru: `Здравствуйте${name ? ", " + name : ""}! Меня зовут [имя], я из студии DevUz — вы оставили заявку у нас на сайте. Расскажите, пожалуйста, чуть подробнее о задаче: чем занимается компания и что нужно сделать?`,
    en: `Hello${name ? " " + name : ""}! I'm [name] from DevUz Studio — you left a request on our site. Could you tell me a bit more about the project: what does your company do and what needs building?`,
    uz: `Assalomu alaykum${name ? ", " + name : ""}! Men DevUz studiyasidan [ism] — siz saytimizda ariza qoldirgansiz. Iltimos, vazifa haqida biroz batafsilroq aytib bering: kompaniyangiz nima bilan shug‘ullanadi va nima qilish kerak?`,
    zh: `您好${name ? "，" + name : ""}！我是 DevUz Studio 的 [姓名]，您在我们网站留了咨询。能否再多说一些项目情况：贵公司主要做什么，需要开发什么？`,
  };

  const input: QualifyToolInput = {
    contact_name: name,
    company: "",
    contact_handle: contact,
    contact_kind: detectContactKind(contact),
    niche: unqualified,
    niche_tier: 3,
    expertise: "low",
    services: [],
    budget: "B3",
    authority: "A3",
    need: "N3",
    timing: "T3",
    intent: "needs_human",
    summary: {
      client: name || "имя не указано",
      request: message || "текст задачи не указан",
      niche: unqualified,
      expertise: unqualified,
      budget: unqualified,
      authority: unqualified,
      need: unqualified,
      timing: unqualified,
    },
    notes:
      "Заявка из формы, а не из чата. Квалификации нет — грейды выставлены в худшие по умолчанию, а не выяснены. Разговор надо начинать с BANT.",
    opening_line: openers[locale],
    already_told: [],
    avoid_asking: [],
  };

  const lead = scoreLead(input, locale);

  // Номер получает и заявка из формы. Иначе у отдела продаж две породы
  // лидов: одни адресуются номером, другие — «тот, который вчера вечером».
  const requestNo = newRequestNo();

  let leadId: string | null = null;
  try {
    leadId = await saveLead(lead, [], "form", { requestNo });
  } catch (error) {
    console.error("saveLead form", error);
  }

  const delivered = await sendLead(lead, [], leadId ?? "unsaved", requestNo);

  // Если и база, и Telegram недоступны — заявка потеряна, и врать об успехе
  // нельзя: человек должен увидеть подсказку написать напрямую.
  if (!delivered && !leadId) {
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }

  return Response.json({ ok: true });
}
