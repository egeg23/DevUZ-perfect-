import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { siteUrl } from "@/lib/seo";

/**
 * Переезд на devuz.studio.
 *
 * Имён у сайта пять, а сайт один. Ошибиться здесь можно четырьмя способами,
 * и каждый стоит недель выдачи, притом что снаружи всё выглядит рабочим:
 *
 *  1. канонический адрес в коде и в nginx разъезжаются — Google видит два
 *     сайта вместо одного;
 *  2. неканоническое имя отдаёт содержимое вместо редиректа — это уже
 *     зеркало, и вес делится между адресами;
 *  3. редирект ведёт на главную вместо той же страницы — Google читает это
 *     как «страницы больше нет», а не «страница переехала»;
 *  4. у блока `listen 443 ssl` нет строки сертификата — nginx не стартует
 *     вовсе, и сайт ложится целиком.
 *
 * Ни одно из четырёх не ловится типами, поэтому проверяется по файлам.
 */

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

const CANONICAL = "devuz.studio";
const ALIASES = ["www.devuz.studio", "devuz.work", "www.devuz.work", "devuz.maximov-tech.ru"];

/** Тела server-блоков конфига — по балансу скобок, а не по разрыву строк. */
function serverBlocks(conf: string): string[] {
  const out: string[] = [];
  let at = 0;

  for (;;) {
    const start = conf.indexOf("server {", at);
    if (start < 0) break;

    let depth = 0;
    let i = conf.indexOf("{", start);
    const from = i;
    for (; i < conf.length; i++) {
      if (conf[i] === "{") depth++;
      else if (conf[i] === "}" && --depth === 0) break;
    }
    out.push(conf.slice(from, i));
    at = i;
  }

  return out;
}

const nginx = read("deploy/nginx-devuz.conf");
const blocks = serverBlocks(nginx);

/** Блок с этим именем в server_name, слушающий 443. */
function secureBlockFor(name: string): string | null {
  return (
    blocks.find(
      (b) =>
        /listen\s+443\s+ssl/.test(b) &&
        new RegExp(`server_name[^;]*(^|\\s)${name.replace(/\./g, "\\.")}(\\s|;)`, "m").test(b),
    ) ?? null
  );
}

test("канонический адрес в коде и в nginx — один и тот же", () => {
  assert.equal(siteUrl, `https://${CANONICAL}`);

  const serving = secureBlockFor(CANONICAL);
  assert.ok(serving, "нет блока 443 для канонического имени");
  // Канонический блок отдаёт сайт, а не редирект.
  assert.match(serving, /proxy_pass/, "канонический блок ничего не отдаёт");
  assert.ok(
    !/^\s*return 301/m.test(serving),
    "канонический адрес сам отвечает редиректом — на сайт не попасть",
  );
});

test("неканонические имена отвечают редиректом, а не содержимым", () => {
  for (const alias of ALIASES) {
    const block = secureBlockFor(alias);
    assert.ok(block, `${alias} не обслуживается по 443 — будет предупреждение браузера`);
    assert.ok(
      !/proxy_pass/.test(block),
      `${alias} отдаёт содержимое: это зеркало, а зеркало делит вес сайта`,
    );
  }
});

test("редирект постраничный и постоянный", () => {
  const block = secureBlockFor("devuz.work");
  assert.ok(block);

  // $request_uri сохраняет путь. Свалить всё на главную значит сказать
  // Google «страницы больше нет» вместо «страница переехала».
  assert.match(block, new RegExp(`return 301 https://${CANONICAL}\\$request_uri;`));
  assert.ok(
    !/return 302/.test(block),
    "временный редирект — Google держал бы старый адрес в индексе месяцами",
  );
});

test("старый домен продолжает отвечать", () => {
  // Отключить его до переиндексации значит оборвать единственную связь
  // накопленного с новым доменом.
  assert.ok(secureBlockFor("devuz.maximov-tech.ru"), "старый домен выпал из конфига");
});

test("у каждого блока с ssl есть место под сертификат", () => {
  const anchor = "# ssl_certificate и ssl_certificate_key сюда допишет certbot.";
  const secure = blocks.filter((b) => /listen\s+443\s+ssl/.test(b));

  assert.ok(secure.length >= 2, "блоков с ssl стало меньше двух");
  for (const block of secure) {
    assert.ok(
      block.includes(anchor),
      "блок 443 без строки сертификата — nginx -t не пройдёт, и сайт не поднимется",
    );
  }

  // Скрипт установки ищет ровно эту строку и заменяет все вхождения.
  const script = read("deploy/apply-nginx.sh");
  assert.ok(script.includes(anchor), "скрипт ищет другой якорь, чем стоит в конфиге");
});

test("http2 задан формой, понятной nginx на сервере", () => {
  // Отдельная директива `http2 on` появилась в nginx 1.25.1, а на сервере
  // Ubuntu-шный 1.18: он не проходит nginx -t вовсе, с «unknown directive
  // "http2"», и сайт не поднимается. Проверка стоит здесь, потому что
  // выстрелило это ровно один раз и ровно так — на боевом сервере, в
  // середине переезда.
  assert.ok(
    !/^\s*http2\s+(on|off)\s*;/m.test(nginx),
    "директива http2 не понята nginx 1.18 — сайт не поднимется",
  );

  const secure = blocks.filter((b) => /listen\s+443\s+ssl/.test(b));
  assert.ok(secure.length >= 2);
  for (const block of secure) {
    assert.match(
      block,
      /listen\s+443\s+ssl\s+http2;/,
      "блок 443 без http2 — теряем мультиплексирование на ровном месте",
    );
  }
});

test("порт 80 принимает все имена — иначе certbot не подтвердит их", () => {
  const plain = blocks.find((b) => /listen\s+80;/.test(b));
  assert.ok(plain, "нет блока на 80 порту");

  for (const name of [CANONICAL, ...ALIASES]) {
    assert.match(
      plain,
      new RegExp(`server_name[^;]*(^|\\s)${name.replace(/\./g, "\\.")}(\\s|;)`, "m"),
      `${name} не принимается по http — certbot не сможет его подтвердить`,
    );
  }
  assert.match(plain, /acme-challenge/, "путь подтверждения certbot пропал");
});

test("скрипт снимает старую ссылку и просит сертификат на все имена", () => {
  const script = read("deploy/apply-nginx.sh");

  // Два блока на одно имя — nginx возьмёт первый попавшийся, и редирект
  // молча не сработает.
  assert.match(script, /rm -f "\$LEGACY_LINK"/);
  for (const name of [CANONICAL, ...ALIASES]) {
    assert.ok(
      new RegExp(`NAMES=\\([^)]*\\b${name.replace(/\./g, "\\.")}\\b`).test(script),
      `${name} не попадёт в сертификат`,
    );
  }
});
