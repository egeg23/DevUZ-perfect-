"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireStaff } from "@/lib/admin/guard";
import { shootableCodes } from "@/lib/razbor/evidence";
import {
  publish,
  razborById,
  reject,
  remove,
  saveArticles,
  unpublish,
  type RazborArticle,
  type RazborPaths,
} from "@/lib/razbor/store";

/**
 * Публикует и отклоняет только владелец.
 *
 * Разбор выходит под именем студии и критикует чужую работу. Решение
 * «это можно показывать» — не редакторская мелочь, а то, за что потом
 * отвечает владелец лично, поэтому право проверяется здесь, а не тем, что
 * кнопку кому-то не видно.
 */
async function owner() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  return staff;
}

/**
 * Сбросить кэш страниц, которых касается изменение.
 *
 * Это половина ответа на «нажал опубликовать, а ничего не появилось».
 * Вторая половина была в самом маршруте разбора, который до этого знал
 * только адреса, известные на сборке. Здесь — список того, что показывает
 * разбор читателю: сам разбор на двух языках, оба списка раздела и карта
 * сайта, по которой за ним придёт поисковик.
 */
function refresh(paths: RazborPaths | null): void {
  revalidatePath("/admin/razbor");
  if (!paths) return;

  revalidatePath(paths.ru);
  revalidatePath(paths.uz);
  revalidatePath("/ru/razbor");
  revalidatePath("/uz/razbor");
  revalidatePath("/sitemap.xml");
}

export async function publishAction(formData: FormData) {
  const staff = await owner();
  const id = String(formData.get("razbor") ?? "");

  const result = await publish(id);
  await record("razbor.published", {
    actorStaffId: staff.id,
    targetType: "razbor",
    targetId: id,
    ip: await requestIp(),
    meta: { ok: result.ok },
  });

  refresh(result.ok ? result.paths : null);
  redirect(result.ok ? "/admin/razbor?r=ok" : `/admin/razbor?r=${encodeURIComponent(result.why)}`);
}

export async function rejectAction(formData: FormData) {
  const staff = await owner();
  const id = String(formData.get("razbor") ?? "");
  const why = String(formData.get("reason") ?? "");

  const paths = await reject(id, why);
  await record("razbor.rejected", {
    actorStaffId: staff.id,
    targetType: "razbor",
    targetId: id,
    ip: await requestIp(),
    meta: { reason: why.slice(0, 200) },
  });

  refresh(paths);
  redirect("/admin/razbor");
}

/** Снять с публикации: страница уходит с сайта, разбор остаётся в истории. */
export async function unpublishAction(formData: FormData) {
  const staff = await owner();
  const id = String(formData.get("razbor") ?? "");

  const paths = await unpublish(id);
  await record("razbor.unpublished", {
    actorStaffId: staff.id,
    targetType: "razbor",
    targetId: id,
    ip: await requestIp(),
    meta: {},
  });

  refresh(paths);
  redirect("/admin/razbor?r=снят с публикации");
}

/**
 * Удаление требует слова «удалить» в поле рядом.
 *
 * Не из любви к обрядам: удаление сносит и отпечаток адреса, то есть
 * возвращает разобранный сайт в очередь ночной смены. Такое не должно
 * случаться от промаха мимо соседней кнопки.
 */
export async function deleteAction(formData: FormData) {
  const staff = await owner();
  const id = String(formData.get("razbor") ?? "");
  const confirm = String(formData.get("confirm") ?? "").trim().toLowerCase();

  if (confirm !== "удалить") {
    redirect(`/admin/razbor?r=${encodeURIComponent("Чтобы удалить, впишите рядом слово «удалить».")}`);
  }

  const paths = await remove(id);
  await record("razbor.deleted", {
    actorStaffId: staff.id,
    targetType: "razbor",
    targetId: id,
    ip: await requestIp(),
    meta: {},
  });

  refresh(paths);
  redirect("/admin/razbor?r=удалён");
}

/**
 * Абзацы из текстового поля.
 *
 * Разделитель — пустая строка, а не перевод строки: абзац разбора живёт
 * длиной в несколько предложений, и автоперенос в поле не должен резать его
 * на куски.
 */
function paragraphs(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Находки из формы.
 *
 * Поля пронумерованы, пустой заголовок означает «этой находки больше нет» —
 * так удаляется находка и так же добавляется новая в пустых полях внизу.
 *
 * Код выбирается списком: он привязывает к находке снимок того места на
 * сайте, о котором она говорит. Присланный код сверяется со списком, а не
 * берётся как есть, — форма приходит из браузера, то есть из рук кого
 * угодно, и чужой код поставил бы под находкой снимок другого места с
 * уверенной подписью из правил.
 */
function findingsFrom(formData: FormData, locale: "ru" | "uz") {
  const known = new Set(shootableCodes());
  const out: { code?: string; title: string; impact: string; fix: string }[] = [];

  for (let i = 0; i < 40; i++) {
    const title = String(formData.get(`${locale}.finding.${i}.title`) ?? "").trim();
    if (!title) continue;
    const code = String(formData.get(`${locale}.finding.${i}.code`) ?? "").trim();
    out.push({
      ...(known.has(code) ? { code } : {}),
      title,
      impact: String(formData.get(`${locale}.finding.${i}.impact`) ?? "").trim(),
      fix: String(formData.get(`${locale}.finding.${i}.fix`) ?? "").trim(),
    });
  }

  return out;
}

function articleFrom(formData: FormData, locale: "ru" | "uz", previous: RazborArticle): RazborArticle {
  return {
    title: String(formData.get(`${locale}.title`) ?? "").trim(),
    description: String(formData.get(`${locale}.description`) ?? "").trim(),
    // Подпись и запрос собирает код из ниши и города — руками их не трогаем.
    // Запрос задаёт адрес страницы, а адрес опубликованного разбора уже
    // стоит в поиске.
    label: previous.label,
    query: previous.query,
    intro: paragraphs(formData.get(`${locale}.intro`)),
    findings: findingsFrom(formData, locale),
    outcome: paragraphs(formData.get(`${locale}.outcome`)),
    price: previous.price,
  };
}

export async function saveAction(formData: FormData) {
  const staff = await owner();
  const id = String(formData.get("razbor") ?? "");

  const row = await razborById(id);
  if (!row || !row.ru || !row.uz) {
    redirect(`/admin/razbor?r=${encodeURIComponent("Разбора уже нет или он без статьи.")}`);
  }

  const next = {
    ru: articleFrom(formData, "ru", row.ru),
    uz: articleFrom(formData, "uz", row.uz),
  };

  // Пустой заголовок или меньше трёх находок — это уже не разбор. Проверка
  // здесь, а не в браузере: `required` на поле обходится, серверное действие
  // — нет.
  const thin = (["ru", "uz"] as const).find(
    (locale) => !next[locale].title || next[locale].findings.length < 3,
  );
  if (thin) {
    redirect(
      `/admin/razbor/${id}?r=${encodeURIComponent(
        `Версия «${thin}»: нужен заголовок и хотя бы три находки.`,
      )}`,
    );
  }

  const result = await saveArticles(id, next);
  await record("razbor.edited", {
    actorStaffId: staff.id,
    targetType: "razbor",
    targetId: id,
    ip: await requestIp(),
    meta: { ok: result.ok },
  });

  if (!result.ok) redirect(`/admin/razbor/${id}?r=${encodeURIComponent(result.why)}`);

  refresh(result.paths);
  revalidatePath(`/admin/razbor/${id}`);
  redirect("/admin/razbor?r=правка сохранена");
}
