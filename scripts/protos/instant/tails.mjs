// Хвосты прошлых клиентов для «Макета в боте» (lib/proto/instant/tails).
//
// Шаблоны собраны из макетов Nek Dental Studio, «Сияния Севера» (стоматология)
// Shox International Hospital (медцентр), vTashkente (мебель), Agora (ресторан), SEM Travel (турагентство), Greenwell (интернет-магазин) и Aipply Academy, MedAcademy (учебный центр) и ShahaR.Uz (недвижимость), AUTOMECHANIC (автосервис); в макете нового клиента не должно остаться ни строки о них:
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
import * as sem from "../semtravel/data.mjs";
import * as gw from "../greenwell/data.mjs";
import * as cargo from "../cargopro/data.mjs";

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
    // SEM Travel — шаблон турагентства (lib/proto/instant/tur).
    sem.BRAND.name,
    "semtravel",
    "prosem_bot",
    sem.BRAND.mail,
    "Хирмонтепа",
    "Xirmontepa",
    "Park City Olmazor",
    // Aipply Academy — шаблон учебного центра (lib/proto/instant/edu). Факты — в их gen.mjs (F).
    "Aipply",
    "aipply_admin_bot",
    "aipplyacademy",
    "Bog‘ko‘cha",
    "Богкуча",
    // MedAcademy B: шаблон учебного центра с 12.11.2026 (lib/proto/instant/edu). Макет в витрине, фактов в этом репозитории нет: переписаны отсюда.
    "MedAcademy",
    "medacademy_admin",
    "medacademy_uz",
    "medacademyuz696",
    "biochemistryuz",
    "Шахрисабз, 16А",
    "Азамат Исламбеков",
    "Рашид Валиулин",
    "Самира Рахматова",
    "Хонзода Шахобиддинова",
    // ShahaR.Uz — шаблон недвижимости (lib/proto/instant/nedv). Факты — в их gen.mjs (F).
    // Не «ShahaR» одно: по-узбекски «shahar» — город.
    "ShahaR.Uz",
    "operator_shahar",
    "Shaharuz_bot",
    "shaharuzchannel",
    "cityshahar",
    "RR 0007",
    "14/СОР-01",
    // MAVERA — шаблон недвижимости с 12.11.2026 (lib/proto/instant/nedv, снимок «Премиума» с витрины).
    // Названия их ЖК — обычные слова (чинор, бахор, нур), поэтому только вместе с «ЖК».
    "MAVERA",
    "mavera.uz",
    "ЖК «Чинор»",
    "ЖК «Дарё»",
    "ЖК «Бахор»",
    "ЖК «Олтин Водий»",
    "ЖК «Нур»",
    "ЖК «Зарафшон»",
    "Олтин Водий",
    // Greenwell — шаблон интернет-магазина с 12.11.2026 (lib/proto/instant/magazin).
    gw.BRAND.name,
    gw.BRAND.site,
    gw.BRAND.tg,
    "Inso Farm",
    // Названия их банок («Магний Цитрат») — обычные названия товара в аптеке клиента, их не берём.
    // AUTOMECHANIC — шаблон автосервиса (lib/proto/instant/avtoservis). Факты — в их gen.mjs (F).
    "AUTOMECHANIC",
    "automechanic.uz",
    "tadjiyev_u",
    "автостоянка № 75",
    "75-son avtoturargoh",
    "10 квартал, дом 23/1",
    "10-kvartal, 23/1",
    "77 Lubricants",
    // CARGO PRO GROUP — шаблон логистики с 12.11.2026 (lib/proto/instant/logistika).
    cargo.COMPANY.name,
    cargo.COMPANY.email,
    new URL(cargo.COMPANY.site).hostname,
    "cargoprogroup",
    "cargoprogroup_bot",
    "Абдуллы Каххара",
    "Abdulla Qahhor",
    "Lider Cargo",
    "LBM Driver",
    // LIDER PROF PROEKT — шаблон стройки и ремонта с 12.11.2026 (lib/proto/instant/stroitelstvo).
    // Факты — в их gen.mjs (F, REVIEW), отдельного data.mjs нет: переписаны отсюда.
    "LIDER PROF",
    "lider-prof.uz",
    "liderprof",
    "lppuz",
    "lider_prof_proekt",
    "liderprofproekt",
    "3-й проезд Хотира",
    "Xotira 3-tor",
    "Алексей Иванов",
    "Маркетолог LOGI",
  ];
  const phones = [nek.CLINIC.tel, syanie.BRAND.phoneRaw, ...shox.BRANCHES.map((b) => b.tel), VTASHKENTE_PHONE, agora.BRAND.tel, sem.BRAND.phoneRaw, sem.BRAND.phone2Raw, "+998771233300", "+998934453569", "+998909656131", "+998712764431", ...cargo.COMPANY.phones.map(([, raw]) => raw), "+998993050999", "+998993060999"].filter(Boolean).map((p) => p.replace(/\D/g, ""));
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
