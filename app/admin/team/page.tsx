import { addStaff, changeRole, disable } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { when } from "@/components/admin/lead-table";
import { requireAdmin } from "@/lib/admin/guard";
import { listTeam } from "@/lib/admin/team";

export const dynamic = "force-dynamic";

const RESULT: Record<string, { text: string; tone: "ok" | "warn" }> = {
  ok: { text: "Готово.", tone: "ok" },
  reactivated: { text: "Сотрудник включён обратно — это его прежняя запись со всей историей.", tone: "ok" },
  exists: { text: "Такой Telegram id уже заведён и работает.", tone: "warn" },
  invalid: { text: "Нужны числовой Telegram id и имя.", tone: "warn" },
  self: { text: "Себя отключить или разжаловать нельзя — вернуться в панель будет некому.", tone: "warn" },
  last_admin: { text: "Это последний админ. Сначала назначьте второго.", tone: "warn" },
  gone: { text: "Такого сотрудника уже нет.", tone: "warn" },
  offline: { text: "База недоступна.", tone: "warn" },
  failed: { text: "Не получилось.", tone: "warn" },
};

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const admin = await requireAdmin();
  const { r } = await searchParams;
  const team = await listTeam();

  const active = team.filter((m) => m.is_active);
  const gone = team.filter((m) => !m.is_active);
  const admins = active.filter((m) => m.role === "admin").length;
  const notice = r ? RESULT[r] : null;

  return (
    <AdminShell staff={admin}>
      <h1 className="text-lg font-semibold">Команда</h1>
      <p className="mt-1 text-sm text-muted">
        Вход в панель — по числовому id в Telegram. Пароля нет: username человек меняет за
        секунду, id — никогда.
      </p>

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

      {/* ── Кто работает ────────────────────────────────────────────────── */}
      {/* overflow-x-auto, а не overflow-hidden: на телефоне пять колонок не
          помещаются, и спрятанными оказывались роль, дата и сама кнопка
          «Отключить» — то есть с телефона отключить сотрудника было нельзя
          вовсе. Так же устроены остальные таблицы панели. */}
      <section className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3 font-normal">Кто</th>
              <th className="px-4 py-3 font-normal">Telegram</th>
              <th className="px-4 py-3 font-normal">Роль</th>
              <th className="px-4 py-3 font-normal">С какого дня</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {active.map((member) => (
              <tr key={member.id} className="border-b border-line-soft last:border-0 align-top">
                <td className="px-4 py-3">
                  {member.display_name}
                  {member.id === admin.id ? (
                    <span className="ml-2 text-xs text-faint">это вы</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {member.username ? `@${member.username}` : "—"}
                  <span className="block text-faint">id {member.telegram_user_id}</span>
                </td>
                <td className="px-4 py-3">
                  <form action={changeRole} className="flex items-center gap-2">
                    <input type="hidden" name="staff" value={member.id} />
                    <input
                      type="hidden"
                      name="role"
                      value={member.role === "admin" ? "manager" : "admin"}
                    />
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                      {member.role === "admin" ? "админ" : "менеджер"}
                    </span>
                    {/* Себя не разжаловать и последнего админа не снять —
                        то же правило стоит и на сервере; здесь кнопка просто
                        не предлагает того, что всё равно откажут. */}
                    {member.id === admin.id || (member.role === "admin" && admins <= 1) ? null : (
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {member.role === "admin" ? "сделать менеджером" : "сделать админом"}
                      </button>
                    )}
                  </form>
                </td>
                <td className="px-4 py-3 text-xs text-faint">{when(member.created_at)}</td>
                <td className="px-4 py-3">
                  {member.id === admin.id ? null : (
                    <DisableBlock
                      id={member.id}
                      name={member.display_name}
                      handle={member.username}
                    />
                  )}
                </td>
              </tr>
            ))}
            {active.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-muted">
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
              <select name="role" defaultValue="manager" className={`mt-1 ${INPUT}`}>
                <option value="manager">менеджер</option>
                <option value="admin">админ</option>
              </select>
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
          <li>Его сессии оборвутся сразу — не через двенадцать часов.</li>
          <li>Выданные ссылки входа перестанут работать, новых бот не даст.</li>
          <li>Лиды, сообщения и журнал останутся за ним: авторство не стирается.</li>
          <li>
            Взятые им лиды <b>останутся закреплены за ним</b> — переназначьте их, иначе
            трогать эти карточки сможет только админ.
          </li>
        </ul>
        {/* Единственный пункт, который система выполнить не может, — и
            единственный, из-за которого «отключённый» человек продолжит
            видеть каждого нового клиента. Поэтому он отдельно и последним:
            последнее читают. */}
        <p className="mt-3 rounded border border-gold/40 bg-gold/10 px-2 py-2 text-xs text-gold">
          Этого система сделать не может: удалите{" "}
          <b>{handle ? `@${handle}` : name}</b> из чата отдела продаж в Telegram руками.
          Иначе он продолжит получать брифы по всем новым лидам.
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
