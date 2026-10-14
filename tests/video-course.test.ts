import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { VIDEO_LESSONS } from "@/content/learn/video-course";
import { canWatchHelpVideo, isHelpVideoSection, isVideoCourseKey } from "@/lib/admin/help-video-rules";

/**
 * Видеокурс в «Обучении»: 13 роликов, лежат как видео к инструкциям с ключом
 * course-NN (задача Александра, утверждена владельцем 13.10.2026).
 */

test("ключи роликов по порядку и проходят проверку базы", () => {
  const migration = readFileSync("supabase/migrations/0164_video_course.sql", "utf8");
  assert.match(migration, /\^course-\[0-9\]\{2\}\$/);
  VIDEO_LESSONS.forEach((lesson, index) => {
    assert.equal(lesson.key, `course-${String(index + 1).padStart(2, "0")}`);
    assert.ok(isVideoCourseKey(lesson.key) && isHelpVideoSection(lesson.key), lesson.key);
    assert.ok(lesson.minutes > 0 && lesson.minutes <= 10, lesson.key);
  });
  assert.equal(new Set(VIDEO_LESSONS.map((lesson) => lesson.key)).size, VIDEO_LESSONS.length);
  assert.ok(!isHelpVideoSection("course-99"), "чужой ключ не принимается");
});

test("названия на трёх языках, в узбекском и польском нет кириллицы вне «ёлочек»", () => {
  for (const lesson of VIDEO_LESSONS) {
    for (const lang of ["ru", "uz", "pl"] as const) assert.ok(lesson.title[lang].trim(), `${lesson.key} ${lang}`);
    for (const lang of ["uz", "pl"] as const) {
      assert.doesNotMatch(lesson.title[lang].replace(/«[^»]*»/g, ""), /[А-Яа-яЁё]/, `${lesson.key} ${lang}`);
    }
  }
});

test("ролики курса видит тот, кому открыто «Обучение»", () => {
  for (const role of ["admin", "head", "manager"] as const) {
    assert.ok(canWatchHelpVideo(role, "course-01"), role);
  }
  assert.ok(!canWatchHelpVideo({ role: "manager", section_access: { "/admin/learn": false } }, "course-01"));
});
