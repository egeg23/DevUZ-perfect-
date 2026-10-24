/**
 * Контакт клиента в боте и помощник в чате владельца (lib/admin/contact-find.ts).
 *
 * Владелец, 24.10.2026: написал боту «Напомни контакт Adar» — ответа нет.
 * Его личка назначена чатом продаж, и обычный текст там бот пропускал, а
 * помощник данных клиентов не даёт вовсе. «Делаем оба»: помощник отвечает
 * и в чате брифов, владельцу и руководителю бот ищет контакт по базе,
 * каждый показ — в журнал. Сеть не трогается: правила и разводка вебхука.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { AUDIT_ACTIONS } from "@/lib/admin/audit";
import {
  CONTACT_MAX_WORDS,
  contactAsk,
  contactLine,
  contactReply,
  leadState,
  prospectState,
  seesContacts,
  type ContactHit,
} from "@/lib/admin/contact-find";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

test("вопрос о контакте: «напомни контакт Adar» и похожие — строка поиска", () => {
  assert.equal(contactAsk("Напомни контакт Adar"), "Adar");
  assert.equal(contactAsk("контакт Дилмурод"), "Дилмурод");
  assert.equal(contactAsk("Контакты клиента Adar?"), "Adar");
  assert.equal(contactAsk("найди телефон adar.uz"), "adar.uz");
  assert.equal(contactAsk("телефон у Дилмурода"), "Дилмурода");
  assert.equal(contactAsk("контакт DZ-1016-KCDE"), "DZ-1016-KCDE");
  assert.equal(contactAsk("kontakt Adar"), "Adar");
  assert.equal(contactAsk("/contact Adar"), "Adar");
  assert.equal(contactAsk("/kontakt@Devuz_studio_bot FloraEdu"), "FloraEdu");
});

test("не вопрос о контакте — помощнику: вопрос о работе, пустой хвост, длинная фраза", () => {
  assert.equal(contactAsk("Как открыть контакт клиента в панели?"), null);
  assert.equal(contactAsk("что ответить, если клиент говорит дорого"), null);
  assert.equal(contactAsk("контакт"), null);
  assert.equal(contactAsk("телефон ?"), null);
  assert.equal(contactAsk("телефон клиента не открывается в карточке лида что мне делать"), null);
  assert.ok(CONTACT_MAX_WORDS >= 3);
});

test("поиск контакта — только владельцу и руководителю", () => {
  assert.equal(seesContacts("admin"), true);
  assert.equal(seesContacts("head"), true);
  assert.equal(seesContacts("manager"), false);
});

test("контакт строкой: телефон, ник, почта, нет контакта", () => {
  assert.equal(contactLine("+998712770000", "phone"), "📞 +998712770000");
  assert.equal(contactLine("sakinhome_admin", "telegram"), "✈️ @sakinhome_admin");
  assert.equal(contactLine("@floraedu", "handle"), "✈️ @floraedu");
  assert.equal(contactLine("info@adar.uz", "email"), "✉️ info@adar.uz");
  assert.equal(contactLine(null, "phone"), "контакта нет");
  assert.equal(contactLine("x", "none"), "контакта нет");
  assert.equal(leadState("lost", "Ренат"), "проигран · ведёт Ренат");
  assert.equal(prospectState("skipped", null), "пропущено");
});

test("ответ: каждая находка со ссылкой в панель, данные экранированы, без длинных тире", () => {
  const hits: ContactHit[] = [
    { kind: "lead", title: "Дилмурод", contact: "+998712770000", contactKind: "phone", ref: "DZ-1016-KCDE", state: "проигран · ведёт Ренат", href: "/admin/leads/8ce5" },
    { kind: "prospect", title: "adar.uz", contact: null, contactKind: null, ref: null, state: "пропущено", href: "/admin/prospect?open=c604#p-c604" },
    { kind: "project", title: "Дилмурод <Подарки>", contact: null, contactKind: null, ref: "клиент Дилмурод", state: null, via: "в проекте контакта нет", href: "/admin/projects/cb6d" },
  ];
  const text = contactReply("Adar", hits, "https://devuz.studio", esc);
  assert.match(text, /Контакт: «Adar»/);
  assert.match(text, /📞 \+998712770000 · проигран · ведёт Ренат/);
  assert.match(text, /https:\/\/devuz\.studio\/admin\/leads\/8ce5/);
  assert.match(text, /https:\/\/devuz\.studio\/admin\/projects\/cb6d/);
  assert.match(text, /Дилмурод &lt;Подарки&gt;/, "имя из базы экранировано");
  assert.match(text, /записан в журнал/);
  assert.doesNotMatch(text, /[—–]/);
  assert.match(contactReply("Нечто", [], "https://devuz.studio", esc), /ничего не нашёл/);
});

test("журнал: показ контакта лида и сам поиск записываются", () => {
  assert.ok((AUDIT_ACTIONS as readonly string[]).includes("bot.contact_found"));
  const store = read("lib/admin/contact-find-store.ts");
  assert.match(store, /record\("lead\.contact_revealed"[^)]*via: "bot"/s);
  assert.match(store, /record\("bot\.contact_found"/);
  assert.match(store, /if \(!seesContacts\(staff\.role\)\) return null/, "менеджер базу через бота не ищет");
  assert.match(read("lib/admin/journal.ts"), /"bot\.contact_found": \{ ru:/);
});

test("вебхук: контакт раньше помощника, чат брифов владельца — к помощнику", () => {
  const hook = read("app/api/telegram/webhook/route.ts");
  const staffText = hook.slice(hook.indexOf("async function handleStaffText"));
  assert.ok(
    staffText.indexOf("contactAsk(text)") < staffText.indexOf("answerStaff("),
    "вопрос о контакте разбирается до модели",
  );
  assert.match(staffText, /seesContacts\(staff\.role\) \? contactAsk\(text\) : null/);
  const sales = hook.slice(hook.indexOf("async function handleSales"), hook.indexOf("async function handleGroup"));
  assert.match(sales, /chat\.type === "private" && raw && !raw\.startsWith\("\/"\)\) await handleStaffText\(message, raw\)/);
});
