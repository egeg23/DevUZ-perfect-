import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import robots from "@/app/robots";

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
