import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
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

test("картинка товара объявляется, только когда она есть", () => {
  // Google считает image обязательным для карточки товара — но картинка
  // обязана показывать товар. У продукта без живого экземпляра снимать
  // нечего, и общая обложка студии на его месте была бы разметкой,
  // разошедшейся со страницей.
  for (const product of products) {
    const schema = productSchema(product, "ru") as Record<string, unknown>;
    if (!product.shots?.length) {
      assert.ok(!("image" in schema), `${product.slug}: обещает картинку, которой нет`);
      continue;
    }

    const images = schema.image as string[];
    assert.equal(images.length, product.shots.length);
    for (const url of images) {
      assert.match(url, /^https:\/\/devuz\.studio\/products\//, `странный адрес картинки: ${url}`);
    }
  }
});

test("снимки товара лежат на диске и с теми же размерами", () => {
  // Размеры проставляет скрипт съёмки из самого файла. Разойдутся — страница
  // будет дёргаться при загрузке, а это Google меряет отдельной метрикой.
  for (const product of products) {
    for (const shot of product.shots ?? []) {
      const file = new URL(`public${shot.src}`, ROOT);
      assert.ok(statSync(file).isFile(), `${shot.src}: файла нет`);
      assert.ok(shot.width > 0 && shot.height > 0, `${shot.src}: размеры не проставлены`);
      // Файлы лежат в репозитории — мегабайтные снимки сюда класть нельзя.
      assert.ok(statSync(file).size < 700_000, `${shot.src}: тяжелее 700 КБ`);
      for (const locale of ["ru", "en", "uz", "zh"] as const) {
        assert.ok(shot.caption[locale]?.trim().length > 10, `${shot.src}: нет подписи на «${locale}»`);
      }
    }
  }
});

test("снимок, объявленный поисковику, показан и человеку", () => {
  // Картинка в разметке, которой нет на странице, — это расхождение
  // разметки со страницей, и ловит его не тест, а ручная проверка Google.
  assert.match(read("app/[locale]/products/[slug]/page.tsx"), /product\.shots\?\.length \? \(/);
  assert.match(read("app/[locale]/products/page.tsx"), /product\.shots\?\.\[0\] \? \(/);
});

/* ── Подтверждение прав на сайт файлом в корне ───────────────────────────── */

test("файл подтверждения Яндекса лежит в корне и не пуст", () => {
  const file = read("public/yandex_c0ff92419282bda3.html");
  assert.match(file, /Verification: c0ff92419282bda3/);
});

test("файл подтверждения не уезжает в языковой редирект", () => {
  // Каждая страница сайта живёт под префиксом локали, и middleware уводит
  // туда всё, чего нет в списке исключений. Файл подтверждения прав —
  // `yandex_<код>.html` у Яндекса, `google<код>.html` у Google — обязан
  // отдаваться ровно из корня: робот идёт по точному адресу и редирект
  // считает отсутствием файла.
  const source = read("middleware.ts");
  const quoted = source.match(/matcher: \[\s*("(?:[^"\\]|\\.)*")/);
  assert.ok(quoted, "не нашёл матчер — проверка бессмысленна");

  const matcher = new RegExp(`^${JSON.parse(quoted[1]) as string}$`);
  const caught = (path: string) => matcher.test(path);

  // Эти адреса middleware пропускает мимо себя.
  for (const path of [
    "/yandex_c0ff92419282bda3.html",
    "/google1234567890abcdef.html",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    assert.equal(caught(path), false, `${path}: уедет в языковой редирект`);
  }

  // А эти обязан перехватывать — иначе сломается сам сайт.
  for (const path of ["/", "/about", "/ru", "/ru/products"]) {
    assert.equal(caught(path), true, `${path}: перестал получать локаль`);
  }
});
