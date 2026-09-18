"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { protoNicheByKey } from "@/content/proto/models";
import { requireStaff } from "@/lib/admin/guard";
import { collectFacts } from "@/lib/proto/collect";
import { parseServices } from "@/lib/proto/form";
import { markSent, saveProto } from "@/lib/proto/store";

/**
 * Сборка прототипа из панели.
 *
 * Прототип собирает менеджер, а не владелец: он только что провёл первичку и
 * знает, чем компания занимается на самом деле. Поэтому список услуг — поле
 * формы, а не догадка машины: под `<h2>` на живом сайте лежит и «Наши
 * услуги», и «шиномонтаж круглосуточно ташкент», и разобрать это может
 * только тот, кто говорил с владельцем.
 *
 * Всё остальное — название, описание, телефон, мессенджеры, логотип —
 * снимается с его сайта нашим же аудитором. Поля перебивки существуют для
 * случая, когда на сайте этого нет или аудитор ошибся.
 */

function back(message: string): never {
  redirect(`/admin/proto?r=${encodeURIComponent(message)}`);
}

function field(form: FormData, name: string): string | null {
  const value = String(form.get(name) ?? "").trim();
  return value ? value : null;
}

export async function buildAction(formData: FormData) {
  const staff = await requireStaff();

  const url = field(formData, "url");
  const niche = String(formData.get("niche") ?? "");
  const services = parseServices(String(formData.get("services") ?? ""));

  if (!url) back("Не указан сайт клиента");
  if (!protoNicheByKey(niche)) back("Не выбрана ниша");
  if (services.length < 3) back("Нужно хотя бы три услуги — по одной в строке");

  const collected = await collectFacts({
    url,
    niche,
    locale: String(formData.get("locale") ?? "ru") === "uz" ? "uz" : "ru",
  });
  if ("error" in collected) back(`Сайт не разобрался: ${collected.error}`);

  // Перебивки поверх того, что нашёл аудитор. Пустое поле ничего не затирает:
  // «не заполнил» и «хочу стереть» — разные намерения, и второе на этой форме
  // не нужно.
  const facts = {
    ...collected.facts,
    services,
    name: field(formData, "name") ?? collected.facts.name,
    city: field(formData, "city") ?? collected.facts.city,
    about: field(formData, "about") ?? collected.facts.about,
    hours: field(formData, "hours") ?? collected.facts.hours,
    address: field(formData, "address") ?? collected.facts.address,
    phone: field(formData, "phone") ?? collected.facts.phone,
    telegram: field(formData, "telegram") ?? collected.facts.telegram,
    whatsapp: field(formData, "whatsapp") ?? collected.facts.whatsapp,
  };

  const saved = await saveProto({ facts, by: staff, prospectId: field(formData, "prospect") });
  if (!saved.ok) back(saved.why);

  revalidatePath("/admin/proto");
  if (saved.problems.length) {
    back(`Собрано, но отправлять нельзя: ${saved.problems.map((problem) => problem.text).join(" ")}`);
  }
  redirect("/admin/proto?r=ok");
}

/** Прототип ушёл клиенту. Отмечает тот, кто отправил, — по нему и считаем. */
export async function sentAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("proto") ?? "");

  const token = await markSent(id, staff);
  revalidatePath("/admin/proto");
  if (!token) back("Отправить можно только готовый прототип");
  redirect("/admin/proto?r=ok");
}
