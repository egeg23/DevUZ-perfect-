import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

import { PROMOS, SIGN_TTL_MS, keyOk, keySigned, playlist, signKey } from "@/lib/proto/promo";
import { bundlePages } from "@/lib/proto/bundles";

const KEY = "00112233445566778899aabbccddeeff";
const TOKEN = "A".repeat(43);

test("промо-ролик: подпись на ключ живёт 10 минут и привязана к макету", () => {
  const now = 1_700_000_000_000;
  const { e, s } = signKey(KEY, TOKEN, now);
  assert.equal(keySigned(KEY, TOKEN, String(e), s, now), true);
  assert.equal(keySigned(KEY, TOKEN, String(e), s, now + SIGN_TTL_MS + 1), false, "просроченная подпись");
  assert.equal(keySigned(KEY, "B".repeat(43), String(e), s, now), false, "чужой макет");
  assert.equal(keySigned(KEY, TOKEN, String(e + 1), s, now), false, "подделанный срок");
  assert.equal(keySigned(KEY, TOKEN, String(now + 10 * SIGN_TTL_MS), s, now), false, "срок дальше 10 минут");
  assert.equal(keySigned(KEY, TOKEN, null, null, now), false);
  assert.equal(keyOk(KEY), true);
  assert.equal(keyOk("коротко"), false);
});

test("промо-ролик: плейлист шифрованный, ключ — только через наш маршрут", () => {
  const text = playlist({ dir: "/protos/x/promo", secret: "S", parts: [4, 4, 2.5] }, `/proto/${TOKEN}`, { e: 1, s: "abc" });
  assert.match(text, /#EXT-X-KEY:METHOD=AES-128,URI="\/proto\/A{43}\/promo\/key\?e=1&s=abc",IV=0x0{32}\n/);
  assert.match(text, /#EXT-X-TARGETDURATION:4\n/);
  assert.equal(text.match(/\/protos\/x\/promo\/p\d\.ts/g)?.length, 3);
  assert.match(text, /#EXT-X-ENDLIST/);
});

test("промо SIA: куски на месте, зашифрованы, ключа и целого ролика в public нет", () => {
  const promo = PROMOS.sia;
  assert.ok(promo.parts.length > 0, "ролик не собран");
  const dir = `public${promo.dir}`;
  promo.parts.forEach((_, i) => assert.ok(existsSync(`${dir}/p${i}.ts`), `нет куска p${i}.ts`));
  for (const f of readdirSync(dir)) assert.match(f, /^(p\d+\.ts|poster\.webp)$/, `лишний файл в ${dir}: ${f}`);
  // Открытый MPEG-TS начинается с байта синхронизации 0x47 каждые 188 байт;
  // зашифрованный кусок — нет.
  const head = readFileSync(`${dir}/p0.ts`).subarray(0, 189);
  assert.ok(!(head[0] === 0x47 && head[188] === 0x47), "кусок не зашифрован");
  assert.equal(promo.parts.reduce((a, b) => a + b, 0) > 30, true, "ролик короче 30 секунд");
});

test("промо SIA: в разметке нет файла ролика, есть плейлист через макет и защита от скачивания", () => {
  const home = bundlePages("sia")!.html;
  assert.match(home, /id="promo"/);
  assert.match(home, /data-src="__PROTO_BASE__\/promo\/index\.m3u8"/);
  assert.doesNotMatch(home, /\.(mp4|webm|m3u8)"[^>]*(src|href)=|<(source|a)[^>]+\/promo\//, "прямая ссылка на ролик");
  assert.match(home, /controlslist="nodownload/);
  assert.match(home, /disablepictureinpicture/);
  assert.doesNotMatch(home, /<video[^>]*\scontrols[\s>]/, "панель плеера с «Скачать»");
  assert.ok(existsSync("public/protos/_lib/hls.light.min.js"));
});
