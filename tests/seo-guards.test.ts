import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import robots from "@/app/robots";
import { products } from "@/content/products";
import { organizationSchema, productSchema } from "@/lib/schema";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Решение, которое легко отменить по ошибке, приняв за недосмотр.
 *
 * `disallow: /admin` в robots.txt выглядит как забытая мера безопасности, и
 * первый же человек, проверяющий сайт по чеклисту, её «вернёт». На деле она
 * работает ровно наоборот: robots.txt публичен, его открывает кто угодно, и
 * строка в нём — единственное место во всём проекте, которое сообщает
 * постороннему, что панель вообще существует. Закрывают её две другие меры,
 * не рассказывающие ничего: noindex в метаданных и X-Robots-Tag.
 */
test("robots.txt не сообщает о существовании панели", () => {
  for (const rule of robots().rules as { disallow?: string | string[] }[]) {
    const disallow = [rule.disallow ?? []].flat();
    for (const path of disallow) {
      assert.ok(
        !path.includes("admin"),
        `robots.txt снова указывает на ${path} — это указатель, а не защита`,
      );
    }
  }
});

test("служебные маршруты из выдачи всё же закрыты", () => {
  // Обратная сторона: убирая /admin, легко вычистить и /api/, который
  // закрывать как раз надо — он публичен и не является указателем.
  for (const rule of robots().rules as { disallow?: string | string[] }[]) {
    assert.ok([rule.disallow ?? []].flat().includes("/api/"), "/api/ открыт для индексации");
  }
});

/**
 * Заголовки панели проверяются по конфигу, а не по живому ответу: поднять
 * ради этого сборку Next в юнит-тесте дороже, чем сам тест. Живой ответ
 * сверялся отдельно — curl по /admin, /admin/team и /admin/login на
 * собранном приложении отдаёт оба заголовка, включая 307-редирект, куда
 * мета-тег noindex не попадает вовсе.
 */
test("панель закрыта заголовками, а не только мета-тегом", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const code = config.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  assert.match(code, /X-Robots-Tag/, "X-Robots-Tag пропал из next.config.ts");
  assert.match(code, /noindex/, "X-Robots-Tag больше не запрещает индексацию");
  assert.match(code, /no-store/, "Cache-Control: no-store пропал — панель осядет в кэше браузера");
  assert.match(code, /source:\s*"\/admin"/, "правило для самого /admin пропало");
  assert.match(code, /source:\s*"\/admin\/:path\*"/, "правило для вложенных страниц панели пропало");
});

/* ── Разметка товара: то, на что ругается Google ─────────────────────────── */

test("бренд товара — объект с именем, а не ссылка на узел", () => {
  // Проверка Google отвечала «недопустимый тип объекта в поле brand»: она
  // ждёт тип Brand с текстовым name и по `@id` в соседний блок разметки не
  // ходит, хотя ссылка синтаксически верна.
  const schema = productSchema(products[0], "ru") as Record<string, unknown>;
  const brand = schema.brand as Record<string, unknown>;

  assert.equal(brand["@type"], "Brand");
  assert.ok(typeof brand.name === "string" && brand.name.length > 1);
  assert.ok(!("@id" in brand), "бренд снова ссылкой — проверка Google её не примет");
});

test("условия возврата стоят у организации и совпадают с офертой", () => {
  // Google просит общую политику магазина у организации, а у товара — только
  // если у конкретного товара условия свои. У нас они общие.
  const org = organizationSchema("ru") as Record<string, unknown>;
  const policy = org.hasMerchantReturnPolicy as Record<string, unknown>;

  assert.equal(policy["@type"], "MerchantReturnPolicy");
  // «Возврат не предусмотрен» — то же, что написано в разделе 6 оферты:
  // вернуть переданный исходный код так, чтобы он перестал быть у
  // покупателя, невозможно.
  assert.equal(policy.returnPolicyCategory, "https://schema.org/MerchantReturnNotPermitted");
  assert.deepEqual(policy.applicableCountry, ["UZ", "KZ", "RU"]);
  assert.equal(policy.merchantReturnLink, "https://devuz.studio/ru/offer");

  // Ссылка обязана вести на живой раздел, а не в никуда.
  assert.ok(
    read("app/[locale]/offer/page.tsx").length > 0,
    "оферты нет, а разметка на неё ссылается",
  );
});

test("у оффера товара остаётся цена, валюта и наличие", () => {
  // Правка бренда не должна была задеть то, ради чего разметка и стоит:
  // цену в выдаче.
  const offers = (productSchema(products[0], "ru") as Record<string, unknown>).offers as Record<
    string,
    unknown
  >;
  assert.equal(offers.priceCurrency, "USD");
  assert.ok(offers.price !== undefined || offers.lowPrice !== undefined);
});
