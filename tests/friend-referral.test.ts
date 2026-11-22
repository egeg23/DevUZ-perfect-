import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { FRIEND_BROADCAST, FRIEND_COPY_LOCALES, friendCopy } from "@/content/friend-bot";
import { friendSite } from "@/content/friend-site";
import { PROMO } from "@/lib/admin/mockup-offer";
import { SECTIONS } from "@/lib/admin/roles";
import {
  FRIEND_GIFT_USD,
  FRIEND_MIN_USD,
  FRIEND_START,
  friendCommand,
  friendSelf,
  friendStateOf,
  friendStats,
  hostInText,
  type FriendProject,
} from "@/lib/partners/friend";
import { PARTNER_KINDS, agencyFinder, partnerAccrualOf, type PartnerProject } from "@/lib/partners/rules";

/**
 * «Приведи друга — сайт бесплатно» (владелец, 22.11.2026: «Давай будет
 * механика - приведи друга который закажет сайт и получи сайт себе
 * бесплатно»). Участник — партнёр вида friend: та же атрибуция, денег нет.
 */

const read = (path: string) => readFileSync(path, "utf8");

const project = (over: Partial<FriendProject> = {}): FriendProject => ({
  id: "p1",
  partner_id: "f1",
  amount_usd: 500,
  stage: "in_work",
  partner_void_reason: null,
  ...over,
});

test("порог и подарок — цена лендинга по макету (PROMO.landing.price)", () => {
  assert.equal(FRIEND_MIN_USD, PROMO.landing.price);
  assert.equal(FRIEND_GIFT_USD, PROMO.landing.price);
  assert.ok(PARTNER_KINDS.includes("friend"));
});

test("сайт заработан, только когда друг оплатил целиком проект от цены лендинга", () => {
  const p = project();
  assert.equal(friendStateOf(p, "f1", []), "waiting");
  assert.equal(friendStateOf(p, "f1", [{ project_id: "p1", amount_usd: 250 }]), "waiting");
  assert.equal(friendStateOf(p, "f1", [{ project_id: "p1", amount_usd: 250 }, { project_id: "p1", amount_usd: 250 }]), "earned");
  assert.equal(friendStateOf(project({ amount_usd: 300 }), "f1", [{ project_id: "p1", amount_usd: 300 }]), "small");
  assert.equal(friendStateOf(project({ stage: "cancelled" }), "f1", [{ project_id: "p1", amount_usd: 500 }]), null);
  assert.equal(friendStateOf(project({ partner_void_reason: "self" }), "f1", [{ project_id: "p1", amount_usd: 500 }]), null);
  assert.equal(friendStateOf(project({ partner_id: "other" }), "f1", [{ project_id: "p1", amount_usd: 500 }]), null);
});

test("один оплативший друг — один сайт", () => {
  const projects = [project({ id: "a" }), project({ id: "b", amount_usd: 1000 }), project({ id: "c" }), project({ id: "d", amount_usd: 100 })];
  const pays = [
    { project_id: "a", amount_usd: 500 },
    { project_id: "b", amount_usd: 1000 },
    { project_id: "c", amount_usd: 100 },
    { project_id: "d", amount_usd: 100 },
  ];
  const s = friendStats("f1", 6, projects, pays);
  assert.deepEqual([s.came, s.ordered, s.paid], [6, 4, 2]);
  assert.deepEqual(s.earned, ["a", "b"]);
});

test("у друга нет денег: ни начисления, ни 5% тому, кто привёл", () => {
  const p: PartnerProject = {
    id: "p1",
    kind: "new",
    amount_usd: 2000,
    tax_percent: 0,
    dev_cost_usd: 0,
    stage: "done",
    owner_staff_id: null,
    partner_id: "f1",
    partner_percent: null,
    partner_void_reason: null,
    partner_model: "turnover",
  } as unknown as PartnerProject;
  const pays = [{ project_id: "p1", amount_usd: 2000 }];
  assert.equal(partnerAccrualOf(p, pays, { id: "f1", percent_override: null, kind: "friend" }, []), null);
  assert.ok(partnerAccrualOf(p, pays, { id: "f1", percent_override: null, kind: "person" }, []));
  assert.equal(
    agencyFinder({ partner_id: "f1", created_at: "2026-11-22T00:00:00Z" }, { id: "f1", kind: "friend", brought_by: "s1", brought_at: "2026-11-01T00:00:00Z" }),
    null,
  );
});

