import { readHealth } from "@/lib/admin/sweep-health";

/**
 * Плашка о том, что напоминания не доставляются.
 *
 * Свип умеет сообщить об аварии сам, в чат отдела продаж, — но только про
 * ту, которую он застал: код, который не выполняется, о себе не сообщает.
 * Если таймер не запустился, контейнер лежит или секрет не доехал, свип
 * просто молчит, и молчание неотличимо от «напоминать было нечего».
 *
 * Эту дыру закрывает last_ok_at. Протухшее значение видно глазом на
 * первой же странице панели — и видно тому, кто как раз ждёт напоминания.
 */

/** Свип ходит раз в пять минут; полчаса тишины — это шесть пропусков. */
const STALE_MINUTES = 30;

export async function SweepBanner() {
  const health = await readHealth();
  // Записи нет вовсе — свип ещё ни разу не отработал после выката. Это не
  // авария: пугать ею в первые пять минут после релиза не за что.
  if (!health) return null;

  const last = health.last_ok_at ? Date.parse(health.last_ok_at) : NaN;
  const minutes = Number.isFinite(last) ? Math.round((Date.now() - last) / 60000) : null;
  const stale = minutes === null || minutes > STALE_MINUTES;

  if (!stale && !health.alerted) return null;

  return (
    <p className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
      <b>Напоминания не доставляются.</b>{" "}
      {minutes === null
        ? "Свип ни разу не отработал успешно."
        : `Последний удачный проход был ${minutes} мин назад — ходить он должен раз в пять.`}
      {health.last_error ? (
        <>
          {" "}
          Последняя ошибка: <code className="font-mono text-xs">{health.last_error}</code>
        </>
      ) : null}{" "}
      <span className="text-faint">
        Проверьте на сервере: systemctl status devuz-reminders.timer и переменную
        REMINDER_SWEEP_SECRET.
      </span>
    </p>
  );
}
