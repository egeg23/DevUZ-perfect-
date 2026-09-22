import { addStaff, assignHead, changeRole, claim, disable, refreshMenu, resend, setGrade, setPlan } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { requireRole } from "@/lib/admin/guard";
import { GRADES, GRADE_TITLE } from "@/lib/admin/finance";
import { ROLE_BADGE, ROLE_TITLE, hiredRoles, managesStaff } from "@/lib/admin/roles";
import { listTeam } from "@/lib/admin/team";
import { offboardingSummary } from "@/lib/admin/offboarding";

export const dynamic = "force-dynamic";

const RESULT: Record<string, { text: string; tone: "ok" | "warn" }> = {
  ok: { text: "Готово.", tone: "ok" },
  menu_ok: { text: "Меню команд бота обновлено: клиенты видят /ref и /payout, сотрудники — ещё и /login.", tone: "ok" },
  menu_failed: { text: "Меню бота не обновилось — Telegram не ответил. Попробуйте ещё раз.", tone: "warn" },
  reactivated: { text: "Сотрудник включён обратно — это его прежняя запись со всей историей.", tone: "ok" },
  claimed: {
    text: "Менеджер закреплён за вами: его статистика и план/факт теперь в вашей команде, план касаний ставите вы.",
    tone: "ok",
  },
  has_head: {
    text: "У этого менеджера уже есть руководитель. Переназначить или открепить может только владелец.",
    tone: "warn",
  },
  exists: { text: "Такой Telegram id уже заведён и работает.", tone: "warn" },
  invalid: { text: "Нужны числовой Telegram id и имя.", tone: "warn" },
  self: { text: "Себя отключить или разжаловать нельзя — вернуться в панель будет некому.", tone: "warn" },
  last_admin: { text: "Это последний админ. Сначала назначьте второго.", tone: "warn" },
  owner: { text: "Это владелец панели: его роль и руководитель через панель не меняются.", tone: "warn" },
  not_head: {
    text: "Руководителем можно назначить только активного сотрудника с ролью «руководитель».",
    tone: "warn",
  },
  forbidden: {
    text: "Руководитель проектов заводит только менеджеров. Вторым руководителем назначает владелец.",
    tone: "warn",
  },
  gone: { text: "Такого сотрудника уже нет.", tone: "warn" },
  offline: { text: "База недоступна.", tone: "warn" },
  failed: { text: "Не получилось.", tone: "warn" },
};

/**
 * Что стало с приглашением.
 *
 * Показывается отдельно от результата действия, потому что это отдельная
 * новость: сотрудник заведён в любом случае, но «он об этом знает» и «он об
 * этом не знает» требуют от вас разного.
 *
 * `blocked` — почти всегда не сбой, а правило Telegram: бот не может
 * написать первым тому, кто ему ни разу не писал. Обойти нечем, так
 * задумано.
 */
