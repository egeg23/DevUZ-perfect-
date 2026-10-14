import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { HelpVideoManager } from "@/components/admin/help-video";
import { helpCopy } from "@/content/admin-help";
import { learnDict } from "@/content/admin-panel/learn";
import { COURSES, PANEL_QUIZ, learnCopy, type LearnKey } from "@/content/learn";
import { VIDEO_COURSE_MINUTES, VIDEO_LESSONS } from "@/content/learn/video-course";
import { requireSection } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { signedHelpVideoUrl } from "@/lib/admin/help-video-link";
import { canManageHelpVideos, isVideoCourseKey, pickHelpVideo } from "@/lib/admin/help-video-rules";
import { listHelpVideos } from "@/lib/admin/help-videos";
import { pick } from "@/lib/admin/i18n";
import { ROLE_BADGE, seesTeamLearning } from "@/lib/admin/roles";
import { sectionOn } from "@/lib/admin/section-switch";
import { switchLearn } from "@/app/admin/learn/actions";
import { questionsFor } from "@/lib/learn/quiz";
import { PASS_PERCENT, joinedAfterLaunch, mustLearn, requiredLeft } from "@/lib/learn/rules";
import { activeTeam, bestOf, listAttempts, type Best } from "@/lib/learn/store";

export const dynamic = "force-dynamic";

/**
 * «Обучение»: курсы по продажам и тест по панели.
 *
 * Владелец, 12.10.2026: «Добавить курсы по продажам и тестирование по
 * знаниям дашборда»; обязательно для менеджеров, проходной балл 70%; «Пока
 * не активируй, просто делаем чтобы я видел, потом через кнопку включу».
 * Пока выключено — страницу видит только владелец (opens, sections_off), и
 * обязательность ни на кого не действует. Обязательность только
 * показывается: работу она не закрывает.
 */

const HREF = "/admin/learn";

