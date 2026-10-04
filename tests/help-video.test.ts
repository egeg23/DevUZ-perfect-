import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { HelpView } from "@/components/admin/help-view";
import { HELP_LOCALES, helpCopy } from "@/content/admin-help";
import {
  HELP_VIDEO_INTRO,
  canManageHelpVideos,
  canWatchHelpVideo,
  helpVideoUrl,
  isHelpVideoSection,
  pickHelpVideo,
} from "@/lib/admin/help-video-rules";
import { helpVideoStart } from "@/lib/admin/help-videos";
import { SECTIONS, type Role } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";

/**
 * Видео к инструкциям: загружают владелец и руководитель, видят все, кому
 * открыт раздел. Владелец, 04.10.2026: «Как пользоваться разделом» ведёт к
 * видео раздела, а под ним — подробный текст.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), "utf8");

function staff(role: Role, locale: "ru" | "uz" | "pl" = "ru"): Staff {
  return { id: "00000000-0000-0000-0000-000000000001", role, display_name: "Тест", panel_locale: locale } as unknown as Staff;
}

const ID_INTRO = "11111111-1111-4111-8111-111111111111";
const ID_PROSPECT = "22222222-2222-4222-8222-222222222222";
const ID_ACCOUNTS = "33333333-3333-4333-8333-333333333333";
const VIDEOS = [
  { id: ID_INTRO, section: HELP_VIDEO_INTRO, locale: "uz" },
  { id: ID_PROSPECT, section: "/admin/prospect", locale: "ru" },
  { id: ID_ACCOUNTS, section: "/admin/accounts", locale: "ru" },
];

test("раздел видео — из меню панели или вводное, и больше ничего", () => {
  assert.ok(isHelpVideoSection(HELP_VIDEO_INTRO));
  for (const section of SECTIONS) assert.ok(isHelpVideoSection(section.href), section.href);
  for (const bad of ["/admin/nope", "/etc/passwd", "", "../promo"]) assert.ok(!isHelpVideoSection(bad), bad);
});

test("загружают владелец и руководитель, смотрит тот, кому открыт раздел", () => {
  assert.ok(canManageHelpVideos("admin"));
  assert.ok(canManageHelpVideos("head"));
  assert.ok(!canManageHelpVideos("manager"));
  assert.ok(canWatchHelpVideo("manager", HELP_VIDEO_INTRO));
  assert.ok(canWatchHelpVideo("manager", "/admin/prospect"));
  assert.ok(!canWatchHelpVideo("manager", "/admin/accounts"), "аккаунты менеджеру закрыты — и их видео тоже");
  assert.ok(canWatchHelpVideo("head", "/admin/accounts"));
});

test("видео — на языке инструкции, а если его нет — на другом: ru → uz → pl", () => {
  const videos = [
    { section: "/admin", locale: "uz", id: "a" },
    { section: "/admin", locale: "pl", id: "b" },
  ];
  assert.equal(pickHelpVideo(videos, "/admin", "pl")?.id, "b");
  assert.equal(pickHelpVideo(videos, "/admin", "uz")?.id, "a");
  assert.equal(pickHelpVideo(videos, "/admin", "ru")?.id, "a", "русского нет — узбекское раньше польского");
  assert.equal(pickHelpVideo(videos, "/admin/prospect", "ru"), null);
});

test("загрузка принимает только ролики", async () => {
  assert.deepEqual(await helpVideoStart({ mime: "image/png", bytes: 100 }), { ok: false, reason: "bad_type" });
  assert.deepEqual(await helpVideoStart({ mime: "text/html", bytes: 100 }), { ok: false, reason: "bad_type" });
});

test("страница показывает видео раздела и вводное, а блок загрузки — только владельцу и руководителю", () => {
  for (const locale of HELP_LOCALES) {
    for (const role of ["admin", "head", "manager"] as const) {
      const html = renderToStaticMarkup(createElement(HelpView, { staff: staff(role, locale), locale, role, videos: VIDEOS }));
      assert.ok(html.includes(`src="${helpVideoUrl(ID_INTRO)}"`), `${locale} ${role}: нет вводного видео`);
      assert.ok(html.includes(`src="${helpVideoUrl(ID_PROSPECT)}"`), `${locale} ${role}: нет видео «Касаний»`);
      assert.equal(
        html.includes(`src="${helpVideoUrl(ID_ACCOUNTS)}"`),
        role !== "manager",
        `${locale} ${role}: видео «Аккаунтов» — только тем, кому раздел открыт`,
      );
      assert.equal(html.includes("data-help-video-manager"), role !== "manager", `${locale} ${role}: блок загрузки`);
      if (role !== "manager") assert.ok(html.includes(helpCopy(locale).video.manageSection));
    }
    // Видео на чужом языке подписано, на своём — нет.
    const ru = renderToStaticMarkup(createElement(HelpView, { staff: staff("manager", locale), locale, role: "manager", videos: VIDEOS }));
    const note = helpCopy(locale).video.otherLanguage.split("{lang}")[0];
    assert.ok(ru.includes(note), `${locale}: нет подписи о языке видео`);
  }
  // Владелец в «Показать как менеджер» видит страницу как менеджер — без загрузки.
  const asManager = renderToStaticMarkup(createElement(HelpView, { staff: staff("admin"), locale: "ru", role: "manager", videos: VIDEOS }));
  assert.ok(!asManager.includes("data-help-video-manager"));
  // Без видео страница рисуется как раньше.
  const empty = renderToStaticMarkup(createElement(HelpView, { staff: staff("manager"), locale: "ru", role: "manager" }));
  assert.ok(!empty.includes("<video"));
});

test("файл видео отдаёт только вошедшему и только из открытого ему раздела", () => {
  const route = read("app/admin/help/video/[id]/route.ts");
  assert.match(route, /const staff = await currentStaff\(\);\s*if \(!staff\) return new NextResponse\(null, \{ status: 404 \}\)/);
  assert.match(route, /canWatchHelpVideo\(staff\.role, video\.section\)/);
  const actions = read("app/admin/help/actions.ts");
  assert.match(actions, /const manage = \(\) => requireRole\("admin", "head"\);/);
  for (const name of ["helpVideoStartAction", "helpVideoChunkAction", "helpVideoDiscardAction", "helpVideoSaveAction", "helpVideoRemoveAction"]) {
    const body = actions.slice(actions.indexOf(`export async function ${name}`));
    assert.match(body.slice(0, 400), /await manage\(\)/, `${name}: без проверки роли`);
  }
  const migration = read("supabase/migrations/0085_help_videos.sql");
  assert.match(migration, /unique \(section, locale\)/);
  assert.match(migration, /enable row level security/);
});

test("ссылка на видео подписана: кусок идёт без базы, подделку и просрочку не пускает", async () => {
  const { LINK_WINDOW_S, signedHelpVideoUrl, verifyHelpVideoLink } = await import("@/lib/admin/help-video-link");
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  try {
    const video = { id: ID_PROSPECT, storage_path: "2026/10/3a497c34-dfdf-4b7c-9b05-1374c409c692.mp4" };
    const now = Date.UTC(2026, 9, 5, 9, 0, 0);
    const url = signedHelpVideoUrl(video, now);
    assert.ok(url.startsWith(`${helpVideoUrl(ID_PROSPECT)}?`));
    const params = new URL(url, "https://devuz.studio").searchParams;
    assert.deepEqual(verifyHelpVideoLink(ID_PROSPECT, params, now), { path: video.storage_path, mime: "video/mp4" });

    // Одна ссылка на всё 12-часовое окно — браузер берёт ролик из кэша.
    const windowStart = Math.floor(now / 1000 / LINK_WINDOW_S) * LINK_WINDOW_S * 1000;
    assert.equal(signedHelpVideoUrl(video, windowStart), url);
    assert.equal(signedHelpVideoUrl(video, windowStart + LINK_WINDOW_S * 1000 - 1), url);
    // Живёт не дольше суток.
    assert.equal(verifyHelpVideoLink(ID_PROSPECT, params, now + 24 * 3600 * 1000), null);

    // Чужое видео, чужой файл, подмена подписи — мимо.
    assert.equal(verifyHelpVideoLink(ID_INTRO, params, now), null);
    const swapped = new URLSearchParams(params);
    swapped.set("p", "2026/10/00000000-0000-4000-8000-000000000000.mp4");
    assert.equal(verifyHelpVideoLink(ID_PROSPECT, swapped, now), null);
    const forged = new URLSearchParams(params);
    forged.set("s", "x".repeat(43));
    assert.equal(verifyHelpVideoLink(ID_PROSPECT, forged, now), null);
    const outside = new URLSearchParams(params);
    outside.set("p", "../../etc/passwd");
    assert.equal(verifyHelpVideoLink(ID_PROSPECT, outside, now), null);

    // Без ключа — обычная ссылка с проверкой входа на каждый кусок.
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal(signedHelpVideoUrl(video, now), helpVideoUrl(ID_PROSPECT));
    assert.equal(verifyHelpVideoLink(ID_PROSPECT, params, now), null);
  } finally {
    if (saved === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
  }

  // Страница отдаёт подписанную ссылку, маршрут сначала проверяет подпись.
  assert.match(read("app/admin/help/page.tsx"), /src: signedHelpVideoUrl\(video\)/);
  const route = read("app/admin/help/video/[id]/route.ts");
  assert.ok(route.indexOf("verifyHelpVideoLink") < route.indexOf("currentStaff()"), "подпись — раньше проверки входа");
  const html = renderToStaticMarkup(
    createElement(HelpView, {
      staff: staff("manager"),
      locale: "ru",
      role: "manager",
      videos: [{ id: ID_INTRO, section: HELP_VIDEO_INTRO, locale: "ru", src: "/admin/help/video/x?p=a&e=1&s=b" }],
    }),
  );
  assert.ok(html.includes('src="/admin/help/video/x?p=a&amp;e=1&amp;s=b"'));
});
