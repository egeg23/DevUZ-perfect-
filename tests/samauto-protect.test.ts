/**
 * Сцена SamAuto — под ключом, кейс — с прототипом, на главной — ролик.
 *
 * Владелец, 21.10.2026: «В наших кейсах размести этот кейс… чтобы после
 * нажатия открывался этот прототип. Но защити его, я не хочу, чтобы через
 * консоль кто-то смог вытащить код и украсть то, что тут есть… добавь на
 * главную прям гиф в 60 fps».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";

import { cases, casesByDate } from "@/content/cases";
import { SCENES, sceneKeyOk } from "@/lib/proto/promo";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("ключ сцены: только из хранилища, только своей странице макета", () => {
  assert.equal(SCENES.samauto, "SCENE_KEY_SAMAUTO");
  assert.ok(sceneKeyOk("a".repeat(64)));
  assert.ok(!sceneKeyOk("a".repeat(32)), "ключ промо-ролика за ключ сцены не идёт");
  assert.ok(!sceneKeyOk(null));
  const store = read("lib/proto/promo-store.ts");
  // Открытием во вкладке и с чужого сайта ключ не получить.
  assert.match(store, /file !== "index\.m3u8" && request\.headers\.get\("sec-fetch-dest"\) === "document"/);
  assert.match(store, /site && site !== "same-origin"/);
  // Тот же допуск, что у самого макета: черновик и пароль без куки — 404.
  assert.match(store, /async function serveScene[\s\S]*?bundleFor\(request, token\)/);
  assert.match(store, /data\.status === "draft"/);
  // Ключ шифрования берётся из окружения, в репозитории его нет.
  assert.match(read("scripts/protos/samauto/seal.py"), /os\.environ\["SCENE_KEY"\]/);
});

test("кейс SamAuto: первым, карточка открывает прототип, ролик 60 к/с на главной", () => {
  const item = cases.find((c) => c.slug === "samauto");
  assert.ok(item?.prototype, "у кейса нет прототипа");
  assert.equal(casesByDate[0].slug, "samauto");
  assert.match(item.prototype.href, /^\/proto\/[A-Za-z0-9_-]{43}$/);
  for (const f of ["teaser-16.mp4", "teaser-9.mp4", "poster-16.webp", "poster-9.webp"]) {
    const path = `public${item.prototype.teaser.replace(/teaser$/, "")}${f}`;
    assert.ok(existsSync(path), `нет ${path}`);
    assert.ok(statSync(path).size < 4 * 1048576, `${path} тяжелее 4 МБ`);
  }
  const card = read("components/sections/cases.tsx");
  assert.match(card, /<a href=\{item\.prototype\.href\} target="_blank" rel="noopener"/, "карточка не ведёт в прототип");
  assert.match(card, /proto-glow/, "карточка прототипа не выделена");
  assert.match(read("app/globals.css"), /@media \(prefers-reduced-motion: reduce\) \{\s*\.proto-glow::before/, "рамка крутится и при «меньше движения»");
  const home = read("app/[locale]/page.tsx");
  assert.ok(home.indexOf("<ProtoReel") > home.indexOf("<CompileScene") && home.indexOf("<ProtoReel") < home.indexOf("<ScaleSection"), "ролик не сразу под первым экраном");
  const reel = read("components/sections/proto-reel.tsx");
  assert.match(reel, /preload="none"/, "ролик грузится до того, как его увидели");
  assert.match(reel, /prefers-reduced-motion: reduce/);
  // Клиентский компонент не тянет к себе весь список кейсов.
  assert.doesNotMatch(reel, /import \{[^}]*\bcases\b[^}]*\} from "@\/content\/cases"/);
});