test("самого себя привести нельзя: Telegram, телефон, сайт или компания", () => {
  const own = [{ contacts: ["@azizbek"] }, { name: "ООО «Ромашка Плюс»", host: "romashka.uz", contacts: ["+998 90 123 45 67"] }];
  assert.ok(friendSelf(own, { contacts: ["@AzizBek"] }));
  assert.ok(friendSelf(own, { contacts: ["+998901234567"] }));
  assert.ok(friendSelf(own, { host: "https://www.romashka.uz/ru" }));
  assert.ok(friendSelf(own, { name: "Ромашка Плюс" }));
  assert.ok(!friendSelf(own, { name: "Другая компания", contacts: ["@bek"], host: "bek.uz" }));
  assert.equal(hostInText("Сайт: https://www.romashka.uz/page"), "romashka.uz");
  assert.equal(hostInText("пишите t.me/aziz"), null);
});

test("бот: /friend и /start friend ведут в программу, сотрудник — отказ", () => {
  assert.equal(friendCommand("/friend"), "friend");
  assert.equal(friendCommand("/friend@Devuz_studio_bot"), "friend");
  assert.equal(friendCommand("/ref"), null);
  assert.equal(FRIEND_START, "friend");
  const hook = read("app/api/telegram/webhook/route.ts");
  assert.match(hook, /friendCommand\(update\.message\.text\)/);
  assert.match(hook, /payload === FRIEND_START/);
  const bot = read("lib/partners/friend-bot.ts");
  assert.match(bot, /isStaffTelegram\(from\.id\)/);
  assert.match(bot, /ensurePartner\(from, "friend"\)/);
});

test("кнопка «Приведи друга» — после макета и КП, только клиенту", () => {
  const src = read("lib/proto/instant/bot.ts");
  assert.match(src, /if \(!ctx\.staffId\) kpRows\.push\(\[\{ text: friendCopy\(locale\)\.button/);
});

test("лид из «Макета в боте» привязывается к ссылке партнёра или друга", () => {
  const src = read("lib/proto/instant/bot-deps.ts");
  assert.match(src, /attributeAndNotify\(/);
  assert.match(src, /touchFor\(input\.ctx\.chatId\)/);
});

test("тексты бота на пяти языках, без длинных тире и слова «прототип»", () => {
  for (const l of FRIEND_COPY_LOCALES) {
    const c = friendCopy(l);
    const all = [c.button, c.intro({ link: "L", bot: "B", word: "AZIZ", price: 500 }), c.stats({ came: 1, ordered: 1, paid: 1 }), c.earned(500), c.came(null), c.partner("W")].join("\n");
    assert.ok(!/[—–]| - /.test(all.replace(c.button, "")), `${l}: тире`);
    assert.ok(!/прототип|prototype/i.test(all), `${l}: прототип`);
    assert.match(all, /500/);
  }
  assert.ok(!/[—–]/.test(FRIEND_BROADCAST(500)));
});

test("страница на сайте — на шести языках, в разделах сайта и карте", () => {
  assert.deepEqual(Object.keys(friendSite).sort(), ["en", "pl", "ru", "uk", "uz", "zh"]);
  for (const [l, t] of Object.entries(friendSite)) {
    const all = [t.lead("$500"), ...t.steps("$500"), ...t.rules("$500")].join(" ");
    assert.ok(!/[—–]| - /.test(all), `${l}: тире`);
    assert.ok(!/прототип|prototype/i.test(all), `${l}: прототип`);
  }
  assert.match(read("middleware.ts"), /"friend",/);
  assert.match(read("app/sitemap.ts"), /FRIEND_PATH/);
});

test("панель: вкладка «Друзья» у «Партнёров», владельцу и руководителю; рассылка не уходит сама", () => {
  const s = SECTIONS.find((x) => x.href === "/admin/friends");
  assert.ok(s);
  assert.equal(s.parent, "/admin/partners");
  assert.deepEqual([...s.roles].sort(), ["admin", "head"]);
  assert.match(read("app/admin/friends/page.tsx"), /requireSection\("\/admin\/friends"\)/);
  assert.match(read("app/admin/partners/page.tsx"), /kind !== "friend"/);
  // Текст рассылки только показывается: ни один модуль не шлёт его сам.
  for (const f of ["lib/partners/friend-store.ts", "lib/partners/friend-bot.ts", "app/api/reminders/sweep/route.ts"]) {
    assert.ok(!read(f).includes("FRIEND_BROADCAST"), f);
  }
});

test("подарок: строка владельцу и руководителю, задача, сообщение другу — днём, раз на проект", () => {
  const src = read("lib/partners/friend-store.ts");
  assert.match(src, /if \(!messageWindow\(now\)\) return 0;/);
  assert.match(src, /giftNewsKey\(project\.id\)/);
  assert.match(src, /Подарочный сайт для/);
  assert.match(src, /mockup: false/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /deliverFriendGifts\(new Date\(\)\)/);
});
