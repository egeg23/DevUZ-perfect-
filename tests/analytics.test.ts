import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Где стоит счётчик — и, что важнее, где он не стоит.
 */

test("тег Google отдаётся ровно так, как его описывает Google", () => {
  const source = read("components/layout/analytics.tsx");

  assert.match(source, /googletagmanager\.com\/gtag\/js\?id=\$\{ga\}/);
  assert.match(source, /gtag\('js',new Date\(\)\)/);
  assert.match(source, /gtag\('config',\$\{JSON\.stringify\(ga\)\}\)/);

  // Идентификатора нет — не рисуем ничего. Лишние запросы к Google с
  // машины разработчика никому не нужны, а «пустой» config засоряет отчёт.
  assert.match(source, /if \(!ym && !ga\) return null;/);
});

test("счётчика нет в панели и в прототипах клиентов", () => {
  // Это не про аккуратность, а про чужие данные. В адресах панели стоят
  // идентификаторы лидов и заказов — `/admin/leads/<id>`, `/proto/<token>`.
  // Счётчик отправляет адрес страницы в Google как есть, то есть вместе с
  // ними. Публичные страницы таких адресов не имеют.
  const mounted: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(new URL(dir, ROOT), { withFileTypes: true })) {
      const next = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (entry.name.endsWith(".tsx") && read(next).includes("<Analytics")) mounted.push(next);
    }
  };
  walk("app");

  assert.deepEqual(mounted, ["app/[locale]/layout.tsx"], "счётчик появился там, где его быть не должно");
});

test("переменная счётчика объявлена во всех трёх местах", () => {
  // NEXT_PUBLIC_ вшивается на сборке: забыть её в аргументах образа значит
  // получить пустой тег на боевом сайте при заполненном .env.
  assert.match(read(".env.example"), /^NEXT_PUBLIC_GA_ID=/m);
  assert.match(read("docker-compose.yml"), /NEXT_PUBLIC_GA_ID/);
  assert.match(read("scripts/vps-deploy.sh"), /--build-arg "NEXT_PUBLIC_GA_ID=/);
  assert.match(read("Dockerfile"), /ARG NEXT_PUBLIC_GA_ID/);
});

test("счётчик Метрики отдаётся ровно так, как его описывает Яндекс", () => {
  const source = read("components/layout/analytics.tsx");

  // Номер стоит и в адресе tag.js, и в вызове init. В сниппете Яндекса он
  // в обоих местах, и проверка дедупликации внутри сниппета сравнивает
  // именно src с номером: без него второй счётчик на странице не отсеется.
  assert.match(source, /metrika\/tag\.js\?id=\$\{ym\}/);
  assert.match(source, /ym\(\$\{ym\}, "init"/);

  for (const option of [
    "ssr:true",
    "webvisor:true",
    "clickmap:true",
    'ecommerce:"dataLayer"',
    "referrer: document.referrer",
    "url: location.href",
    "accurateTrackBounce:true",
    "trackLinks:true",
  ]) {
    assert.ok(source.includes(option), `в init не хватает ${option}`);
  }

  // Номер уходит в код числом, а не строкой: сниппет Яндекса пишет его
  // числом, и проверять на боевом, принимает ли Метрика строку, поздно.
  assert.ok(
    !source.includes("JSON.stringify(ym)"),
    "номер счётчика снова уходит строкой",
  );
  assert.match(
    source,
    /\/\^\\d\+\$\/\.test\(raw\)/,
    "пропала проверка на цифры — опечатка в окружении соберёт сломанный вызов",
  );

  // Пиксель для выключенного JavaScript. Через <Script> его поставить
  // нельзя по определению: Script — это и есть JavaScript.
  assert.match(source, /<noscript>/);
  assert.match(source, /mc\.yandex\.ru\/watch\/\$\{ym\}/);
});

test("переходы внутри сайта считаются, а входная страница не дважды", () => {
  const source = read("components/layout/metrika-hits.tsx");

  // Сайт ходит по <Link>: адрес меняет история браузера, перезагрузки нет,
  // и счётчик, вставленный по инструкции, посчитал бы одну страницу за
  // визит. В отчётах это сайт из одной страницы с нулевой глубиной.
  assert.match(source, /usePathname/);
  assert.match(source, /window\.ym\?\.\(id, "hit", window\.location\.href\)/);

  // Первый хит пропускается: его уже отправил init с url: location.href.
  assert.match(source, /counted\.current/);

  // useSearchParams на заранее собранной странице переводит дерево до
  // ближайшего Suspense в клиентский рендер. Ради параметров адреса,
  // которых на публичных страницах нет, это отдало бы статику всего сайта.
  // Ищем вызов, а не слово: про useSearchParams в файле написано, почему
  // его здесь нет, и проверка по слову падала бы на собственном объяснении.
  assert.ok(
    !/useSearchParams\s*\(/.test(source) && !/import\s*\{[^}]*useSearchParams/.test(source),
    "useSearchParams в корневом макете снимает статику с публичных страниц",
  );

  assert.match(read("components/layout/analytics.tsx"), /<MetrikaHits id=\{Number\(ym\)\}/);
});

test("переменная Метрики объявлена во всех четырёх местах", () => {
  assert.match(read(".env.example"), /^NEXT_PUBLIC_YANDEX_METRIKA_ID=/m);
  assert.match(read("docker-compose.yml"), /NEXT_PUBLIC_YANDEX_METRIKA_ID/);
  assert.match(read("scripts/vps-deploy.sh"), /--build-arg "NEXT_PUBLIC_YANDEX_METRIKA_ID=/);
  assert.match(read("Dockerfile"), /ARG NEXT_PUBLIC_YANDEX_METRIKA_ID/);
});
