// Хвосты прошлых клиентов для «Макета в боте» (lib/proto/instant/tails).
//
// Шаблоны собраны из макетов Nek Dental Studio, «Сияния Севера» (стоматология)
// Shox International Hospital (медцентр), vTashkente (мебель) и Agora (ресторан); в макете нового клиента не должно остаться ни строки о них:
// название, телефон, почта, домен, ник, адрес, врачи, авторы отзывов,
// лицензия. Список пишется отсюда из их data.mjs, а не руками:
//
//   node scripts/protos/instant/tails.mjs
//
// Тест (tests/proto-instant.test.ts) сверяет файл с data.mjs: поменяли
// факты макета — перезапустить скрипт, иначе npm test красный.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import * as nek from "../nek/data.mjs";
import * as syanie from "../syanie/data.mjs";
import * as shox from "../shox-hospital/data.mjs";
import * as agora from "../agora/data.mjs";

const VTASHKENTE = [
  "vTashkente",
  "vtashkente.uz",
  "vTashkenteuz_IrinaTsoy",
  "IrinaTsoy",
  "Шота Руставели",
  "Shota Rustaveli",
  "Кизгалдок",
  "Qizg‘aldoq",
  "Амстердам VIP",
  "Ницца VIP",
  "Лондон VIP",
  "Нью-Йорк VIP",
  "Мельбурн VIP",
  "Лос-Анджелес VIP",
  "Чикаго VIP",
  "Сантьяго VIP",
  "Santyago VIP",
  "Карандаевой",
];
const VTASHKENTE_PHONE = "+998909729989";

/** Имя человека: два слова и больше — одно «Николай» встречается у кого угодно. */
const person = (name) => (typeof name === "string" && name.trim().split(/\s+/).length >= 2 ? [name.trim()] : []);

export function tails() {
  const text = [
    nek.CLINIC.name,
    nek.CLINIC.mail,
    "nekdentalstudio",
    "NekDental",
    ...Object.values(nek.CLINIC.addr),
    ...nek.TEAM.flatMap((p) => [p.en, p.ka]),
    ...nek.REVIEWS.flatMap((r) => person(r.who)),
    syanie.BRAND.name,
    syanie.BRAND.legal,
    new URL(syanie.BRAND.site).hostname,
    syanie.BRAND.addr,
    syanie.BRAND.street,
    syanie.BRAND.license,
    ...syanie.DOCTORS.flatMap((d) => [d.name, d.short]),
    ...syanie.REVIEWS.flatMap((r) => person(r.who)),
    // Shox — шаблон медцентра (lib/proto/instant/medcentr).
    "Shox International",
    "Shox Med",
    "shox.hospital",
    "shoxgroupbot",
    ...shox.BRANCHES.flatMap((b) => [b.name, ...(b.addr ? [b.addr.ru, b.addr.uz] : [])]),
    ...shox.DOCS.flatMap((d) => [d.ru, d.la]),
    // vTashkente — шаблон мебели (lib/proto/instant/mebel). Их факты
    // живут в gen.mjs (F, WORKS), отдельного data.mjs нет: переписаны отсюда.
    ...VTASHKENTE,
    // Agora — шаблон ресторана (lib/proto/instant/restoran).
    "Agora Lounge",
    agora.BRAND.ig,
    agora.BRAND.ru.street,
    agora.BRAND.uz.street,
  ];
  const phones = [nek.CLINIC.tel, syanie.BRAND.phoneRaw, ...shox.BRANCHES.map((b) => b.tel), VTASHKENTE_PHONE, agora.BRAND.tel].filter(Boolean).map((p) => p.replace(/\D/g, ""));
  return {
    text: [...new Set(text.map((s) => s.trim()).filter((s) => s.length >= 5))].sort(),
    phones: [...new Set(phones)].sort(),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = new URL("../../../content/proto-instant/tails.json", import.meta.url);
  writeFileSync(out, `${JSON.stringify(tails(), null, 2)}\n`);
  console.log("tails.json записан");
}