export default async function LearnPage() {
  const staff = await requireSection("/admin/learn");
  const locale = staff.panel_locale;
  const t = pick(learnDict, locale);
  const copy = learnCopy(locale);
  const owner = staff.role === "admin";
  const on = owner ? await sectionOn(HREF) : true;
  const team = seesTeamLearning(staff.role);

  const attempts = await listAttempts(team ? null : staff.id);
  const best = bestOf(attempts);
  const mine = best.get(staff.id) ?? new Map<string, Best>();
  const passedSet = new Set([...mine].filter(([, b]) => b.passed).map(([key]) => key));
  const left = on ? requiredLeft(staff, passedSet) : [];
  const title = (key: string) => (key === PANEL_QUIZ ? copy.panel.title : copy.courses[key as keyof typeof copy.courses]?.title ?? key);

  const status = (b: Best | undefined) =>
    !b ? (
      <span className="text-faint">{t.notTried}</span>
    ) : b.passed ? (
      <span className="text-green">{t.passed(b.score, b.total)}</span>
    ) : (
      <span className="text-gold">{t.notPassed(b.score, b.total)}</span>
    );

  const members = team ? await activeTeam() : [];

  // Видеокурс: ролики лежат как видео к инструкциям (course-01 …), ссылка
  // подписанная — куски видео идут без проверки входа, права проверены здесь.
  const courseVideos = (await listHelpVideos())
    .filter((video) => isVideoCourseKey(video.section))
    .map((video) => ({ ...video, src: signedHelpVideoUrl(video) }));
  const managesVideo = canManageHelpVideos(staff.role);
  const videoCopy = helpCopy(locale).video;
  const tests: LearnKey[] = [...COURSES.map((c) => c.key), PANEL_QUIZ];

  return (
    <AdminShell staff={staff}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-faint">{t.passRule(PASS_PERCENT)}</p>

      {owner ? (
        <form action={switchLearn} className={`mt-6 max-w-2xl rounded-xl border px-5 py-4 ${on ? "border-green/30 bg-green/5" : "border-gold/30 bg-gold/5"}`}>
          <p className={`text-sm leading-relaxed ${on ? "text-green" : "text-gold"}`}>
            {on ? t.onBanner : t.offBanner} <HelpHint topic={helpAnchor("/admin/learn", "switch")} />
          </p>
          <input type="hidden" name="on" value={on ? "0" : "1"} />
          <button
            type="submit"
            className={
              on
                ? "mt-3 rounded-lg border border-line px-4 py-2 text-sm transition hover:border-gold/60"
                : "mt-3 rounded-lg bg-green px-4 py-2 text-sm font-medium text-bg transition hover:opacity-90"
            }
          >
            {on ? t.switchOff : t.switchOn}
          </button>
        </form>
      ) : null}

      {on && mustLearn(staff) ? (
        <section className="mt-6 max-w-2xl rounded-xl border border-line bg-surface px-5 py-4">
          <h2 className="text-sm font-semibold">{t.requiredTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t.requiredHint(PASS_PERCENT)}</p>
          {left.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {left.map((key) => (
                <li key={key}>
                  <Link href={`${HREF}/${key}`} className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold hover:bg-gold/10">
                    {title(key)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-green">{t.requiredDone}</p>
          )}
        </section>
      ) : null}

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-faint">
        {t.coursesTitle} <HelpHint topic={helpAnchor("/admin/learn", "courses")} />
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {COURSES.map((course) => (
          <Link
            key={course.key}
            href={`${HREF}/${course.key}`}
            className="block rounded-xl border border-line bg-surface px-5 py-4 transition hover:border-green/50"
          >
            <p className="font-medium">{copy.courses[course.key].title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{copy.courses[course.key].summary}</p>
            <p className="mt-2 text-xs text-faint">
              {t.lessons(course.lessons.length)} · {t.questions(course.quiz.length)} · {status(mine.get(course.key))}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-faint">
        {t.videoTitle} <HelpHint topic={helpAnchor("/admin/learn", "video-course")} />
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.videoIntro(VIDEO_LESSONS.length, VIDEO_COURSE_MINUTES)}</p>
      <ol className="mt-3 grid gap-3 lg:grid-cols-2">
        {VIDEO_LESSONS.map((lesson, index) => {
          const video = pickHelpVideo(courseVideos, lesson.key, locale);
          return (
            <li key={lesson.key} id={lesson.key} className="rounded-xl border border-line bg-surface px-5 py-4">
              <p className="font-medium">
                <span className="mr-2 font-mono text-faint">{index + 1}.</span>
                {lesson.title[locale]}
                <span className="ml-2 text-xs font-normal text-faint">{t.videoMinutes(lesson.minutes)}</span>
              </p>
              {video ? (
                <video
                  controls
                  preload="none"
                  playsInline
                  src={video.src}
                  className="mt-3 aspect-video w-full rounded-lg border border-line bg-black"
                />
              ) : (
                <p className="mt-2 text-sm text-faint">{t.videoMissing}</p>
              )}
              {managesVideo ? (
                <HelpVideoManager
                  section={lesson.key}
                  title={t.videoManage}
                  lang={locale}
                  copy={videoCopy}
                  have={courseVideos.filter((v) => v.section === lesson.key).map((v) => ({ id: v.id, locale: v.locale }))}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <h2 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-faint">
        {t.panelTitle} <HelpHint topic={helpAnchor("/admin/learn", "panel-quiz")} />
      </h2>
      <Link
        href={`${HREF}/${PANEL_QUIZ}`}
        className="mt-3 block max-w-2xl rounded-xl border border-line bg-surface px-5 py-4 transition hover:border-green/50"
      >
        <p className="font-medium">{copy.panel.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{copy.panel.summary}</p>
        <p className="mt-2 text-xs text-faint">
          {t.questions(questionsFor(PANEL_QUIZ, staff, locale).length)} · {status(mine.get(PANEL_QUIZ))}
        </p>
      </Link>
      <p className="mt-3 text-sm text-faint">{t.botHint}</p>

      {team ? (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-faint">
            {t.teamTitle} <HelpHint topic={helpAnchor("/admin/learn", "results")} />
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.teamHint}</p>
          {attempts.length === 0 ? <p className="mt-3 text-sm text-faint">{t.teamEmpty}</p> : null}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left sm:min-w-[720px] text-xs">
              <thead className="text-faint">
                <tr>
                  <th className="py-2 pr-3 font-normal">{t.colPerson}</th>
                  {tests.map((key) => (
                    <th key={key} className="py-2 pr-3 font-normal">
                      {title(key)}
                    </th>
                  ))}
                  {on ? <th className="py-2 pr-3 font-normal">{t.colLeft}</th> : null}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const theirs = best.get(member.id) ?? new Map<string, Best>();
                  const passed = new Set([...theirs].filter(([, b]) => b.passed).map(([key]) => key));
                  const need = requiredLeft({ role: member.role }, passed);
                  return (
                    <tr key={member.id} className="border-t border-line align-top">
                      <td className="py-2 pr-3">
                        <span className="text-sm">{member.name}</span>{" "}
                        <span className="text-faint">{ROLE_BADGE[member.role][locale]}</span>
                        {member.role === "manager" && joinedAfterLaunch(member.createdAt) ? (
                          <span className="ml-1 rounded-full border border-gold/40 px-1.5 text-gold">{t.newBadge}</span>
                        ) : null}
                      </td>
                      {tests.map((key) => {
                        const b = theirs.get(key);
                        return (
                          <td key={key} className="py-2 pr-3 font-mono">
                            {b ? <span className={b.passed ? "text-green" : "text-gold"}>{`${b.score}/${b.total}`}</span> : <span className="text-faint">·</span>}
                          </td>
                        );
                      })}
                      {on ? (
                        <td className="py-2 pr-3">
                          {!mustLearn({ role: member.role }) ? (
                            <span className="text-faint">{t.optional}</span>
                          ) : need.length ? (
                            <span className="text-gold">{need.map(title).join(", ")}</span>
                          ) : (
                            <span className="text-green">{t.allPassed}</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