const INVITE: Record<string, { text: string; tone: "ok" | "warn" }> = {
  sent: { text: "Приглашение отправлено в Telegram — там написано, как войти.", tone: "ok" },
  blocked: {
    text:
      "Приглашение не доставлено: бот не может написать первым тому, кто ему ещё не писал. " +
      "Попросите человека открыть бота и нажать «Старт», затем нажмите «отправить приглашение» в его строке.",
    tone: "warn",
  },
  no_bot: { text: "Бот не настроен — приглашение отправить нечем.", tone: "warn" },
};

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; i?: string; o?: string; t?: string }>;
}) {
  // Страницу открывают двое: владелец и руководитель проектов. Видят они
  // один и тот же состав, но правит его только владелец — `manages` ниже
  // решает, что показать формой, а что просто текстом.
  const viewer = await requireRole("admin", "head");
  const manages = managesStaff(viewer.role);
  const canHire = hiredRoles(viewer.role);
  const { r, i, o, t } = await searchParams;
  const team = await listTeam();

  const nameById = new Map(team.map((m) => [m.id, m.display_name]));
  const active = team.filter((m) => m.is_active);
  const gone = team.filter((m) => !m.is_active);
  const heads = active.filter((m) => m.role === "head");
  const notice = r ? RESULT[r] : null;
  const invite = i ? INVITE[i] : null;
  // Итог отключения: семь чисел через дефис — см. back() в actions.
  const counts = o && /^\d+(-\d+){6}$/.test(o) ? o.split("-").map(Number) : null;
  const offboarded = counts
    ? offboardingSummary({
        leads: counts[0],
        talks: counts[1],
        pool: counts[2],
        team: counts[3],
        reminders: counts[4],
        transfers: counts[5],
        cards: counts[6],
      })
    : null;
  const detached = t && /^\d+$/.test(t) ? Number(t) : 0;

  return (
    <AdminShell staff={viewer}>
      <h1 className="text-lg font-semibold">Команда</h1>
      <p className="mt-1 text-sm text-muted">
        Вход в панель — по числовому id в Telegram. Пароля нет: username человек меняет за
        секунду, id — никогда.
      </p>
      {manages ? null : (
        <p className="mt-2 text-sm text-muted">
          Вы заводите менеджеров и высылаете им приглашения. Заведённый вами менеджер сразу
          ваш, а ничьего можно взять к себе кнопкой в колонке «Руководитель» — после этого
          вы отвечаете за его показатели и план/факт и ставите ему план касаний. Открепить
          менеджера, а также менять роль, грейд, ставку и отключать может только владелец.
        </p>
      )}

      {notice ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            notice.tone === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {offboarded ? (
        <p className="mt-2 rounded-xl border border-green/30 bg-green/10 px-4 py-2.5 text-sm leading-relaxed text-green">
          Доступ закрыт, сессии оборваны. {offboarded}
        </p>
      ) : null}

      {detached ? (
        <p className="mt-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm leading-relaxed text-gold">
          Бывший руководитель больше не ведёт команду: откреплено менеджеров — {detached}. Закрепите
          их за другим руководителем.
        </p>
      ) : null}

      {invite ? (
        <p
          className={`mt-2 rounded-xl border px-4 py-2.5 text-sm leading-relaxed ${
            invite.tone === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {invite.text}
        </p>
      ) : null}

      {manages ? (
        <form action={refreshMenu} className="mt-4">
          <button type="submit" className="text-xs text-faint hover:text-green">
            обновить меню команд бота
          </button>
        </form>
      ) : null}

      {/* ── Кто работает ────────────────────────────────────────────────── */}
      {/* overflow-x-auto, а не overflow-hidden: на телефоне пять колонок не
          помещаются, и спрятанными оказывались роль, дата и сама кнопка
          «Отключить» — то есть с телефона отключить сотрудника было нельзя
          вовсе. Так же устроены остальные таблицы панели. */}
      <section className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[1180px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3 font-normal">Кто</th>
              <th className="px-4 py-3 font-normal">Telegram</th>
              <th className="px-4 py-3 font-normal">Роль</th>
              <th className="px-4 py-3 font-normal">Руководитель</th>
              <th className="px-4 py-3 font-normal">Грейд и ставка</th>
              <th className="px-4 py-3 font-normal">План касаний</th>
              <th className="px-4 py-3 font-normal">С какого дня</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {active.map((member) => (
              <tr key={member.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label="Кто" className="px-4 py-3">
                  {member.display_name}
                  {member.id === viewer.id ? (
                    <span className="ml-2 text-xs text-faint">это вы</span>
                  ) : null}
                </td>
                <td data-label="Telegram" className="px-4 py-3 font-mono text-xs text-muted">
                  {member.username ? `@${member.username}` : "—"}
                  <span className="block text-faint">id {member.telegram_user_id}</span>
                </td>
                <td data-label="Роль" className="px-4 py-3">
                  {!manages || (member.role === "admin" && member.id === viewer.id) ? (
                    // Себя не разжаловать: панель останется без хозяина.
                    // Назначить второго админа нельзя ни отсюда, ни с
                    // сервера; лишнего — можно перевести в руководители.
                    // Руководителю проектов роли показываются без кнопки.
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                      {ROLE_BADGE[member.role]}
                    </span>
                  ) : (
                    <form action={changeRole} className="flex items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={member.role === "head" ? "manager" : "head"}
                      />
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                        {ROLE_BADGE[member.role]}
                      </span>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {member.role === "head" ? "сделать менеджером" : "сделать руководителем"}
                      </button>
                    </form>
                  )}
                </td>
                <td data-label="Руководитель" className="px-4 py-3">
                  {member.role === "admin" ? (
                    <span className="text-xs text-faint">—</span>
                  ) : !manages ? (
                    // Руководитель берёт к себе только ничьего менеджера.
                    // Своего — не отпускает: кнопки «открепить» у него нет,
                    // это решение владельца.
                    member.head_staff_id === viewer.id ? (
                      <span className="text-xs text-green">
                        вы
                        <span className="block text-faint">открепляет владелец</span>
                      </span>
                    ) : member.head_staff_id ? (
                      <span className="text-xs text-muted">
                        {nameById.get(member.head_staff_id) ?? "—"}
                      </span>
                    ) : member.role === "manager" && viewer.role === "head" ? (
                      <form action={claim} className="flex items-center gap-2">
                        <input type="hidden" name="staff" value={member.id} />
                        <span className="text-xs text-muted">без руководителя</span>
                        <button type="submit" className="text-xs text-faint hover:text-green">
                          взять к себе
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted">без руководителя</span>
                    )
                  ) : (
                    // Кто чей: от этого зависит, чью статистику и финансы
                    // видит руководитель. Список — только активные
                    // руководители; себя назначить нельзя.
                    <form action={assignHead} className="flex items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <select
                        name="head"
                        defaultValue={member.head_staff_id ?? ""}
                        className="rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      >
                        <option value="">без руководителя</option>
                        {heads
                          .filter((head) => head.id !== member.id)
                          .map((head) => (
                            <option key={head.id} value={head.id}>
                              {head.display_name}
                            </option>
                          ))}
                      </select>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        сохранить
                      </button>
                    </form>
                  )}
                </td>
                <td data-label="Грейд и ставка" className="px-4 py-3">
                  {member.role === "admin" ? (
                    <span className="text-xs text-faint">—</span>
                  ) : !manages ? (
                    <span className="text-xs text-muted">
                      {GRADE_TITLE[member.grade]}
                      {member.rate_percent === null ? null : (
                        <span className="ml-1 font-mono text-faint">{member.rate_percent} %</span>
                      )}
                    </span>
                  ) : (
                    // Грейд задаёт процент от прибыли; персональная ставка, если
                    // договорились отдельно, заменяет грейдовую на новых клиентах.
                    <form action={setGrade} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <select
                        name="grade"
                        defaultValue={member.grade}
                        className="rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      >
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {GRADE_TITLE[grade]}
                          </option>
                        ))}
                      </select>
                      <input
                        name="rate"
                        inputMode="numeric"
                        placeholder="по грейду"
                        defaultValue={member.rate_percent ?? ""}
                        aria-label="Персональная ставка, %"
                        className="w-24 rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      />
                      <span className="text-xs text-faint">%</span>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        сохранить
                      </button>
                    </form>
                  )}
                </td>
                {/* План на неделю. Ставит владелец — любому, руководитель —
                    своим: план, который человек ставит сам, это не план.
                    Пустое поле снимает план, и это не то же самое, что ноль:
                    «осталось 0 из 0» тому, кому план не ставили, — неправда. */}
                <td data-label="План касаний" className="px-4 py-3">
                  {member.role === "admin" ? (
                    <span className="text-xs text-faint">—</span>
                  ) : viewer.role === "admin" || member.head_staff_id === viewer.id ? (
                    <form action={setPlan} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <input
                        name="plan"
                        inputMode="numeric"
                        placeholder="без плана"
                        defaultValue={member.touch_plan ?? ""}
                        aria-label="Касаний в неделю"
                        className="w-24 rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      />
                      <span className="text-xs text-faint">в неделю</span>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        сохранить
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted">
                      {member.touch_plan === null ? "без плана" : `${member.touch_plan} в неделю`}
                    </span>
                  )}
                </td>
                <td data-label="С какого дня" className="px-4 py-3 text-xs text-faint">{when(member.created_at)}</td>
                <td data-label="" className="px-4 py-3">
                  <div className="flex flex-col items-start gap-2">
                    {/* Доступна всегда, а не только после неудачи: прислать
                        приглашение заново тому, кто его потерял, дешевле,
                        чем объяснять по телефону, куда заходить. */}
                    <form action={resend}>
                      <input type="hidden" name="staff" value={member.id} />
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        отправить приглашение
                      </button>
                    </form>
                    {!manages || member.id === viewer.id ? null : (
                      <DisableBlock
                        id={member.id}
                        name={member.display_name}
                        handle={member.username}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {active.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                  Пусто — а значит, и эту страницу открыть было некому. База недоступна?
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Кто ушёл ────────────────────────────────────────────────────── */}
      {gone.length ? (
        <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-faint">Отключённые</p>
          <p className="mt-1 text-xs text-faint">
            Не удалены намеренно: за ними остаются лиды, сообщения и записи журнала, и
            обнулять авторство задним числом нельзя.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {gone.map((member) => (
              <li key={member.id} className="text-sm text-muted">
                {member.display_name}
                <span className="ml-2 font-mono text-xs text-faint">
                  {member.username ? `@${member.username}` : `id ${member.telegram_user_id}`}
                </span>
                {member.disabled_at ? (
                  <span className="ml-2 text-xs text-faint">
                    отключён {when(member.disabled_at)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">
            Чтобы вернуть человека — заведите его снова по тому же Telegram id: включится
            прежняя запись, а не новая.
          </p>
        </section>
      ) : null}

      {/* ── Завести ─────────────────────────────────────────────────────── */}
      <section className="mt-6 max-w-2xl rounded-xl border border-line bg-surface px-5 py-4">
        <p className="text-xs uppercase tracking-wider text-faint">Завести сотрудника</p>
        <p className="mt-1 text-xs text-faint">
          Числовой id человек узнаёт у любого бота вроде @userinfobot и присылает вам. По
          username завести нельзя: освободившийся ник займёт кто угодно.
          {viewer.role === "head" ? " Заведённый вами менеджер сразу закрепляется за вами." : null}
        </p>

        <form action={addStaff} className="mt-4 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-faint">
              Telegram id
              <input
                name="telegram_id"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                placeholder="123456789"
                className={`mt-1 ${INPUT}`}
              />
            </label>
            <label className="text-xs text-faint">
              Имя в панели
              <input name="display_name" required placeholder="Иван" className={`mt-1 ${INPUT}`} />
            </label>
            <label className="text-xs text-faint">
              Username <span className="text-faint">(не обязателен)</span>
              <input name="username" placeholder="ivan" className={`mt-1 ${INPUT}`} />
            </label>
            <label className="text-xs text-faint">
              Роль
              {canHire.length > 1 ? (
                <select name="role" defaultValue="manager" className={`mt-1 ${INPUT}`}>
                  {canHire.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_TITLE[role]}
                    </option>
                  ))}
                </select>
              ) : (
                // Выбора нет — и поля выбора тоже: раскрывающийся список с
                // единственным пунктом выглядит как поломка. Значение уходит
                // скрытым полем, но решает всё равно сервер.
                <>
                  <input type="hidden" name="role" value={canHire[0]} />
                  <p className="mt-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
                    {ROLE_TITLE[canHire[0]]}
                  </p>
                </>
              )}
            </label>
          </div>
          <button type="submit" className={`self-start ${BUTTON}`}>
            Завести
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

/**
 * Отключение с разворачивающимся предупреждением.
 *
 * `<details>`, а не окно подтверждения на JavaScript: страница серверная, и
 * тащить ради одной кнопки клиентский компонент — значит грузить его всем и
 * всегда. Но главное не в этом: `confirm()` показывает одну строку, которую
 * не читают, а здесь список последствий стоит прямо над кнопкой, и его
 * приходится проскроллить, чтобы до неё добраться.
 */
function DisableBlock({
  id,
  name,
  handle,
}: {
  id: string;
  name: string;
  handle: string | null;
}) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs text-faint transition hover:text-gold">
        Отключить
      </summary>
      <div className="mt-2 w-72 rounded-lg border border-gold/30 bg-gold/5 px-3 py-3">
        <p className="text-xs text-gold">Что произойдёт с «{name}»:</p>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-xs text-muted">
          <li>Сессии оборвутся сразу, ссылки входа перестанут работать, кнопки бота — тоже.</li>
          <li>Новые лиды ему больше не придут — ни в очередь, ни рассылкой.</li>
          <li>
            Лиды в работе <b>вернутся в очередь</b> и уйдут другим по обычным правилам. Его
            очередь на лид передастся следующему сразу.
          </li>
          <li>
            Идущие переписки из касаний перейдут его руководителю, а если его нет — вам.
            Неотправленные касания вернутся в общий пул.
          </li>
          <li>Напоминания и просьбы о передаче лидов закроются.</li>
          <li>Если он руководитель — его менеджеры станут ничьими.</li>
          <li>
            Карточки лидов из его Telegram удалятся (за последние 48 часов — так позволяет
            Telegram), у более старых пропадут кнопки.
          </li>
          <li>
            История остаётся: закрытые лиды, проекты, начисления и журнал — за ним, авторство
            не стирается.
          </li>
        </ul>
        {/* Единственный пункт, который система выполнить не может, — и
            единственный, из-за которого «отключённый» человек продолжит
            видеть каждого нового клиента. Поэтому он отдельно и последним:
            последнее читают. */}
        <p className="mt-3 rounded border border-gold/40 bg-gold/10 px-2 py-2 text-xs text-gold">
          Этого система сделать не может: удалите <b>{handle ? `@${handle}` : name}</b> руками из
          общих мест в Telegram — канала сигналов «Поиска» и общего чата отдела продаж, если он
          есть. Бот не может выгнать человека из канала, а оттуда он продолжит видеть сигналы и
          лиды.
        </p>

        <form action={disable} className="mt-3">
          <input type="hidden" name="staff" value={id} />
          <button
            type="submit"
            className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/20"
          >
            Понятно, отключить
          </button>
        </form>
      </div>
    </details>
  );
}
